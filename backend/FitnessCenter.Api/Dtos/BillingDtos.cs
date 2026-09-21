using System.ComponentModel.DataAnnotations;
using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Dtos;

public record MembershipPlanDto(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    int DurationDays,
    int SessionsPerMonth,
    string Tier,
    IReadOnlyList<string> Perks,
    bool IsActive);

public record SaveMembershipPlanRequest(
    [Required, MaxLength(120)] string Name,
    string? Description,
    [Range(0, 1_000_000)] decimal Price,
    [Range(1, 3650)] int DurationDays,
    [Range(0, 100)] int SessionsPerMonth,
    string Tier = "STANDARD",
    IReadOnlyList<string>? Perks = null,
    bool IsActive = true);

public record SubscriptionDto(
    int Id,
    int MemberId,
    string MemberName,
    MembershipPlanDto Plan,
    DateTime StartDate,
    DateTime EndDate,
    int RemainingSessions,
    int DaysRemaining,
    string Status,
    bool AutoRenew,
    bool IsUsable);

public record SubscribeRequest(
    [Required] int MembershipPlanId,
    bool AutoRenew = false,
    string? PromoCode = null,
    PaymentMethod PaymentMethod = PaymentMethod.PROMPT_PAY,
    string? CardHolderName = null,
    string? CardNumber = null,
    string? CardExpiry = null,
    string? PromptPayId = null);

public record RenewRequest(
    string? PromoCode = null,
    PaymentMethod PaymentMethod = PaymentMethod.PROMPT_PAY,
    string? CardHolderName = null,
    string? CardNumber = null,
    string? CardExpiry = null,
    string? PromptPayId = null);

public record CheckoutResponse(SubscriptionDto Subscription, PaymentDto Payment, string GatewayMessage);

public record PaymentDto(
    int Id,
    string TransactionReference,
    string Method,
    decimal GrossAmount,
    decimal DiscountAmount,
    decimal NetAmount,
    string? DiscountLabel,
    string Status,
    DateTime CreatedAt,
    DateTime? PaidAt,
    string? MemberName,
    string? PlanName,
    string? QrPayload,
    string? CardLast4,
    string? CardBrand);

public record DiscountQuoteRequest(
    [Required] int MembershipPlanId,
    string? PromoCode);

public record DiscountQuoteDto(
    decimal GrossAmount,
    decimal DiscountAmount,
    decimal NetAmount,
    string Label,
    IReadOnlyList<DiscountOptionDto> AllOffers);

public record DiscountOptionDto(string Label, decimal Amount);
