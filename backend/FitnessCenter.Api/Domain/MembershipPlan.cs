namespace FitnessCenter.Api.Domain;

public class MembershipPlan
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public int DurationDays { get; private set; }
    public int SessionsPerMonth { get; private set; }
    public string? Perks { get; private set; }
    public string Tier { get; private set; } = "STANDARD";
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<Subscription> Subscriptions { get; private set; } = new List<Subscription>();

    private MembershipPlan() { }

    public MembershipPlan(string name, string? description, decimal price, int durationDays, int sessionsPerMonth, string tier, string? perks)
    {
        Name = name;
        Description = description;
        Price = price;
        DurationDays = durationDays;
        SessionsPerMonth = sessionsPerMonth;
        Tier = tier;
        Perks = perks;
    }

    public void Update(string name, string? description, decimal price, int durationDays, int sessionsPerMonth, string tier, string? perks, bool isActive)
    {
        Name = name;
        Description = description;
        Price = price;
        DurationDays = durationDays;
        SessionsPerMonth = sessionsPerMonth;
        Tier = tier;
        Perks = perks;
        IsActive = isActive;
    }

    public void Deactivate() => IsActive = false;
}
