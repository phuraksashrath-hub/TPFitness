using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class AuditController : ControllerBase
{
    private readonly IAuditService _audit;

    public AuditController(IAuditService audit) => _audit = audit;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AuditLogDto>>> Latest([FromQuery] int take = 20, CancellationToken ct = default)
        => Ok(await _audit.LatestAsync(take, ct));
}

[ApiController]
[Route("api/leads")]
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TimeProvider _clock;

    public LeadsController(AppDbContext db, TimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    /// <summary>Public free-pass request from the landing page.</summary>
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("leads")]
    public async Task<IActionResult> Create(CreateLeadRequest request, CancellationToken ct)
    {
        // Bots fill every field; pretend it worked so they learn nothing.
        if (!string.IsNullOrWhiteSpace(request.Website))
            return Accepted();

        var phone = request.Phone.Trim();
        var since = _clock.GetUtcNow().UtcDateTime.AddHours(-24);
        var duplicate = await _db.TrialLeads.AnyAsync(l => l.Phone == phone && l.CreatedAt >= since, ct);
        if (!duplicate)
        {
            _db.TrialLeads.Add(new TrialLead(request.FullName, phone, request.Email, request.PreferredTime));
            await _db.SaveChangesAsync(ct);
        }

        return Accepted();
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<LeadDto>>> GetAll([FromQuery] LeadStatus? status, CancellationToken ct)
    {
        var query = _db.TrialLeads.AsNoTracking().AsQueryable();
        if (status.HasValue) query = query.Where(l => l.Status == status.Value);

        var leads = await query.OrderBy(l => l.Status).ThenByDescending(l => l.CreatedAt).Take(200).ToListAsync(ct);
        return Ok(leads.Select(l => new LeadDto(l.Id, l.FullName, l.Phone, l.Email, l.PreferredTime,
            l.Status.ToString(), l.CreatedAt)).ToList());
    }

    [HttpPost("{id:int}/status")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<LeadDto>> SetStatus(int id, [FromQuery] LeadStatus status, CancellationToken ct)
    {
        var lead = await _db.TrialLeads.FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw DomainException.NotFound("ผู้สนใจ");

        lead.SetStatus(status);
        await _db.SaveChangesAsync(ct);

        return Ok(new LeadDto(lead.Id, lead.FullName, lead.Phone, lead.Email, lead.PreferredTime,
            lead.Status.ToString(), lead.CreatedAt));
    }
}
