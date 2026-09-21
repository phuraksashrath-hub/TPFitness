namespace FitnessCenter.Api.Domain;

public class Trainer : User
{
    public string? Specialization { get; private set; }
    public string? Bio { get; private set; }
    public string? Certifications { get; private set; }
    public int YearsOfExperience { get; private set; }
    public decimal HourlyRate { get; private set; }
    public decimal RatingAverage { get; private set; }
    public int RatingCount { get; private set; }

    public ICollection<WorkoutSession> Sessions { get; private set; } = new List<WorkoutSession>();
    public ICollection<WorkoutProgram> Programs { get; private set; } = new List<WorkoutProgram>();

    private Trainer() { }

    public Trainer(string email, string passwordHash, string fullName, string? phoneNumber)
        : base(email, passwordHash, fullName, phoneNumber)
    {
        Role = UserRole.TRAINER;
    }

    public override string GetDisplayTitle() =>
        string.IsNullOrWhiteSpace(Specialization) ? $"{FullName} · Trainer" : $"{FullName} · {Specialization}";

    public void UpdateExpertise(string? specialization, string? bio, string? certifications, int yearsOfExperience, decimal hourlyRate)
    {
        Specialization = specialization;
        Bio = bio;
        Certifications = certifications;
        YearsOfExperience = Math.Max(0, yearsOfExperience);
        HourlyRate = Math.Max(0, hourlyRate);
    }

    public void AddRating(int stars)
    {
        stars = Math.Clamp(stars, 1, 5);
        var total = RatingAverage * RatingCount + stars;
        RatingCount++;
        RatingAverage = Math.Round(total / RatingCount, 2);
    }
}

public class Admin : User
{
    public string? Department { get; private set; }

    private Admin() { }

    public Admin(string email, string passwordHash, string fullName, string? phoneNumber)
        : base(email, passwordHash, fullName, phoneNumber)
    {
        Role = UserRole.ADMIN;
    }

    public override string GetDisplayTitle() => $"{FullName} · Admin";

    public void SetDepartment(string? department) => Department = department;
}
