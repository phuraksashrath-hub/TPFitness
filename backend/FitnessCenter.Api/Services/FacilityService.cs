using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IFacilityService
{
    Task<IReadOnlyList<EquipmentDto>> GetEquipmentAsync(string? search, EquipmentStatus? status, CancellationToken ct = default);
    Task<EquipmentDto> CreateEquipmentAsync(SaveEquipmentRequest request, CancellationToken ct = default);
    Task<EquipmentDto> UpdateEquipmentAsync(int id, SaveEquipmentRequest request, CancellationToken ct = default);
    Task<EquipmentDto> UpdateEquipmentStatusAsync(int id, EquipmentStatus status, CancellationToken ct = default);
    Task DeleteEquipmentAsync(int id, CancellationToken ct = default);

    Task<IReadOnlyList<MaintenanceRequestDto>> GetMaintenanceAsync(MaintenanceStatus? status, CancellationToken ct = default);
    Task<MaintenanceRequestDto> ReportIssueAsync(int reportedByUserId, CreateMaintenanceRequest request, CancellationToken ct = default);
    Task<MaintenanceRequestDto> AssignAsync(int id, int assigneeUserId, CancellationToken ct = default);
    Task<MaintenanceRequestDto> ResolveAsync(int id, ResolveMaintenanceRequest request, CancellationToken ct = default);
    Task<MaintenanceRequestDto> RejectAsync(int id, ResolveMaintenanceRequest request, CancellationToken ct = default);
}

public class FacilityService : IFacilityService
{
    private readonly AppDbContext _db;

