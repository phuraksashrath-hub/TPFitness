using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly IBillingService _billing;
    private readonly ICurrentUser _currentUser;

    public SubscriptionsController(IBillingService billing, ICurrentUser currentUser)
    {
        _billing = billing;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<IReadOnlyList<SubscriptionDto>>> MySubscriptions(CancellationToken ct)
        => Ok(await _billing.GetSubscriptionsAsync(_currentUser.Id, ct));

    [HttpGet("me/active")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<SubscriptionDto>> MyActiveSubscription(CancellationToken ct)
    {
        var subscription = await _billing.GetActiveSubscriptionAsync(_currentUser.Id, ct);
        return subscription is null ? NoContent() : Ok(subscription);
    }

    [HttpPost("quote")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<DiscountQuoteDto>> Quote(DiscountQuoteRequest request, CancellationToken ct)
        => Ok(await _billing.QuoteAsync(_currentUser.Id, request, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<CheckoutResponse>> Subscribe(SubscribeRequest request, CancellationToken ct)
        => Ok(await _billing.SubscribeAsync(_currentUser.Id, request, ct));

    [HttpPost("{id:int}/renew")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<CheckoutResponse>> Renew(int id, RenewRequest request, CancellationToken ct)
        => Ok(await _billing.RenewAsync(_currentUser.Id, id, request, ct));

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = nameof(UserRole.MEMBER))]
    public async Task<ActionResult<SubscriptionDto>> Cancel(int id, CancellationToken ct)
        => Ok(await _billing.CancelAsync(_currentUser.Id, id, ct));
}

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IBillingService _billing;
    private readonly ICurrentUser _currentUser;

    public PaymentsController(IBillingService billing, ICurrentUser currentUser)
    {
        _billing = billing;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> MyPayments([FromQuery] int take = 20, CancellationToken ct = default)
        => Ok(await _billing.GetPaymentsAsync(_currentUser.Id, take, ct));

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> All([FromQuery] int? memberId, [FromQuery] int take = 50, CancellationToken ct = default)
        => Ok(await _billing.GetPaymentsAsync(memberId, take, ct));
}
