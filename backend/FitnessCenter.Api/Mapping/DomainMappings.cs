using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;

namespace FitnessCenter.Api.Mapping;

public static class DomainMappings
{
    private const char PerkSeparator = '|';

    public static UserProfileDto ToProfileDto(this User user) => new(
        user.Id, user.Email, user.FullName, user.PhoneNumber, user.AvatarUrl,
        user.Role.ToString(), user.Status.ToString(), user.GetDisplayTitle(), user.CreatedAt);

    public static MemberMetricsDto ToMetricsDto(this Member m) => new(
        m.DateOfBirth, m.Gender, m.HeightCm, m.WeightKg, m.BodyFatPercent, m.MuscleMassKg,
        m.FitnessGoal, m.EmergencyContact);

    public static TrainerDto ToDto(this Trainer t) => new(
        t.Id, t.FullName, t.Email, t.AvatarUrl, t.Specialization, t.Bio, t.Certifications,
        t.YearsOfExperience, t.HourlyRate, t.RatingAverage, t.RatingCount);

    public static MembershipPlanDto ToDto(this MembershipPlan p) => new(
        p.Id, p.Name, p.Description, p.Price, p.DurationDays, p.SessionsPerMonth, p.Tier,
        SplitPerks(p.Perks), p.IsActive);

    public static IReadOnlyList<string> SplitPerks(string? perks) =>
        string.IsNullOrWhiteSpace(perks)
            ? Array.Empty<string>()
            : perks.Split(PerkSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public static string? JoinPerks(IReadOnlyList<string>? perks) =>
        perks is null || perks.Count == 0 ? null : string.Join(PerkSeparator, perks);

    public static SubscriptionDto ToDto(this Subscription s, DateTime now) => new(
        s.Id, s.MemberId, s.Member?.FullName ?? string.Empty, s.MembershipPlan.ToDto(),
        s.StartDate, s.EndDate, s.RemainingSessions, s.DaysRemaining(now),
        s.Status.ToString(), s.AutoRenew, s.IsUsable(now));

    public static PaymentDto ToDto(this Payment p) => new(
        p.Id, p.TransactionReference, p.Method.ToString(), p.GrossAmount, p.DiscountAmount,
        p.NetAmount, p.DiscountLabel, p.Status.ToString(), p.CreatedAt, p.PaidAt,
        p.Member?.FullName, p.Subscription?.MembershipPlan?.Name,
        (p as PromptPayPayment)?.QrPayload,
        (p as CreditCardPayment)?.CardLast4,
        (p as CreditCardPayment)?.CardBrand);

    public static WorkoutSessionDto ToDto(this WorkoutSession s) => new(
        s.Id, s.MemberId, s.Member?.FullName ?? string.Empty, s.Member?.AvatarUrl,
        s.TrainerId, s.Trainer?.FullName ?? string.Empty, s.Trainer?.Specialization,
        s.StartTime, s.EndTime, s.Status.ToString(), s.Notes, s.CancellationReason);

    public static WorkoutExerciseDto ToDto(this WorkoutExercise e) => new(
        e.Id, e.Name, e.DayOfWeek, e.Sets, e.Reps, e.WeightKg, e.RestSeconds, e.Notes);

    public static WorkoutProgramDto ToDto(this WorkoutProgram p) => new(
        p.Id, p.MemberId, p.Member?.FullName ?? string.Empty, p.TrainerId, p.Trainer?.FullName ?? string.Empty,
        p.Title, p.Goal, p.Description, p.DurationWeeks, p.Difficulty, p.IsActive, p.CreatedAt,
        p.Exercises.OrderBy(e => e.DayOfWeek).Select(ToDto).ToList());

    public static EquipmentDto ToDto(this Equipment e, int openIssues) => new(
        e.Id, e.Name, e.SerialNumber, e.Category, e.Brand, e.Location, e.PurchaseDate,
        e.LastServicedAt, e.Status.ToString(), e.ImageUrl, openIssues);

    public static MaintenanceRequestDto ToDto(this MaintenanceRequest m) => new(
        m.Id, m.EquipmentId, m.Equipment?.Name ?? string.Empty, m.Equipment?.Location,
        m.Title, m.Description, m.Priority.ToString(), m.Status.ToString(),
        m.ReportedBy?.FullName ?? string.Empty, m.AssignedTo?.FullName,
        m.ResolutionNotes, m.RepairCost, m.ReportedAt, m.ResolvedAt);
}
