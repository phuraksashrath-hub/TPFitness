namespace FitnessCenter.Api.Domain;

public class Subscription
{
    public int Id { get; private set; }

    public int MemberId { get; private set; }
    public Member Member { get; private set; } = null!;

    public int MembershipPlanId { get; private set; }
    public MembershipPlan MembershipPlan { get; private set; } = null!;

    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int RemainingSessions { get; private set; }
    public SubscriptionStatus Status { get; private set; } = SubscriptionStatus.PENDING_PAYMENT;
    public bool AutoRenew { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    private Subscription() { }

    public Subscription(Member member, MembershipPlan plan, DateTime startDate, bool autoRenew = false)
    {
        Member = member;
        MemberId = member.Id;
        MembershipPlan = plan;
        MembershipPlanId = plan.Id;
        StartDate = startDate;
        EndDate = startDate.AddDays(plan.DurationDays);
        RemainingSessions = CalculateSessionQuota(plan);
        AutoRenew = autoRenew;
    }

    /// <summary>Business rule #1: ACTIVE status AND not past its end date.</summary>
    public bool IsUsable(DateTime now) => Status == SubscriptionStatus.ACTIVE && EndDate > now;

    /// <summary>Business rule #2: booking requires remaining_sessions &gt; 0.</summary>
    public bool HasSessionQuota() => RemainingSessions > 0;

    public int DaysRemaining(DateTime now) => Math.Max(0, (int)Math.Ceiling((EndDate - now).TotalDays));

    public void Activate() => Status = SubscriptionStatus.ACTIVE;

    public void Cancel() => Status = SubscriptionStatus.CANCELLED;

    public void RefreshExpiry(DateTime now)
    {
        if (Status == SubscriptionStatus.ACTIVE && EndDate <= now)
            Status = SubscriptionStatus.EXPIRED;
    }

    public void ConsumeSession()
    {
        if (RemainingSessions <= 0)
            throw new InvalidOperationException("แพ็กเกจนี้ไม่มีเซสชันคงเหลือ");
        RemainingSessions--;
    }

    public void RestoreSession() => RemainingSessions++;

    /// <summary>Renewal extends from the later of today or the current end date, so members never lose days.</summary>
    public void Renew(DateTime now)
    {
        var anchor = EndDate > now ? EndDate : now;
        StartDate = now;
        EndDate = anchor.AddDays(MembershipPlan.DurationDays);
        RemainingSessions += CalculateSessionQuota(MembershipPlan);
        Status = SubscriptionStatus.ACTIVE;
    }

    public void SetAutoRenew(bool value) => AutoRenew = value;

    private static int CalculateSessionQuota(MembershipPlan plan)
    {
        var months = Math.Max(1, (int)Math.Round(plan.DurationDays / 30.0, MidpointRounding.AwayFromZero));
        return plan.SessionsPerMonth * months;
    }
}
