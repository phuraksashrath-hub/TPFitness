using FitnessCenter.Api.Common;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/programs")]
[Authorize]
public class ProgramsController : ControllerBase
{
    private readonly IProgramService _programs;
    private readonly ICurrentUser _currentUser;

    public ProgramsController(IProgramService programs, ICurrentUser currentUser)
    {
        _programs = programs;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<WorkoutProgramDto>>> Mine(CancellationToken ct)
        => _currentUser.Role == UserRole.TRAINER
            ? Ok(await _programs.GetForTrainerAsync(_currentUser.Id, ct))
            : Ok(await _programs.GetForMemberAsync(_currentUser.Id, ct));

    [HttpGet("member/{memberId:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN) + "," + nameof(UserRole.TRAINER))]
    public async Task<ActionResult<IReadOnlyList<WorkoutProgramDto>>> ForMember(int memberId, CancellationToken ct)
        => Ok(await _programs.GetForMemberAsync(memberId, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<WorkoutProgramDto>> Create(SaveWorkoutProgramRequest request, CancellationToken ct)
        => Ok(await _programs.CreateAsync(_currentUser.Id, request, ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<WorkoutProgramDto>> Update(int id, SaveWorkoutProgramRequest request, CancellationToken ct)
        => Ok(await _programs.UpdateAsync(_currentUser.Id, id, request, ct));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _programs.DeleteAsync(_currentUser.Id, id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/equipment")]
[Authorize]
public class EquipmentController : ControllerBase
{
    private readonly IFacilityService _facility;

    public EquipmentController(IFacilityService facility) => _facility = facility;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EquipmentDto>>> GetAll(
        [FromQuery] string? search, [FromQuery] EquipmentStatus? status, CancellationToken ct)
        => Ok(await _facility.GetEquipmentAsync(search, status, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<EquipmentDto>> Create(SaveEquipmentRequest request, CancellationToken ct)
        => Ok(await _facility.CreateEquipmentAsync(request, ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<EquipmentDto>> Update(int id, SaveEquipmentRequest request, CancellationToken ct)
        => Ok(await _facility.UpdateEquipmentAsync(id, request, ct));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<EquipmentDto>> SetStatus(int id, UpdateEquipmentStatusRequest request, CancellationToken ct)
        => Ok(await _facility.UpdateEquipmentStatusAsync(id, request.Status, ct));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _facility.DeleteEquipmentAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IFacilityService _facility;
    private readonly ICurrentUser _currentUser;

    public MaintenanceController(IFacilityService facility, ICurrentUser currentUser)
    {
        _facility = facility;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MaintenanceRequestDto>>> GetAll([FromQuery] MaintenanceStatus? status, CancellationToken ct)
        => Ok(await _facility.GetMaintenanceAsync(status, ct));

    [HttpPost]
    public async Task<ActionResult<MaintenanceRequestDto>> Report(CreateMaintenanceRequest request, CancellationToken ct)
        => Ok(await _facility.ReportIssueAsync(_currentUser.Id, request, ct));

    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<MaintenanceRequestDto>> Assign(int id, [FromQuery] int assigneeUserId, CancellationToken ct)
        => Ok(await _facility.AssignAsync(id, assigneeUserId, ct));

    [HttpPost("{id:int}/resolve")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<MaintenanceRequestDto>> Resolve(int id, ResolveMaintenanceRequest request, CancellationToken ct)
        => Ok(await _facility.ResolveAsync(id, request, ct));

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<MaintenanceRequestDto>> Reject(int id, ResolveMaintenanceRequest request, CancellationToken ct)
        => Ok(await _facility.RejectAsync(id, request, ct));
}

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;
    private readonly ICurrentUser _currentUser;

    public DashboardController(IDashboardService dashboard, ICurrentUser currentUser)
    {
        _dashboard = dashboard;
        _currentUser = currentUser;
    }

    [HttpGet("admin")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<AdminDashboardDto>> Admin(CancellationToken ct)
        => Ok(await _dashboard.GetAdminDashboardAsync(ct));

    [HttpGet("member")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<MemberDashboardDto>> Member(CancellationToken ct)
        => Ok(await _dashboard.GetMemberDashboardAsync(_currentUser.Id, ct));

    [HttpGet("trainer")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<TrainerDashboardDto>> Trainer(CancellationToken ct)
        => Ok(await _dashboard.GetTrainerDashboardAsync(_currentUser.Id, ct));
}
