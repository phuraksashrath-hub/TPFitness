namespace FitnessCenter.Api.Patterns.Strategy;

public interface IDiscountResolver
{
    DiscountResult ResolveBest(DiscountContext context);
    IReadOnlyList<DiscountResult> ResolveAllApplicable(DiscountContext context);
}

/// <summary>
/// Picks the single most valuable applicable strategy. Adding a new rule only
/// requires registering another <see cref="IDiscountStrategy"/> in DI.
/// </summary>
public class BestOfferDiscountResolver : IDiscountResolver
{
    private readonly IEnumerable<IDiscountStrategy> _strategies;

    public BestOfferDiscountResolver(IEnumerable<IDiscountStrategy> strategies) => _strategies = strategies;

    public IReadOnlyList<DiscountResult> ResolveAllApplicable(DiscountContext context) =>
        _strategies.Where(s => s.IsApplicable(context))
                   .Select(s => s.Calculate(context))
                   .Where(r => r.Amount > 0)
                   .OrderByDescending(r => r.Amount)
                   .ToList();

    public DiscountResult ResolveBest(DiscountContext context)
    {
        var applicable = ResolveAllApplicable(context);
        return applicable.Count == 0 ? DiscountResult.None : applicable[0];
    }
}
