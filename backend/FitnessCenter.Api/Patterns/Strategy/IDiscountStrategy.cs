using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Patterns.Strategy;

/// <summary>Input data every discount rule may inspect.</summary>
public record DiscountContext(
    Member Member,
    MembershipPlan? Plan,
    decimal GrossAmount,
    string? PromoCode,
    int PreviousPaidPayments,
    DateTime Now);

public record DiscountResult(decimal Amount, string Label)
{
    public static DiscountResult None => new(0m, "ไม่มีส่วนลด");
}

/// <summary>Strategy Pattern: interchangeable discount algorithms.</summary>
public interface IDiscountStrategy
{
    string Name { get; }
    bool IsApplicable(DiscountContext context);
    DiscountResult Calculate(DiscountContext context);
}
