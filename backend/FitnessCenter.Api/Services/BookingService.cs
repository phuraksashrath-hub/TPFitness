using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IBookingService
{
    Task<WorkoutSessionDto> BookAsync(int memberId, BookSessionRequest request, CancellationToken ct = default);
    Task<WorkoutSessionDto> RescheduleAsync(int userId, UserRole role, int sessionId, RescheduleSessionRequest request, CancellationToken ct = default);
    Task<WorkoutSessionDto> CancelAsync(int userId, UserRole role, int sessionId, CancelSessionRequest request, CancellationToken ct = default);
    Task<WorkoutSessionDto> CompleteAsync(int trainerId, int sessionId, CompleteSessionRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<WorkoutSessionDto>> GetMemberSessionsAsync(int memberId, CancellationToken ct = default);
    Task<IReadOnlyList<WorkoutSessionDto>> GetTrainerSessionsAsync(int trainerId, DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<TrainerAvailabilityDto> GetAvailabilityAsync(int trainerId, DateTime date, int durationMinutes, CancellationToken ct = default);
}

public class BookingService : IBookingService
{
    private const int OpeningHour = 6;
    private const int ClosingHour = 22;
    private const int CancellationCutoffHours = 2;

    private readonly AppDbContext _db;
    private readonly TimeProvider _clock;

    public BookingService(AppDbContext db, TimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<WorkoutSessionDto> BookAsync(int memberId, BookSessionRequest request, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var start = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var end = start.AddMinutes(request.DurationMinutes);

        if (start <= now)
            throw new DomainException("จองได้เฉพาะช่วงเวลาในอนาคตเท่านั้น");
        if (start.Hour < OpeningHour || end.Hour > ClosingHour)
            throw new DomainException($"ฟิตเนสรับจองระหว่างเวลา {OpeningHour:00}:00 – {ClosingHour:00}:00 น. (UTC)");

        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == memberId, ct)
            ?? throw DomainException.NotFound("สมาชิก");

        if (!member.CanBook())
            throw DomainException.Forbidden("บัญชีของคุณถูกระงับ จึงไม่สามารถจองได้");

        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == request.TrainerId, ct)
            ?? throw DomainException.NotFound("เทรนเนอร์");

        if (trainer.Status != UserStatus.ACTIVE)
            throw new DomainException("เทรนเนอร์ท่านนี้ยังไม่เปิดรับจองในขณะนี้");

        var subscription = await LoadUsableSubscriptionAsync(memberId, now, ct);

        if (!subscription.HasSessionQuota())
            throw new DomainException("คุณไม่มีเซสชันคงเหลือ กรุณาต่ออายุหรืออัปเกรดแพ็กเกจเพื่อจองเพิ่ม");

        await EnsureTrainerIsFreeAsync(trainer.Id, start, end, null, ct);
        await EnsureMemberIsFreeAsync(memberId, start, end, null, ct);

        var session = new WorkoutSession(member, trainer, subscription, start, end, request.Notes);
        subscription.ConsumeSession();
        _db.WorkoutSessions.Add(session);

        await SaveWithConflictGuardAsync(ct);
        return session.ToDto();
    }

    public async Task<WorkoutSessionDto> RescheduleAsync(int userId, UserRole role, int sessionId, RescheduleSessionRequest request, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var session = await LoadSessionAsync(sessionId, ct);
        EnsureCanManage(session, userId, role);

        var start = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var end = start.AddMinutes(request.DurationMinutes);

        if (start <= now)
            throw new DomainException("เลื่อนเซสชันได้เฉพาะไปยังช่วงเวลาในอนาคตเท่านั้น");
        if (start.Hour < OpeningHour || end.Hour > ClosingHour)
            throw new DomainException($"ฟิตเนสรับจองระหว่างเวลา {OpeningHour:00}:00 – {ClosingHour:00}:00 น. (UTC)");

        await EnsureTrainerIsFreeAsync(session.TrainerId, start, end, session.Id, ct);
        await EnsureMemberIsFreeAsync(session.MemberId, start, end, session.Id, ct);

        session.Reschedule(start, end);
        await SaveWithConflictGuardAsync(ct);
        return session.ToDto();
    }

    public async Task<WorkoutSessionDto> CancelAsync(int userId, UserRole role, int sessionId, CancelSessionRequest request, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var session = await LoadSessionAsync(sessionId, ct);
        EnsureCanManage(session, userId, role);

        if (role == UserRole.MEMBER && session.StartTime - now < TimeSpan.FromHours(CancellationCutoffHours))
            throw new DomainException($"ต้องยกเลิกเซสชันล่วงหน้าอย่างน้อย {CancellationCutoffHours} ชั่วโมง");

        session.Cancel(request.Reason);

        // A cancelled slot returns the credit to the member's subscription.
        if (session.SubscriptionId is not null)
        {
            var subscription = await _db.Subscriptions.FirstOrDefaultAsync(s => s.Id == session.SubscriptionId, ct);
            subscription?.RestoreSession();
        }

        await _db.SaveChangesAsync(ct);
        return session.ToDto();
    }

    public async Task<WorkoutSessionDto> CompleteAsync(int trainerId, int sessionId, CompleteSessionRequest request, CancellationToken ct = default)
    {
        var session = await LoadSessionAsync(sessionId, ct);

        if (session.TrainerId != trainerId)
            throw DomainException.Forbidden("เฉพาะเทรนเนอร์ที่ได้รับมอบหมายเท่านั้นที่ปิดเซสชันนี้ได้");

        session.Complete(request.Notes);
        await _db.SaveChangesAsync(ct);
        return session.ToDto();
    }

    public async Task<IReadOnlyList<WorkoutSessionDto>> GetMemberSessionsAsync(int memberId, CancellationToken ct = default)
    {
        var sessions = await BaseQuery()
            .Where(s => s.MemberId == memberId)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync(ct);

        return sessions.Select(s => s.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<WorkoutSessionDto>> GetTrainerSessionsAsync(int trainerId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = BaseQuery().Where(s => s.TrainerId == trainerId);

        if (from.HasValue) query = query.Where(s => s.StartTime >= from.Value);
        if (to.HasValue) query = query.Where(s => s.StartTime < to.Value);

        var sessions = await query.OrderBy(s => s.StartTime).ToListAsync(ct);
        return sessions.Select(s => s.ToDto()).ToList();
    }

    public async Task<TrainerAvailabilityDto> GetAvailabilityAsync(int trainerId, DateTime date, int durationMinutes, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var day = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dayEnd = day.AddDays(1);

        if (!await _db.Trainers.AnyAsync(t => t.Id == trainerId, ct))
            throw DomainException.NotFound("เทรนเนอร์");

        var booked = await _db.WorkoutSessions
            .Where(s => s.TrainerId == trainerId && s.Status == SessionStatus.BOOKED
                        && s.StartTime < dayEnd && s.EndTime > day)
            .Select(s => new { s.StartTime, s.EndTime })
            .ToListAsync(ct);

        var blocks = await _db.TrainerBlocks
            .Where(b => b.TrainerId == trainerId && b.StartTime < dayEnd && b.EndTime > day)
            .Select(b => new { b.StartTime, b.EndTime })
            .ToListAsync(ct);

        // Teaching a group class occupies the trainer just like a block does.
        var teaching = await _db.GroupClasses
            .Where(c => c.InstructorId == trainerId && c.Status == ClassStatus.SCHEDULED && c.StartTime < dayEnd && c.EndTime > day)
            .Select(c => new { c.StartTime, c.EndTime })
            .ToListAsync(ct);
        blocks.AddRange(teaching);

        var slots = new List<TimeSlotDto>();
        for (var hour = OpeningHour; hour < ClosingHour; hour++)
        {
            var slotStart = day.AddHours(hour);
            var slotEnd = slotStart.AddMinutes(durationMinutes);
            if (slotEnd > day.AddHours(ClosingHour)) break;

            var isFree = slotStart > now
                         && !booked.Any(b => b.StartTime < slotEnd && slotStart < b.EndTime)
                         && !blocks.Any(b => b.StartTime < slotEnd && slotStart < b.EndTime);
            slots.Add(new TimeSlotDto(slotStart, slotEnd, isFree));
        }

        return new TrainerAvailabilityDto(trainerId, day, slots);
    }

    private IQueryable<WorkoutSession> BaseQuery() =>
        _db.WorkoutSessions
            .Include(s => s.Member)
            .Include(s => s.Trainer)
            .AsQueryable();

    private async Task<WorkoutSession> LoadSessionAsync(int sessionId, CancellationToken ct) =>
        await BaseQuery().FirstOrDefaultAsync(s => s.Id == sessionId, ct)
        ?? throw DomainException.NotFound("เซสชันฝึก");

    private async Task<Subscription> LoadUsableSubscriptionAsync(int memberId, DateTime now, CancellationToken ct)
    {
        var subscription = await _db.Subscriptions
            .Include(s => s.MembershipPlan)
            .Where(s => s.MemberId == memberId && s.Status == SubscriptionStatus.ACTIVE)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct)
            ?? throw DomainException.Forbidden("ต้องมีแพ็กเกจสมาชิกที่ใช้งานอยู่ก่อนจึงจะจองเทรนเนอร์ได้");

        subscription.RefreshExpiry(now);

        if (!subscription.IsUsable(now))
            throw DomainException.Forbidden("แพ็กเกจของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อจองต่อ");

        return subscription;
    }

    /// <summary>Business rule #3 enforced in code; the unique index is the last line of defence.</summary>
    private async Task EnsureTrainerIsFreeAsync(int trainerId, DateTime start, DateTime end, int? excludeSessionId, CancellationToken ct)
    {
        var clash = await _db.WorkoutSessions.AnyAsync(s =>
            s.TrainerId == trainerId &&
            s.Status == SessionStatus.BOOKED &&
            (excludeSessionId == null || s.Id != excludeSessionId) &&
            s.StartTime < end && start < s.EndTime, ct);

        if (clash)
            throw DomainException.Conflict("เทรนเนอร์ถูกจองในช่วงเวลานี้แล้ว");

        var blocked = await _db.TrainerBlocks.AnyAsync(b =>
            b.TrainerId == trainerId && b.StartTime < end && start < b.EndTime, ct);

        if (blocked)
            throw DomainException.Conflict("เทรนเนอร์ปิดรับคิวในช่วงเวลานี้ กรุณาเลือกเวลาอื่น");

        var teaching = await _db.GroupClasses.AnyAsync(c =>
            c.InstructorId == trainerId && c.Status == ClassStatus.SCHEDULED && c.StartTime < end && start < c.EndTime, ct);

        if (teaching)
            throw DomainException.Conflict("เทรนเนอร์ติดสอนคลาสกรุ๊ปในช่วงเวลานี้ กรุณาเลือกเวลาอื่น");
    }

    private async Task EnsureMemberIsFreeAsync(int memberId, DateTime start, DateTime end, int? excludeSessionId, CancellationToken ct)
    {
        var clash = await _db.WorkoutSessions.AnyAsync(s =>
            s.MemberId == memberId &&
            s.Status == SessionStatus.BOOKED &&
            (excludeSessionId == null || s.Id != excludeSessionId) &&
            s.StartTime < end && start < s.EndTime, ct);

        if (clash)
            throw DomainException.Conflict("คุณมีเซสชันอื่นที่จองไว้ในช่วงเวลานี้แล้ว");
    }

    private static void EnsureCanManage(WorkoutSession session, int userId, UserRole role)
    {
        var allowed = role switch
        {
            UserRole.ADMIN => true,
            UserRole.TRAINER => session.TrainerId == userId,
            UserRole.MEMBER => session.MemberId == userId,
            _ => false
        };

        if (!allowed)
            throw DomainException.Forbidden("คุณไม่มีสิทธิ์แก้ไขเซสชันนี้");
    }

    private async Task SaveWithConflictGuardAsync(CancellationToken ct)
    {
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uq_trainer_timeslot", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw DomainException.Conflict("ช่วงเวลานี้เพิ่งถูกสมาชิกท่านอื่นจองไป กรุณาเลือกเวลาอื่น");
        }
    }
}
