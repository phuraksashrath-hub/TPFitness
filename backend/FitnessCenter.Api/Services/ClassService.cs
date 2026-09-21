using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IClassService
{
    Task<IReadOnlyList<GroupClassDto>> ListAsync(DateTime? from, DateTime? to, string? category, int? branchId,
        int? viewerMemberId, bool includeCancelled, CancellationToken ct = default);
    Task<IReadOnlyList<GroupClassDto>> MineAsync(int memberId, CancellationToken ct = default);
    Task<GroupClassDto> BookAsync(int memberId, int classId, CancellationToken ct = default);
    Task<GroupClassDto> CancelBookingAsync(int memberId, int classId, CancellationToken ct = default);
    Task<GroupClassDto> CreateAsync(SaveGroupClassRequest request, CancellationToken ct = default);
    Task<GroupClassDto> UpdateAsync(int id, SaveGroupClassRequest request, CancellationToken ct = default);
    Task<GroupClassDto> CancelClassAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<ClassAttendeeDto>> RosterAsync(int classId, int userId, UserRole role, CancellationToken ct = default);
}

public class ClassService : IClassService
{
    private const int CancellationCutoffHours = 2;
    private const int MaxDaysAhead = 90;

    private readonly AppDbContext _db;
    private readonly TimeProvider _clock;

    public ClassService(AppDbContext db, TimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<IReadOnlyList<GroupClassDto>> ListAsync(DateTime? from, DateTime? to, string? category, int? branchId,
        int? viewerMemberId, bool includeCancelled, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var start = from.HasValue ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc) : now.Date;
        var end = to.HasValue ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc) : start.AddDays(14);

        var query = BaseQuery().Where(c => c.StartTime >= start && c.StartTime < end);
        if (!includeCancelled) query = query.Where(c => c.Status == ClassStatus.SCHEDULED);
        if (!string.IsNullOrWhiteSpace(category))
        {
            var wanted = category.Trim().ToUpperInvariant();
            query = query.Where(c => c.Category == wanted);
        }
        if (branchId.HasValue) query = query.Where(c => c.BranchId == branchId);

