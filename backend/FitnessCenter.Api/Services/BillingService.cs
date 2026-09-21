using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using FitnessCenter.Api.Patterns.Factory;
using FitnessCenter.Api.Patterns.Strategy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FitnessCenter.Api.Services;

public interface IBillingService
{
    Task<DiscountQuoteDto> QuoteAsync(int memberId, DiscountQuoteRequest request, CancellationToken ct = default);
    Task<CheckoutResponse> SubscribeAsync(int memberId, SubscribeRequest request, CancellationToken ct = default);
    Task<CheckoutResponse> RenewAsync(int memberId, int subscriptionId, RenewRequest request, CancellationToken ct = default);
    Task<SubscriptionDto?> GetActiveSubscriptionAsync(int memberId, CancellationToken ct = default);
    Task<IReadOnlyList<SubscriptionDto>> GetSubscriptionsAsync(int memberId, CancellationToken ct = default);
    Task<SubscriptionDto> CancelAsync(int memberId, int subscriptionId, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(int? memberId, int take, CancellationToken ct = default);
}

public class BillingService : IBillingService
{
    private readonly AppDbContext _db;
    private readonly IPaymentFactory _paymentFactory;
    private readonly IDiscountResolver _discounts;
    private readonly TimeProvider _clock;
    private readonly PaymentOptions _paymentOptions;

    public BillingService(AppDbContext db, IPaymentFactory paymentFactory, IDiscountResolver discounts, TimeProvider clock,
        IOptions<PaymentOptions> paymentOptions)
    {
        _paymentOptions = paymentOptions.Value;
        _db = db;
        _paymentFactory = paymentFactory;
        _discounts = discounts;
        _clock = clock;
    }

    /// <summary>Fails closed: with no real gateway behind it, checkout must not hand out memberships.</summary>
    private void EnsurePaymentsAreEnabled()
    {
        if (!_paymentOptions.AllowSimulated)
            throw new DomainException("ระบบชำระเงินยังไม่เปิดให้บริการ กรุณาติดต่อเจ้าหน้าที่", StatusCodes.Status503ServiceUnavailable);
    }

    public async Task<DiscountQuoteDto> QuoteAsync(int memberId, DiscountQuoteRequest request, CancellationToken ct = default)
    {
        var member = await LoadMemberAsync(memberId, ct);
        var plan = await LoadPlanAsync(request.MembershipPlanId, ct);
        var context = await BuildContextAsync(member, plan, plan.Price, request.PromoCode, ct);

        var offers = _discounts.ResolveAllApplicable(context);
        var best = offers.Count == 0 ? DiscountResult.None : offers[0];

        return new DiscountQuoteDto(
            plan.Price,
            best.Amount,
            Math.Round(plan.Price - best.Amount, 2),
            best.Label,
            offers.Select(o => new DiscountOptionDto(o.Label, o.Amount)).ToList());
    }

    public async Task<CheckoutResponse> SubscribeAsync(int memberId, SubscribeRequest request, CancellationToken ct = default)
    {
        EnsurePaymentsAreEnabled();
        var now = _clock.GetUtcNow().UtcDateTime;
        var member = await LoadMemberAsync(memberId, ct);
        var plan = await LoadPlanAsync(request.MembershipPlanId, ct);

        if (!plan.IsActive)
            throw new DomainException("แพ็กเกจนี้เลิกจำหน่ายแล้ว");

        var existing = await _db.Subscriptions
            .Include(s => s.MembershipPlan)
            .Where(s => s.MemberId == memberId && s.Status == SubscriptionStatus.ACTIVE)
            .FirstOrDefaultAsync(ct);

        existing?.RefreshExpiry(now);
        if (existing is not null && existing.IsUsable(now))
            throw DomainException.Conflict("คุณมีแพ็กเกจที่ใช้งานอยู่แล้ว กรุณาใช้การต่ออายุแทน");

        var subscription = new Subscription(member, plan, now, request.AutoRenew);
        _db.Subscriptions.Add(subscription);

        var payment = await ChargeAsync(member, subscription, plan, plan.Price, request.PromoCode,
            new PaymentRequest(request.PaymentMethod, plan.Price, request.CardHolderName, request.CardNumber, request.CardExpiry, request.PromptPayId), ct);

        subscription.Activate();
        await _db.SaveChangesAsync(ct);

        return new CheckoutResponse(subscription.ToDto(now), payment.ToDto(), payment.Process());
    }

