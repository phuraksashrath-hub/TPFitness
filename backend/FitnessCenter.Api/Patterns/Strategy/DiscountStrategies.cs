namespace FitnessCenter.Api.Patterns.Strategy;

public class NoDiscountStrategy : IDiscountStrategy
{
    public string Name => "NONE";
    public bool IsApplicable(DiscountContext context) => true;
    public DiscountResult Calculate(DiscountContext context) => DiscountResult.None;
}

/// <summary>Fixed promo codes handed out by marketing.</summary>
public class PromoCodeDiscountStrategy : IDiscountStrategy
{
    private static readonly Dictionary<string, decimal> Codes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["FITPULSE10"] = 0.10m,
        ["NEWYEAR20"] = 0.20m,
        ["VIP25"] = 0.25m
    };

    public string Name => "PROMO_CODE";

    public bool IsApplicable(DiscountContext context) =>
        !string.IsNullOrWhiteSpace(context.PromoCode) && Codes.ContainsKey(context.PromoCode!.Trim());

    public DiscountResult Calculate(DiscountContext context)
    {
        var code = context.PromoCode!.Trim();
        var rate = Codes[code];
        return new DiscountResult(Math.Round(context.GrossAmount * rate, 2), $"โค้ดส่วนลด {code.ToUpperInvariant()} (-{rate:P0})");
    }
}

/// <summary>Loyalty tier: the more completed payments, the bigger the cut.</summary>
public class LoyaltyDiscountStrategy : IDiscountStrategy
{
    public string Name => "LOYALTY";

    public bool IsApplicable(DiscountContext context) => context.PreviousPaidPayments >= 3;

    public DiscountResult Calculate(DiscountContext context)
    {
        var rate = context.PreviousPaidPayments switch
        {
            >= 12 => 0.15m,
            >= 6 => 0.10m,
            _ => 0.05m
        };
        return new DiscountResult(Math.Round(context.GrossAmount * rate, 2), $"ส่วนลดสมาชิกเก่า (-{rate:P0})");
    }
}

/// <summary>Long commitment plans get a bulk discount.</summary>
public class LongTermPlanDiscountStrategy : IDiscountStrategy
{
    public string Name => "LONG_TERM_PLAN";

    public bool IsApplicable(DiscountContext context) => context.Plan is { DurationDays: >= 180 };

    public DiscountResult Calculate(DiscountContext context)
    {
        var rate = context.Plan!.DurationDays >= 365 ? 0.18m : 0.12m;
        return new DiscountResult(Math.Round(context.GrossAmount * rate, 2), $"ส่วนลดแพ็กเกจระยะยาว (-{rate:P0})");
    }
}

/// <summary>Birthday month treat for the member.</summary>
public class BirthdayDiscountStrategy : IDiscountStrategy
{
    public string Name => "BIRTHDAY";

    public bool IsApplicable(DiscountContext context) =>
        context.Member.DateOfBirth.HasValue &&
        context.Member.DateOfBirth.Value.Month == context.Now.Month;

    public DiscountResult Calculate(DiscountContext context) =>
        new(Math.Round(context.GrossAmount * 0.10m, 2), "ส่วนลดเดือนเกิด (-10%)");
}
