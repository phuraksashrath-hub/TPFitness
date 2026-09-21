using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/trainers")]
public class TrainersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public TrainersController(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TrainerDto>>> GetAll([FromQuery] string? specialization, CancellationToken ct)
    {
        var query = _db.Trainers.Where(t => t.Status == UserStatus.ACTIVE);

        if (!string.IsNullOrWhiteSpace(specialization))
            query = query.Where(t => t.Specialization != null && EF.Functions.Like(t.Specialization, $"%{specialization.Trim()}%"));

        var trainers = await query.OrderByDescending(t => t.RatingAverage).ToListAsync(ct);
        return Ok(trainers.Select(t => t.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<TrainerDto>> GetById(int id, CancellationToken ct)
    {
        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw DomainException.NotFound("เทรนเนอร์");
        return Ok(trainer.ToDto());
    }

    [HttpGet("me/blocks")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<IReadOnlyList<TrainerBlockDto>>> GetBlocks(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var query = _db.TrainerBlocks.AsNoTracking().Where(b => b.TrainerId == _currentUser.Id);
        if (from.HasValue) query = query.Where(b => b.EndTime > from.Value);
        if (to.HasValue) query = query.Where(b => b.StartTime < to.Value);

        var blocks = await query.OrderBy(b => b.StartTime).ToListAsync(ct);
        return Ok(blocks.Select(b => new TrainerBlockDto(b.Id, b.StartTime, b.EndTime, b.Reason)).ToList());
    }

    [HttpPost("me/blocks")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<TrainerBlockDto>> CreateBlock(CreateTrainerBlockRequest request, CancellationToken ct)
    {
        var trainerId = _currentUser.Id;
        var start = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(request.EndTime, DateTimeKind.Utc);
        var now = DateTime.UtcNow;

        if (end <= start)
            throw new DomainException("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
        if (end <= now)
            throw new DomainException("บล็อกได้เฉพาะช่วงเวลาในอนาคตเท่านั้น");
        if (end - start > TimeSpan.FromDays(14))
            throw new DomainException("บล็อกเวลาได้ครั้งละไม่เกิน 14 วัน");

        var hasBookings = await _db.WorkoutSessions.AnyAsync(s =>
            s.TrainerId == trainerId && s.Status == SessionStatus.BOOKED &&
            s.StartTime < end && start < s.EndTime, ct);
        if (hasBookings)
            throw DomainException.Conflict("มีเซสชันที่สมาชิกจองไว้ในช่วงเวลานี้ กรุณายกเลิกหรือเลื่อนเซสชันก่อนบล็อกเวลา");

        var teaching = await _db.GroupClasses.AnyAsync(c =>
            c.InstructorId == trainerId && c.Status == ClassStatus.SCHEDULED && c.StartTime < end && start < c.EndTime, ct);
        if (teaching)
            throw DomainException.Conflict("คุณมีคลาสกรุ๊ปที่ต้องสอนในช่วงเวลานี้ จึงบล็อกทับไม่ได้");

        var overlaps = await _db.TrainerBlocks.AnyAsync(b =>
            b.TrainerId == trainerId && b.StartTime < end && start < b.EndTime, ct);
        if (overlaps)
            throw DomainException.Conflict("ช่วงเวลานี้ถูกบล็อกไว้แล้ว");

        var block = new TrainerBlock(trainerId, start, end, request.Reason);
        _db.TrainerBlocks.Add(block);
        await _db.SaveChangesAsync(ct);

        return Ok(new TrainerBlockDto(block.Id, block.StartTime, block.EndTime, block.Reason));
    }

    [HttpDelete("me/blocks/{id:int}")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<IActionResult> DeleteBlock(int id, CancellationToken ct)
    {
        var block = await _db.TrainerBlocks.FirstOrDefaultAsync(b => b.Id == id && b.TrainerId == _currentUser.Id, ct)
            ?? throw DomainException.NotFound("ช่วงเวลาที่บล็อก");

        _db.TrainerBlocks.Remove(block);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPut("me/expertise")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<TrainerDto>> UpdateExpertise(TrainerProfileRequest request, CancellationToken ct)
    {
        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == _currentUser.Id, ct)
            ?? throw DomainException.NotFound("เทรนเนอร์");

        trainer.UpdateExpertise(request.Specialization, request.Bio, request.Certifications,
            request.YearsOfExperience, request.HourlyRate);

        await _db.SaveChangesAsync(ct);
        return Ok(trainer.ToDto());
    }
}

[ApiController]
[Route("api/members")]
[Authorize]
public class MembersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public MembersController(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.ADMIN) + "," + nameof(UserRole.TRAINER))]
    public async Task<ActionResult<IReadOnlyList<UserProfileDto>>> GetAll([FromQuery] string? search, CancellationToken ct)
    {
        var query = _db.Members.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m => EF.Functions.Like(m.FullName, $"%{term}%") || EF.Functions.Like(m.Email, $"%{term}%"));
        }

        var members = await query.OrderBy(m => m.FullName).Take(200).ToListAsync(ct);
        return Ok(members.Select(m => m.ToProfileDto()).ToList());
    }

    [HttpGet("me/metrics")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<MemberMetricsDto>> GetMetrics(CancellationToken ct)
    {
        var member = await _db.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == _currentUser.Id, ct)
            ?? throw DomainException.NotFound("สมาชิก");
        return Ok(member.ToMetricsDto());
    }

    [HttpPut("me/metrics")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<UserProfileDto>> UpdateMetrics(MemberProfileRequest request, CancellationToken ct)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == _currentUser.Id, ct)
            ?? throw DomainException.NotFound("สมาชิก");

        member.UpdateBodyMetrics(request.DateOfBirth, request.Gender, request.HeightCm,
            request.WeightKg, request.FitnessGoal, request.EmergencyContact,
            request.BodyFatPercent, request.MuscleMassKg);

        await _db.SaveChangesAsync(ct);
        return Ok(member.ToProfileDto());
    }

    [HttpPost("{id:int}/status")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<UserProfileDto>> SetStatus(int id, [FromQuery] UserStatus status, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw DomainException.NotFound("ผู้ใช้");

        user.SetStatus(status);
        await _db.SaveChangesAsync(ct);
        return Ok(user.ToProfileDto());
    }
}
