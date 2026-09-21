using System.Security.Claims;
using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/branches")]
public class BranchesController : ControllerBase
{
    private readonly AppDbContext _db;

    public BranchesController(AppDbContext db) => _db = db;

    /// <summary>Public club finder. Only active branches; optional text search over name, district and province.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<BranchDto>>> GetActive([FromQuery] string? search, CancellationToken ct)
    {
        var query = _db.Branches.AsNoTracking().Where(b => b.IsActive);
        query = ApplySearch(query, search);

        var branches = await query.OrderBy(b => b.Province).ThenBy(b => b.Name).ToListAsync(ct);
        return Ok(branches.Select(ToDto).ToList());
    }

    [HttpGet("all")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<BranchDto>>> GetAll(CancellationToken ct)
    {
        var branches = await _db.Branches.AsNoTracking().OrderByDescending(b => b.IsActive).ThenBy(b => b.Name).ToListAsync(ct);
        return Ok(branches.Select(ToDto).ToList());
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<BranchDto>> Create(SaveBranchRequest request, CancellationToken ct)
    {
        await EnsureNameIsFreeAsync(request.Name, null, ct);

        var branch = new Branch(request.Name, request.Address, request.District, request.Province, request.Phone,
            request.Latitude, request.Longitude, request.OpeningHours, request.Facilities);
        _db.Branches.Add(branch);
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(branch));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<BranchDto>> Update(int id, SaveBranchRequest request, CancellationToken ct)
    {
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == id, ct)
            ?? throw DomainException.NotFound("สาขา");
        await EnsureNameIsFreeAsync(request.Name, id, ct);

        if (!request.IsActive && branch.IsActive &&
            await _db.GroupClasses.AnyAsync(c => c.BranchId == id && c.Status == ClassStatus.SCHEDULED && c.StartTime > DateTime.UtcNow, ct))
            throw DomainException.Conflict("สาขานี้ยังมีคลาสที่กำลังจะมาถึง กรุณายกเลิกหรือย้ายคลาสก่อนปิดสาขา");

        branch.Update(request.Name, request.Address, request.District, request.Province, request.Phone,
            request.Latitude, request.Longitude, request.OpeningHours, request.Facilities, request.IsActive);
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(branch));
    }

    private static IQueryable<Branch> ApplySearch(IQueryable<Branch> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search)) return query;
        var term = search.Trim().ToLowerInvariant();
        return query.Where(b => b.Name.ToLower().Contains(term) || b.District.ToLower().Contains(term) ||
                                b.Province.ToLower().Contains(term) || b.Address.ToLower().Contains(term));
    }

    private async Task EnsureNameIsFreeAsync(string name, int? excludeId, CancellationToken ct)
    {
        var trimmed = name.Trim();
        if (await _db.Branches.AnyAsync(b => b.Name == trimmed && (excludeId == null || b.Id != excludeId), ct))
            throw DomainException.Conflict("มีสาขาชื่อนี้อยู่แล้ว");
    }

    private static BranchDto ToDto(Branch b) => new(b.Id, b.Name, b.Address, b.District, b.Province, b.Phone,
        b.Latitude, b.Longitude, b.OpeningHours, b.FacilityList(), b.IsActive);
}

[ApiController]
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classes;
    private readonly ICurrentUser _currentUser;

    public ClassesController(IClassService classes, ICurrentUser currentUser)
    {
        _classes = classes;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Public timetable. When the caller sends a member token, <c>isBookedByMe</c> is filled in so the
    /// same endpoint drives both the public page and the member portal.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<GroupClassDto>>> List(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? category, [FromQuery] int? branchId,
        CancellationToken ct)
    {
        int? memberId = User.IsInRole(nameof(UserRole.MEMBER)) && int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : null;

        return Ok(await _classes.ListAsync(from, to, category, branchId, memberId, includeCancelled: false, ct));
    }

    [HttpGet("manage")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<GroupClassDto>>> Manage(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(await _classes.ListAsync(from, to, null, null, null, includeCancelled: true, ct));

    [HttpGet("mine")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<IReadOnlyList<GroupClassDto>>> Mine(CancellationToken ct)
        => Ok(await _classes.MineAsync(_currentUser.Id, ct));

    [HttpPost("{id:int}/book")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<GroupClassDto>> Book(int id, CancellationToken ct)
        => Ok(await _classes.BookAsync(_currentUser.Id, id, ct));

    /// <summary>A member gives their own seat back.</summary>
    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<GroupClassDto>> CancelSeat(int id, CancellationToken ct)
        => Ok(await _classes.CancelBookingAsync(_currentUser.Id, id, ct));

    [HttpGet("{id:int}/roster")]
    [Authorize(Roles = nameof(UserRole.ADMIN) + "," + nameof(UserRole.TRAINER))]
    public async Task<ActionResult<IReadOnlyList<ClassAttendeeDto>>> Roster(int id, CancellationToken ct)
        => Ok(await _classes.RosterAsync(id, _currentUser.Id, _currentUser.Role, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<GroupClassDto>> Create(SaveGroupClassRequest request, CancellationToken ct)
        => Ok(await _classes.CreateAsync(request, ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<GroupClassDto>> Update(int id, SaveGroupClassRequest request, CancellationToken ct)
        => Ok(await _classes.UpdateAsync(id, request, ct));

    /// <summary>Cancels the whole class and releases every seat.</summary>
    [HttpPost("{id:int}/cancel-class")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<GroupClassDto>> CancelClass(int id, CancellationToken ct)
        => Ok(await _classes.CancelClassAsync(id, ct));
}
