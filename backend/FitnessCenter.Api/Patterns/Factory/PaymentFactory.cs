using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Patterns.Factory;

public record PaymentRequest(
    PaymentMethod Method,
    decimal GrossAmount,
    string? CardHolderName = null,
    string? CardNumber = null,
    string? CardExpiry = null,
    string? PromptPayId = null);

/// <summary>Factory Pattern: hides which concrete Payment subclass is instantiated.</summary>
public interface IPaymentFactory
{
    Payment Create(PaymentRequest request, Member member, Subscription? subscription);
}

public class PaymentFactory : IPaymentFactory
{
    public Payment Create(PaymentRequest request, Member member, Subscription? subscription)
    {
        if (request.GrossAmount <= 0)
            throw new ArgumentException("ยอดชำระต้องมากกว่าศูนย์");

        return request.Method switch
        {
            PaymentMethod.CREDIT_CARD => CreateCreditCard(request, member, subscription),
            PaymentMethod.PROMPT_PAY => CreatePromptPay(request, member, subscription),
            _ => throw new NotSupportedException($"ไม่รองรับวิธีชำระเงิน '{request.Method}'")
        };
    }

    private static Payment CreateCreditCard(PaymentRequest r, Member member, Subscription? subscription)
    {
        if (string.IsNullOrWhiteSpace(r.CardNumber) || string.IsNullOrWhiteSpace(r.CardHolderName) || string.IsNullOrWhiteSpace(r.CardExpiry))
            throw new ArgumentException("กรุณากรอกชื่อบนบัตร หมายเลขบัตร และวันหมดอายุสำหรับการชำระด้วยบัตรเครดิต");

        return new CreditCardPayment(member, subscription, r.GrossAmount, r.CardHolderName!, r.CardNumber!, r.CardExpiry!);
    }

    private static Payment CreatePromptPay(PaymentRequest r, Member member, Subscription? subscription)
    {
        var promptPayId = string.IsNullOrWhiteSpace(r.PromptPayId) ? member.PhoneNumber : r.PromptPayId;
        if (string.IsNullOrWhiteSpace(promptPayId))
            throw new ArgumentException("ต้องระบุ PromptPay ID หรือมีเบอร์โทรศัพท์ในโปรไฟล์");

        return new PromptPayPayment(member, subscription, r.GrossAmount, promptPayId!);
    }
}
