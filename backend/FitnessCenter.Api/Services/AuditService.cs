using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IAuditService
{
    /// <summary>Records an event for a signed-in user (name and role are looked up).</summary>
    Task RecordForUserAsync(int userId, string category, string action, string? detail, string outcome = "SUCCESS");

    /// <summary>Records an event with no signed-in user, e.g. a failed login.</summary>
    Task RecordAnonymousAsync(string category, string action, string? detail, string outcome = "SUCCESS");

    Task<IReadOnlyList<AuditLogDto>> LatestAsync(int take, CancellationToken ct = default);
}

/// <summary>
/// Audit rows are written through their own scope and DbContext, so a half-finished request
/// (tracked but unsaved changes on the request's context) can never be persisted by accident.
/// Audit failures are logged and swallowed: auditing must not break the action being audited.
/// </summary>
public class AuditService : IAuditService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<AuditService> _logger;

    public AuditService(IServiceScopeFactory scopes, ILogger<AuditService> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    public async Task RecordForUserAsync(int userId, string category, string action, string? detail, string outcome = "SUCCESS")
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new { u.FullName, u.Role })
                .FirstOrDefaultAsync();

            db.AuditLogs.Add(new AuditLog(userId, user?.FullName ?? $"#{userId}", user?.Role.ToString() ?? "UNKNOWN",
                category, action, detail, outcome));
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not write audit entry {Action}", action);
        }
    }

    public async Task RecordAnonymousAsync(string category, string action, string? detail, string outcome = "SUCCESS")
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AuditLogs.Add(new AuditLog(null, "ผู้เยี่ยมชม", "ANONYMOUS", category, action, detail, outcome));
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not write audit entry {Action}", action);
        }
    }

    public async Task<IReadOnlyList<AuditLogDto>> LatestAsync(int take, CancellationToken ct = default)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rows = await db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.OccurredAt).ThenByDescending(a => a.Id)
            .Take(Math.Clamp(take, 1, 100))
            .ToListAsync(ct);

        return rows.Select(a => new AuditLogDto(a.Id, a.OccurredAt, a.ActorName, a.ActorRole,
            a.Category, a.Action, a.Detail, a.Outcome)).ToList();
    }
}