        var classes = await query.OrderBy(c => c.StartTime).ThenBy(c => c.Title).ToListAsync(ct);
        return await ToDtosAsync(classes, viewerMemberId, ct);
    }

    public async Task<IReadOnlyList<GroupClassDto>> MineAsync(int memberId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var classes = await BaseQuery()
            .Where(c => c.Status == ClassStatus.SCHEDULED && c.EndTime > now &&
                        c.Bookings.Any(b => b.MemberId == memberId && b.Status == ClassBookingStatus.BOOKED))
            .OrderBy(c => c.StartTime)
            .ToListAsync(ct);

        return await ToDtosAsync(classes, memberId, ct);
    }

    public async Task<GroupClassDto> BookAsync(int memberId, int classId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var groupClass = await BaseQuery().FirstOrDefaultAsync(c => c.Id == classId, ct)
            ?? throw DomainException.NotFound("คลาส");

        if (groupClass.Status != ClassStatus.SCHEDULED)
            throw new DomainException("คลาสนี้ถูกยกเลิกแล้ว");
        if (groupClass.StartTime <= now)
            throw new DomainException("คลาสนี้เริ่มไปแล้ว จองได้เฉพาะคลาสที่ยังไม่เริ่ม");

        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == memberId, ct)
            ?? throw DomainException.NotFound("สมาชิก");
        if (!member.CanBook())
            throw DomainException.Forbidden("บัญชีของคุณถูกระงับ จึงไม่สามารถจองได้");

        // Business rule #1 applies to classes too: an active, unexpired membership is required.
        var hasMembership = await _db.Subscriptions.AnyAsync(s =>
            s.MemberId == memberId && s.Status == SubscriptionStatus.ACTIVE && s.EndDate > now, ct);
        if (!hasMembership)
            throw DomainException.Forbidden("ต้องมีแพ็กเกจสมาชิกที่ใช้งานอยู่ก่อนจึงจะจองคลาสได้");

        if (await _db.ClassBookings.AnyAsync(b =>
                b.GroupClassId == classId && b.MemberId == memberId && b.Status == ClassBookingStatus.BOOKED, ct))
            throw DomainException.Conflict("คุณจองคลาสนี้ไว้แล้ว");

        var booked = await CountBookedAsync(classId, ct);
        if (booked >= groupClass.Capacity)
            throw DomainException.Conflict("คลาสนี้เต็มแล้ว");

        // A member cannot be in two places at once.
        var start = groupClass.StartTime;
        var end = groupClass.EndTime;
        var ptClash = await _db.WorkoutSessions.AnyAsync(s =>
            s.MemberId == memberId && s.Status == SessionStatus.BOOKED && s.StartTime < end && start < s.EndTime, ct);
        var classClash = await _db.ClassBookings.AnyAsync(b =>
            b.MemberId == memberId && b.Status == ClassBookingStatus.BOOKED && b.GroupClassId != classId &&
            b.GroupClass.Status == ClassStatus.SCHEDULED && b.GroupClass.StartTime < end && start < b.GroupClass.EndTime, ct);
        if (ptClash || classClash)
            throw DomainException.Conflict("คุณมีนัดหมายอื่นที่จองไว้ในช่วงเวลาเดียวกัน");

        var booking = new ClassBooking(classId, memberId);
        _db.ClassBookings.Add(booking);
        await _db.SaveChangesAsync(ct);

        // Two members can pass the seat check together. Whoever pushed the class over capacity
        // gives the seat back, so capacity is never exceeded even under concurrent requests.
        if (await CountBookedAsync(classId, ct) > groupClass.Capacity)
        {
            booking.Cancel();
            await _db.SaveChangesAsync(ct);
            throw DomainException.Conflict("ที่นั่งสุดท้ายเพิ่งถูกจองไป คลาสนี้เต็มแล้ว");
        }

        return (await ToDtosAsync(new[] { groupClass }, memberId, ct))[0];
    }

    public async Task<GroupClassDto> CancelBookingAsync(int memberId, int classId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var groupClass = await BaseQuery().FirstOrDefaultAsync(c => c.Id == classId, ct)
            ?? throw DomainException.NotFound("คลาส");

        var booking = await _db.ClassBookings.FirstOrDefaultAsync(b =>
                b.GroupClassId == classId && b.MemberId == memberId && b.Status == ClassBookingStatus.BOOKED, ct)
            ?? throw DomainException.NotFound("การจองคลาสนี้");

        if (groupClass.StartTime - now < TimeSpan.FromHours(CancellationCutoffHours))
            throw new DomainException($"ต้องยกเลิกที่นั่งล่วงหน้าอย่างน้อย {CancellationCutoffHours} ชั่วโมง");

        booking.Cancel();
        await _db.SaveChangesAsync(ct);

        return (await ToDtosAsync(new[] { groupClass }, memberId, ct))[0];
    }

    public async Task<GroupClassDto> CreateAsync(SaveGroupClassRequest request, CancellationToken ct = default)
    {
        var (start, end) = ResolveWindow(request);
        await ValidateScheduleAsync(request, start, end, excludeClassId: null, ct);

        var groupClass = new GroupClass(request.Title, request.Category, request.Description, request.Room,
            request.InstructorId, request.BranchId, start, end, request.Capacity);
        _db.GroupClasses.Add(groupClass);
        await _db.SaveChangesAsync(ct);

        return (await ToDtosAsync(new[] { await LoadAsync(groupClass.Id, ct) }, null, ct))[0];
    }

    public async Task<GroupClassDto> UpdateAsync(int id, SaveGroupClassRequest request, CancellationToken ct = default)
    {
        var groupClass = await LoadAsync(id, ct);
        var (start, end) = ResolveWindow(request);
        await ValidateScheduleAsync(request, start, end, excludeClassId: id, ct);

        var booked = await CountBookedAsync(id, ct);
        if (request.Capacity < booked)
            throw DomainException.Conflict($"มีผู้จองแล้ว {booked} คน จึงลดจำนวนที่นั่งให้ต่ำกว่านี้ไม่ได้");

        groupClass.Update(request.Title, request.Category, request.Description, request.Room,
            request.InstructorId, request.BranchId, start, end, request.Capacity);
        await _db.SaveChangesAsync(ct);

        return (await ToDtosAsync(new[] { await LoadAsync(id, ct) }, null, ct))[0];
    }

    public async Task<GroupClassDto> CancelClassAsync(int id, CancellationToken ct = default)
    {
        var groupClass = await LoadAsync(id, ct);
        groupClass.Cancel();

        // Release every seat so the members' "my classes" lists drop it too.
        var seats = await _db.ClassBookings
            .Where(b => b.GroupClassId == id && b.Status == ClassBookingStatus.BOOKED)
            .ToListAsync(ct);
        foreach (var seat in seats) seat.Cancel();

        await _db.SaveChangesAsync(ct);
        return (await ToDtosAsync(new[] { groupClass }, null, ct))[0];
    }

    public async Task<IReadOnlyList<ClassAttendeeDto>> RosterAsync(int classId, int userId, UserRole role, CancellationToken ct = default)
    {
        var groupClass = await LoadAsync(classId, ct);
        if (role != UserRole.ADMIN && groupClass.InstructorId != userId)
            throw DomainException.Forbidden("เฉพาะผู้ดูแลระบบหรือผู้สอนของคลาสนี้เท่านั้นที่ดูรายชื่อผู้เข้าเรียนได้");

        var seats = await _db.ClassBookings
            .Include(b => b.Member)
            .Where(b => b.GroupClassId == classId && b.Status == ClassBookingStatus.BOOKED)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync(ct);

        return seats.Select(b => new ClassAttendeeDto(b.MemberId, b.Member.FullName, b.Member.AvatarUrl, b.CreatedAt)).ToList();
    }

    // ---------------------------------------------------------------- helpers

    private IQueryable<GroupClass> BaseQuery() =>
        _db.GroupClasses.Include(c => c.Instructor).Include(c => c.Branch).AsQueryable();

    private async Task<GroupClass> LoadAsync(int id, CancellationToken ct) =>
        await BaseQuery().FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw DomainException.NotFound("คลาส");

    private Task<int> CountBookedAsync(int classId, CancellationToken ct) =>
        _db.ClassBookings.CountAsync(b => b.GroupClassId == classId && b.Status == ClassBookingStatus.BOOKED, ct);

    private (DateTime Start, DateTime End) ResolveWindow(SaveGroupClassRequest request)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var start = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);

        if (start <= now)
            throw new DomainException("ตั้งเวลาคลาสได้เฉพาะช่วงเวลาในอนาคตเท่านั้น");
        if (start > now.AddDays(MaxDaysAhead))
            throw new DomainException($"ตั้งคลาสล่วงหน้าได้ไม่เกิน {MaxDaysAhead} วัน");

        return (start, start.AddMinutes(request.DurationMinutes));
    }

    /// <summary>The instructor and the branch must exist, and the instructor must actually be free.</summary>
    private async Task ValidateScheduleAsync(SaveGroupClassRequest request, DateTime start, DateTime end, int? excludeClassId, CancellationToken ct)
    {
        var instructor = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == request.InstructorId, ct)
            ?? throw DomainException.NotFound("ผู้สอน");
        if (instructor.Status != UserStatus.ACTIVE)
            throw new DomainException("ผู้สอนท่านนี้ยังไม่เปิดให้ใช้งาน");

        if (request.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == request.BranchId && b.IsActive, ct))
            throw DomainException.NotFound("สาขา");

        var classClash = await _db.GroupClasses.AnyAsync(c =>
            c.InstructorId == request.InstructorId && c.Status == ClassStatus.SCHEDULED &&
            (excludeClassId == null || c.Id != excludeClassId) && c.StartTime < end && start < c.EndTime, ct);
        var ptClash = await _db.WorkoutSessions.AnyAsync(s =>
            s.TrainerId == request.InstructorId && s.Status == SessionStatus.BOOKED && s.StartTime < end && start < s.EndTime, ct);
        var blocked = await _db.TrainerBlocks.AnyAsync(b =>
            b.TrainerId == request.InstructorId && b.StartTime < end && start < b.EndTime, ct);

        if (classClash || ptClash || blocked)
            throw DomainException.Conflict("ผู้สอนไม่ว่างในช่วงเวลานี้ (มีคลาส นัด PT หรือช่วงที่บล็อกไว้)");
    }

    private async Task<IReadOnlyList<GroupClassDto>> ToDtosAsync(IReadOnlyCollection<GroupClass> classes, int? viewerMemberId, CancellationToken ct)
    {
        if (classes.Count == 0) return Array.Empty<GroupClassDto>();

        var ids = classes.Select(c => c.Id).ToList();
        var counts = await _db.ClassBookings
            .Where(b => ids.Contains(b.GroupClassId) && b.Status == ClassBookingStatus.BOOKED)
            .GroupBy(b => b.GroupClassId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);

        var mine = viewerMemberId is null
            ? new HashSet<int>()
            : (await _db.ClassBookings
                .Where(b => ids.Contains(b.GroupClassId) && b.MemberId == viewerMemberId && b.Status == ClassBookingStatus.BOOKED)
                .Select(b => b.GroupClassId)
                .ToListAsync(ct)).ToHashSet();

        return classes.Select(c =>
        {
            var booked = counts.GetValueOrDefault(c.Id);
            return new GroupClassDto(
                c.Id, c.Title, c.Category, c.Description, c.Room,
                c.InstructorId, c.Instructor.FullName, c.Instructor.AvatarUrl,
                c.BranchId, c.Branch?.Name,
                c.StartTime, c.EndTime, c.Capacity, booked, Math.Max(0, c.Capacity - booked),
                c.Status.ToString(), mine.Contains(c.Id));
        }).ToList();
    }
}