    public async Task<CheckoutResponse> RenewAsync(int memberId, int subscriptionId, RenewRequest request, CancellationToken ct = default)
    {
        EnsurePaymentsAreEnabled();
        var now = _clock.GetUtcNow().UtcDateTime;
        var member = await LoadMemberAsync(memberId, ct);

        var subscription = await _db.Subscriptions
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.MemberId == memberId, ct)
            ?? throw DomainException.NotFound("การสมัครสมาชิก");

        var plan = subscription.MembershipPlan;

        var payment = await ChargeAsync(member, subscription, plan, plan.Price, request.PromoCode,
            new PaymentRequest(request.PaymentMethod, plan.Price, request.CardHolderName, request.CardNumber, request.CardExpiry, request.PromptPayId), ct);

        subscription.Renew(now);
        await _db.SaveChangesAsync(ct);

        return new CheckoutResponse(subscription.ToDto(now), payment.ToDto(), payment.Process());
    }

    public async Task<SubscriptionDto?> GetActiveSubscriptionAsync(int memberId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var subscription = await _db.Subscriptions
            .Include(s => s.Member)
            .Include(s => s.MembershipPlan)
            .Where(s => s.MemberId == memberId && s.Status == SubscriptionStatus.ACTIVE)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        if (subscription is null) return null;

        subscription.RefreshExpiry(now);
        await _db.SaveChangesAsync(ct);

        return subscription.ToDto(now);
    }

    public async Task<IReadOnlyList<SubscriptionDto>> GetSubscriptionsAsync(int memberId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var subscriptions = await _db.Subscriptions
            .Include(s => s.Member)
            .Include(s => s.MembershipPlan)
            .Where(s => s.MemberId == memberId)
            .OrderByDescending(s => s.StartDate)
            .ToListAsync(ct);

        foreach (var s in subscriptions) s.RefreshExpiry(now);
        await _db.SaveChangesAsync(ct);

        return subscriptions.Select(s => s.ToDto(now)).ToList();
    }

    public async Task<SubscriptionDto> CancelAsync(int memberId, int subscriptionId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var subscription = await _db.Subscriptions
            .Include(s => s.Member)
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.MemberId == memberId, ct)
            ?? throw DomainException.NotFound("การสมัครสมาชิก");

        subscription.Cancel();
        await _db.SaveChangesAsync(ct);
        return subscription.ToDto(now);
    }

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(int? memberId, int take, CancellationToken ct = default)
    {
        var query = _db.Payments
            .Include(p => p.Member)
            .Include(p => p.Subscription)!.ThenInclude(s => s!.MembershipPlan)
            .AsQueryable();

        if (memberId.HasValue)
            query = query.Where(p => p.MemberId == memberId.Value);

        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .ToListAsync(ct);

        return payments.Select(p => p.ToDto()).ToList();
    }

    /// <summary>Factory builds the gateway object, Strategy computes the discount, then the net amount is persisted.</summary>
    private async Task<Payment> ChargeAsync(Member member, Subscription subscription, MembershipPlan plan,
        decimal grossAmount, string? promoCode, PaymentRequest request, CancellationToken ct)
    {
        var payment = _paymentFactory.Create(request, member, subscription);

        var context = await BuildContextAsync(member, plan, grossAmount, promoCode, ct);
        var discount = _discounts.ResolveBest(context);
        payment.ApplyDiscount(discount.Amount, discount.Label);

        payment.MarkPaid();
        _db.Payments.Add(payment);
        return payment;
    }

    private async Task<DiscountContext> BuildContextAsync(Member member, MembershipPlan? plan, decimal gross, string? promoCode, CancellationToken ct)
    {
        var paidCount = await _db.Payments.CountAsync(p => p.MemberId == member.Id && p.Status == PaymentStatus.PAID, ct);
        return new DiscountContext(member, plan, gross, promoCode, paidCount, _clock.GetUtcNow().UtcDateTime);
    }

    private async Task<Member> LoadMemberAsync(int memberId, CancellationToken ct) =>
        await _db.Members.FirstOrDefaultAsync(m => m.Id == memberId, ct)
        ?? throw DomainException.NotFound("สมาชิก");

    private async Task<MembershipPlan> LoadPlanAsync(int planId, CancellationToken ct) =>
        await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == planId, ct)
        ?? throw DomainException.NotFound("แพ็กเกจ");
}
