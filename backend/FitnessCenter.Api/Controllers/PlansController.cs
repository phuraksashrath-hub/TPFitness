using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlansController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<MembershipPlanDto>>> GetAll([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var query = _db.MembershipPlans.AsQueryable();
        if (!includeInactive) query = query.Where(p => p.IsActive);

        var plans = await query.OrderBy(p => p.Price).ToListAsync(ct);
        return Ok(plans.Select(p => p.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<MembershipPlanDto>> GetById(int id, CancellationToken ct)
    {
        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw DomainException.NotFound("แพ็กเกจ");
        return Ok(plan.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<MembershipPlanDto>> Create(SaveMembershipPlanRequest request, CancellationToken ct)
    {
        if (await _db.MembershipPlans.AnyAsync(p => p.Name == request.Name, ct))
            throw DomainException.Conflict("มีแพ็กเกจชื่อนี้อยู่แล้ว");

        var plan = new MembershipPlan(request.Name, request.Description, request.Price,
            request.DurationDays, request.SessionsPerMonth, request.Tier, DomainMappings.JoinPerks(request.Perks));

        _db.MembershipPlans.Add(plan);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<MembershipPlanDto>> Update(int id, SaveMembershipPlanRequest request, CancellationToken ct)
    {
        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw DomainException.NotFound("แพ็กเกจ");

        plan.Update(request.Name, request.Description, request.Price, request.DurationDays,
            request.SessionsPerMonth, request.Tier, DomainMappings.JoinPerks(request.Perks), request.IsActive);

        await _db.SaveChangesAsync(ct);
        return Ok(plan.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct)
    {
        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw DomainException.NotFound("แพ็กเกจ");

        // Plans are archived instead of deleted so existing subscriptions keep their history.
        plan.Deactivate();
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
