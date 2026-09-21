using System.Globalization;

namespace FitnessCenter.Api.Domain;

/// <summary>
/// Abstract payment. Concrete gateways (<see cref="CreditCardPayment"/>,
/// <see cref="PromptPayPayment"/>) are produced by the PaymentFactory and
/// differ only in how <see cref="Process"/> behaves (polymorphism).
/// </summary>
public abstract class Payment
{
    public int Id { get; protected set; }

    public int MemberId { get; private set; }
    public Member Member { get; private set; } = null!;

    public int? SubscriptionId { get; private set; }
    public Subscription? Subscription { get; private set; }

    public decimal GrossAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal NetAmount { get; private set; }
    public string? DiscountLabel { get; private set; }

    public abstract PaymentMethod Method { get; }

    public PaymentStatus Status { get; private set; } = PaymentStatus.PENDING;
    public string TransactionReference { get; private set; } = string.Empty;
    public string? FailureReason { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; private set; }

    protected Payment() { }

    protected Payment(Member member, Subscription? subscription, decimal grossAmount)
    {
        Member = member;
        MemberId = member.Id;
        Subscription = subscription;
        SubscriptionId = subscription?.Id;
        GrossAmount = grossAmount;
        NetAmount = grossAmount;
        TransactionReference = $"FP-{DateTime.UtcNow.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture)}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }

    /// <summary>Business rule #4: net amount is stored only after the discount strategy runs.</summary>
    public void ApplyDiscount(decimal discountAmount, string? label)
    {
        DiscountAmount = Math.Clamp(discountAmount, 0, GrossAmount);
        NetAmount = Math.Round(GrossAmount - DiscountAmount, 2);
        DiscountLabel = label;
    }

    /// <summary>Gateway-specific behaviour. Returns a human-readable receipt detail.</summary>
    public abstract string Process();

    public void MarkPaid()
    {
        Status = PaymentStatus.PAID;
        PaidAt = DateTime.UtcNow;
    }

    public void MarkFailed(string reason)
    {
        Status = PaymentStatus.FAILED;
        FailureReason = reason;
    }

    public void MarkRefunded() => Status = PaymentStatus.REFUNDED;
}

public class CreditCardPayment : Payment
{
    public string CardHolderName { get; private set; } = string.Empty;
    public string CardLast4 { get; private set; } = string.Empty;
    public string CardBrand { get; private set; } = "UNKNOWN";
    public string ExpiryMonthYear { get; private set; } = string.Empty;

    public override PaymentMethod Method => PaymentMethod.CREDIT_CARD;

    private CreditCardPayment() { }

    public CreditCardPayment(Member member, Subscription? subscription, decimal grossAmount,
        string cardHolderName, string cardNumber, string expiryMonthYear)
        : base(member, subscription, grossAmount)
    {
        var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
        if (digits.Length < 12)
            throw new ArgumentException("หมายเลขบัตรไม่ถูกต้อง");

        CardHolderName = cardHolderName;
        CardLast4 = digits[^4..];          // never persist the full PAN
        CardBrand = DetectBrand(digits);
        ExpiryMonthYear = expiryMonthYear;
    }

    public override string Process() =>
        string.Format(CultureInfo.InvariantCulture, "ตัดบัตร {1} ****{2} จำนวน {0:N2} บาทเรียบร้อยแล้ว", NetAmount, CardBrand, CardLast4);

    private static string DetectBrand(string digits) => digits[0] switch
    {
        '4' => "VISA",
        '5' => "MASTERCARD",
        '3' => "AMEX",
        '6' => "DISCOVER",
        _ => "UNKNOWN"
    };
}

public class PromptPayPayment : Payment
{
    public string PromptPayId { get; private set; } = string.Empty;
    public string QrPayload { get; private set; } = string.Empty;
    public DateTime QrExpiresAt { get; private set; }

    public override PaymentMethod Method => PaymentMethod.PROMPT_PAY;

    private PromptPayPayment() { }

    public PromptPayPayment(Member member, Subscription? subscription, decimal grossAmount, string promptPayId)
        : base(member, subscription, grossAmount)
    {
        PromptPayId = promptPayId;
        QrExpiresAt = DateTime.UtcNow.AddMinutes(15);
        QrPayload = $"00020101021229370016A0000006770101110113{promptPayId}5802TH";
    }

    public override string Process() =>
        string.Format(CultureInfo.InvariantCulture,
            "ออก QR PromptPay จำนวน {0:N2} บาท ไปยัง {1} ใช้ได้ถึง {2:HH:mm} น. (UTC)", NetAmount, PromptPayId, QrExpiresAt);
}