    public FacilityService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<EquipmentDto>> GetEquipmentAsync(string? search, EquipmentStatus? status, CancellationToken ct = default)
    {
        var query = _db.Equipment.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e => EF.Functions.Like(e.Name, $"%{term}%")
                                  || EF.Functions.Like(e.SerialNumber, $"%{term}%")
                                  || EF.Functions.Like(e.Category, $"%{term}%"));
        }

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        var rows = await query
            .OrderBy(e => e.Category).ThenBy(e => e.Name)
            .Select(e => new
            {
                Equipment = e,
                OpenIssues = e.MaintenanceRequests.Count(m => m.Status == MaintenanceStatus.OPEN || m.Status == MaintenanceStatus.IN_PROGRESS)
            })
            .ToListAsync(ct);

        return rows.Select(r => r.Equipment.ToDto(r.OpenIssues)).ToList();
    }

    public async Task<EquipmentDto> CreateEquipmentAsync(SaveEquipmentRequest request, CancellationToken ct = default)
    {
        if (await _db.Equipment.AnyAsync(e => e.SerialNumber == request.SerialNumber, ct))
            throw DomainException.Conflict("มีอุปกรณ์ที่ใช้หมายเลขเครื่องนี้อยู่แล้ว");

        var equipment = new Equipment(request.Name, request.SerialNumber, request.Category,
            request.Brand, request.Location, request.PurchaseDate, request.ImageUrl);

        _db.Equipment.Add(equipment);
        await _db.SaveChangesAsync(ct);
        return equipment.ToDto(0);
    }

    public async Task<EquipmentDto> UpdateEquipmentAsync(int id, SaveEquipmentRequest request, CancellationToken ct = default)
    {
        var equipment = await _db.Equipment.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw DomainException.NotFound("อุปกรณ์");

        equipment.Update(request.Name, request.Category, request.Brand, request.Location, request.PurchaseDate, request.ImageUrl);
        await _db.SaveChangesAsync(ct);
        return equipment.ToDto(await CountOpenIssuesAsync(id, ct));
    }

    public async Task<EquipmentDto> UpdateEquipmentStatusAsync(int id, EquipmentStatus status, CancellationToken ct = default)
    {
        var equipment = await _db.Equipment.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw DomainException.NotFound("อุปกรณ์");

        equipment.SetStatus(status);
        await _db.SaveChangesAsync(ct);
        return equipment.ToDto(await CountOpenIssuesAsync(id, ct));
    }

    public async Task DeleteEquipmentAsync(int id, CancellationToken ct = default)
    {
        var equipment = await _db.Equipment.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw DomainException.NotFound("อุปกรณ์");

        _db.Equipment.Remove(equipment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<MaintenanceRequestDto>> GetMaintenanceAsync(MaintenanceStatus? status, CancellationToken ct = default)
    {
        var query = MaintenanceQuery();
        if (status.HasValue) query = query.Where(m => m.Status == status.Value);

        var items = await query.ToListAsync(ct);

        // Priority is persisted as text, so the database would sort it alphabetically.
        return items
            .OrderByDescending(m => m.Priority)
            .ThenByDescending(m => m.ReportedAt)
            .Select(m => m.ToDto())
            .ToList();
    }

    public async Task<MaintenanceRequestDto> ReportIssueAsync(int reportedByUserId, CreateMaintenanceRequest request, CancellationToken ct = default)
    {
        var equipment = await _db.Equipment.FirstOrDefaultAsync(e => e.Id == request.EquipmentId, ct)
            ?? throw DomainException.NotFound("อุปกรณ์");

        var reporter = await _db.Users.FirstOrDefaultAsync(u => u.Id == reportedByUserId, ct)
            ?? throw DomainException.NotFound("ผู้ใช้");

        var maintenance = new MaintenanceRequest(equipment, reporter, request.Title, request.Description, request.Priority);

        if (request.Priority >= MaintenancePriority.HIGH)
            equipment.SetStatus(EquipmentStatus.UNDER_MAINTENANCE);

        _db.MaintenanceRequests.Add(maintenance);
        await _db.SaveChangesAsync(ct);

        return (await MaintenanceQuery().FirstAsync(m => m.Id == maintenance.Id, ct)).ToDto();
    }

    public async Task<MaintenanceRequestDto> AssignAsync(int id, int assigneeUserId, CancellationToken ct = default)
    {
        var maintenance = await LoadMaintenanceAsync(id, ct);

        if (!await _db.Users.AnyAsync(u => u.Id == assigneeUserId, ct))
            throw DomainException.NotFound("ผู้รับผิดชอบ");

        maintenance.Assign(assigneeUserId);
        maintenance.Equipment.SetStatus(EquipmentStatus.UNDER_MAINTENANCE);
        await _db.SaveChangesAsync(ct);

        return (await MaintenanceQuery().FirstAsync(m => m.Id == id, ct)).ToDto();
    }

    public async Task<MaintenanceRequestDto> ResolveAsync(int id, ResolveMaintenanceRequest request, CancellationToken ct = default)
    {
        var maintenance = await LoadMaintenanceAsync(id, ct);
        maintenance.Resolve(request.ResolutionNotes, request.RepairCost);
        await _db.SaveChangesAsync(ct);
        return (await MaintenanceQuery().FirstAsync(m => m.Id == id, ct)).ToDto();
    }

    public async Task<MaintenanceRequestDto> RejectAsync(int id, ResolveMaintenanceRequest request, CancellationToken ct = default)
    {
        var maintenance = await LoadMaintenanceAsync(id, ct);
        maintenance.Reject(request.ResolutionNotes);
        await _db.SaveChangesAsync(ct);
        return (await MaintenanceQuery().FirstAsync(m => m.Id == id, ct)).ToDto();
    }

    private IQueryable<MaintenanceRequest> MaintenanceQuery() =>
        _db.MaintenanceRequests
            .Include(m => m.Equipment)
            .Include(m => m.ReportedBy)
            .Include(m => m.AssignedTo)
            .AsQueryable();

    private async Task<MaintenanceRequest> LoadMaintenanceAsync(int id, CancellationToken ct) =>
        await _db.MaintenanceRequests.Include(m => m.Equipment).FirstOrDefaultAsync(m => m.Id == id, ct)
        ?? throw DomainException.NotFound("คำขอซ่อมบำรุง");

    private Task<int> CountOpenIssuesAsync(int equipmentId, CancellationToken ct) =>
        _db.MaintenanceRequests.CountAsync(m => m.EquipmentId == equipmentId
            && (m.Status == MaintenanceStatus.OPEN || m.Status == MaintenanceStatus.IN_PROGRESS), ct);
}
