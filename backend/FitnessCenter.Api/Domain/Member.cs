namespace FitnessCenter.Api.Domain;

public class Member : User
{
    public DateTime? DateOfBirth { get; private set; }
    public string? Gender { get; private set; }
    public decimal? HeightCm { get; private set; }
    public decimal? WeightKg { get; private set; }
    public string? FitnessGoal { get; private set; }
    public string? EmergencyContact { get; private set; }
    public decimal? BodyFatPercent { get; private set; }
    public decimal? MuscleMassKg { get; private set; }

    public ICollection<Subscription> Subscriptions { get; private set; } = new List<Subscription>();
    public ICollection<WorkoutSession> Sessions { get; private set; } = new List<WorkoutSession>();
    public ICollection<WorkoutProgram> Programs { get; private set; } = new List<WorkoutProgram>();
    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    private Member() { }

    public Member(string email, string passwordHash, string fullName, string? phoneNumber)
        : base(email, passwordHash, fullName, phoneNumber)
    {
        Role = UserRole.MEMBER;
    }

    public override string GetDisplayTitle() => $"{FullName} · Member";

    public void UpdateBodyMetrics(DateTime? dateOfBirth, string? gender, decimal? heightCm, decimal? weightKg, string? fitnessGoal, string? emergencyContact,
        decimal? bodyFatPercent = null, decimal? muscleMassKg = null)
    {
        DateOfBirth = dateOfBirth;
        Gender = gender;
        HeightCm = heightCm;
        WeightKg = weightKg;
        FitnessGoal = fitnessGoal;
        EmergencyContact = emergencyContact;
        BodyFatPercent = bodyFatPercent;
        MuscleMassKg = muscleMassKg;
    }

    /// <summary>Business rule #1: an account may only book while it is ACTIVE.</summary>
    public bool CanBook() => Status == UserStatus.ACTIVE;
}
