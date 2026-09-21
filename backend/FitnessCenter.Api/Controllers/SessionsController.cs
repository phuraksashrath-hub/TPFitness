using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/sessions")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly IBookingService _booking;
    private readonly ICurrentUser _currentUser;

    public SessionsController(IBookingService booking, ICurrentUser currentUser)
    {
        _booking = booking;
        _currentUser = currentUser;
    }

    [HttpPost("book")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<WorkoutSessionDto>> Book(BookSessionRequest request, CancellationToken ct)
        => Ok(await _booking.BookAsync(_currentUser.Id, request, ct));

    [HttpPut("{id:int}/reschedule")]
    public async Task<ActionResult<WorkoutSessionDto>> Reschedule(int id, RescheduleSessionRequest request, CancellationToken ct)
        => Ok(await _booking.RescheduleAsync(_currentUser.Id, _currentUser.Role, id, request, ct));

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<WorkoutSessionDto>> Cancel(int id, CancelSessionRequest request, CancellationToken ct)
        => Ok(await _booking.CancelAsync(_currentUser.Id, _currentUser.Role, id, request, ct));

    [HttpPost("{id:int}/complete")]
    [Authorize(Roles = nameof(UserRole.TRAINER))]
    public async Task<ActionResult<WorkoutSessionDto>> Complete(int id, CompleteSessionRequest request, CancellationToken ct)
        => Ok(await _booking.CompleteAsync(_currentUser.Id, id, request, ct));

    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<WorkoutSessionDto>>> Mine(CancellationToken ct)
        => _currentUser.Role == UserRole.TRAINER
            ? Ok(await _booking.GetTrainerSessionsAsync(_currentUser.Id, null, null, ct))
            : Ok(await _booking.GetMemberSessionsAsync(_currentUser.Id, ct));

    [HttpGet("trainer/{trainerId:int}")]
    public async Task<ActionResult<IReadOnlyList<WorkoutSessionDto>>> ByTrainer(int trainerId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(await _booking.GetTrainerSessionsAsync(trainerId, from, to, ct));

    [HttpGet("availability")]
    public async Task<ActionResult<TrainerAvailabilityDto>> Availability(
        [FromQuery] int trainerId, [FromQuery] DateTime date, [FromQuery] int durationMinutes = 60, CancellationToken ct = default)
        => Ok(await _booking.GetAvailabilityAsync(trainerId, date, durationMinutes, ct));
}
