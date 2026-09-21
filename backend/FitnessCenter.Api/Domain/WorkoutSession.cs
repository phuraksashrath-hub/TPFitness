namespace FitnessCenter.Api.Domain;

public class WorkoutSession
{
    public int Id { get; private set; }

    public int MemberId { get; private set; }
    public Member Member { get; private set; } = null!;

    public int TrainerId { get; private set; }
    public Trainer Trainer { get; private set; } = null!;

    public int? SubscriptionId { get; private set; }
    public Subscription? Subscription { get; private set; }

    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public SessionStatus Status { get; private set; } = SessionStatus.BOOKED;
    public string? Notes { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private WorkoutSession() { }

    public WorkoutSession(Member member, Trainer trainer, Subscription subscription, DateTime startTime, DateTime endTime, string? notes)
    {
        if (endTime <= startTime)
            throw new ArgumentException("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");

        Member = member;
        MemberId = member.Id;
        Trainer = trainer;
        TrainerId = trainer.Id;
        Subscription = subscription;
        SubscriptionId = subscription.Id;
        StartTime = startTime;
        EndTime = endTime;
        Notes = notes;
    }

    public bool Overlaps(DateTime start, DateTime end) => StartTime < end && start < EndTime;

    public void Reschedule(DateTime start, DateTime end)
    {
        if (Status != SessionStatus.BOOKED)
            throw new InvalidOperationException("เลื่อนได้เฉพาะเซสชันที่อยู่ในสถานะจองแล้ว");
        if (end <= start)
            throw new ArgumentException("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");

        StartTime = start;
        EndTime = end;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel(string? reason)
    {
        if (Status != SessionStatus.BOOKED)
            throw new InvalidOperationException("ยกเลิกได้เฉพาะเซสชันที่อยู่ในสถานะจองแล้ว");

        Status = SessionStatus.CANCELLED;
        CancellationReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Complete(string? notes)
    {
        Status = SessionStatus.COMPLETED;
        if (!string.IsNullOrWhiteSpace(notes)) Notes = notes;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkNoShow()
    {
        Status = SessionStatus.NO_SHOW;
        UpdatedAt = DateTime.UtcNow;
    }
}
