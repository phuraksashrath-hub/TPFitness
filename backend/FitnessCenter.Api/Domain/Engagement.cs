namespace FitnessCenter.Api.Domain;

/// <summary>
/// A window in which a trainer does not take PT bookings (leave, studio class, admin time).
/// Bookings and the availability grid treat it like a booked slot.
/// </summary>
public class TrainerBlock
{
    public int Id { get; private set; }
    public int TrainerId { get; private set; }
    public Trainer Trainer { get; private set; } = null!;
    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public string? Reason { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private TrainerBlock() { }

    public TrainerBlock(int trainerId, DateTime startTime, DateTime endTime, string? reason)
    {
        if (endTime <= startTime)
            throw new ArgumentException("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");

        TrainerId = trainerId;
        StartTime = startTime;
        EndTime = endTime;
        Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }
}

/// <summary>Append-only record of who did what. Written by <c>AuditActionFilter</c> and the auth service.</summary>
public class AuditLog
{
    public int Id { get; private set; }
    public DateTime OccurredAt { get; private set; } = DateTime.UtcNow;
    public int? ActorId { get; private set; }
    public string ActorName { get; private set; } = string.Empty;
    public string ActorRole { get; private set; } = string.Empty;
    /// <summary>ACCESS, BILLING, BOOKING, CLASS, BRANCH, PEOPLE, FACILITY, PROGRAM, CATALOG, SCHEDULE or LEAD.</summary>
    public string Category { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string? Detail { get; private set; }
    /// <summary>SUCCESS or DENIED.</summary>
    public string Outcome { get; private set; } = "SUCCESS";

    private AuditLog() { }

    public AuditLog(int? actorId, string actorName, string actorRole, string category, string action, string? detail, string outcome)
    {
        ActorId = actorId;
        ActorName = actorName;
        ActorRole = actorRole;
        Category = category;
        Action = action;
        Detail = detail;
        Outcome = outcome;
    }
}

public enum LeadStatus
{
    NEW = 0,
    CONTACTED = 1
}

/// <summary>A visitor who asked for the 3-day free pass from the landing page.</summary>
public class TrialLead
{
    public int Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? PreferredTime { get; private set; }
    public LeadStatus Status { get; private set; } = LeadStatus.NEW;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private TrialLead() { }

    public TrialLead(string fullName, string phone, string? email, string? preferredTime)
    {
        FullName = fullName.Trim();
        Phone = phone.Trim();
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        PreferredTime = string.IsNullOrWhiteSpace(preferredTime) ? null : preferredTime.Trim();
    }

    public void SetStatus(LeadStatus status) => Status = status;
}
