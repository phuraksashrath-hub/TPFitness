using System.ComponentModel.DataAnnotations;
using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Dtos;

public record BookSessionRequest(
    [Required] int TrainerId,
    [Required] DateTime StartTime,
    [Range(30, 180)] int DurationMinutes = 60,
    string? Notes = null);

public record RescheduleSessionRequest(
    [Required] DateTime StartTime,
    [Range(30, 180)] int DurationMinutes = 60);

public record CancelSessionRequest(string? Reason);

public record CompleteSessionRequest(string? Notes);

public record WorkoutSessionDto(
    int Id,
    int MemberId,
    string MemberName,
    string? MemberAvatarUrl,
    int TrainerId,
    string TrainerName,
    string? TrainerSpecialization,
    DateTime StartTime,
    DateTime EndTime,
    string Status,
    string? Notes,
    string? CancellationReason);

public record TrainerAvailabilityDto(
    int TrainerId,
    DateTime Date,
    IReadOnlyList<TimeSlotDto> Slots);

public record TimeSlotDto(DateTime StartTime, DateTime EndTime, bool IsAvailable);

public record WorkoutExerciseDto(
    int Id,
    string Name,
    int DayOfWeek,
    int Sets,
    int Reps,
    decimal? WeightKg,
    int RestSeconds,
    string? Notes);

public record SaveWorkoutExerciseRequest(
    [Required, MaxLength(160)] string Name,
    [Range(1, 7)] int DayOfWeek,
    [Range(1, 20)] int Sets,
    [Range(1, 200)] int Reps,
    decimal? WeightKg,
    [Range(0, 600)] int RestSeconds = 60,
    string? Notes = null);

public record WorkoutProgramDto(
    int Id,
    int MemberId,
    string MemberName,
    int TrainerId,
    string TrainerName,
    string Title,
    string? Goal,
    string? Description,
    int DurationWeeks,
    string Difficulty,
    bool IsActive,
    DateTime CreatedAt,
    IReadOnlyList<WorkoutExerciseDto> Exercises);

public record SaveWorkoutProgramRequest(
    [Required] int MemberId,
    [Required, MaxLength(160)] string Title,
    string? Goal,
    string? Description,
    [Range(1, 104)] int DurationWeeks = 8,
    string Difficulty = "BEGINNER",
    IReadOnlyList<SaveWorkoutExerciseRequest>? Exercises = null);

public record EquipmentDto(
    int Id,
    string Name,
    string SerialNumber,
    string Category,
    string? Brand,
    string? Location,
    DateTime? PurchaseDate,
    DateTime? LastServicedAt,
    string Status,
    string? ImageUrl,
    int OpenIssues);

public record SaveEquipmentRequest(
    [Required, MaxLength(160)] string Name,
    [Required, MaxLength(64)] string SerialNumber,
    string Category = "CARDIO",
    string? Brand = null,
    string? Location = null,
    DateTime? PurchaseDate = null,
    string? ImageUrl = null);

public record UpdateEquipmentStatusRequest([Required] EquipmentStatus Status);

public record CreateMaintenanceRequest(
    [Required] int EquipmentId,
    [Required, MaxLength(200)] string Title,
    [Required, MaxLength(2000)] string Description,
    MaintenancePriority Priority = MaintenancePriority.MEDIUM);

public record ResolveMaintenanceRequest(string? ResolutionNotes, decimal? RepairCost);

public record MaintenanceRequestDto(
    int Id,
    int EquipmentId,
    string EquipmentName,
    string? EquipmentLocation,
    string Title,
    string Description,
    string Priority,
    string Status,
    string ReportedByName,
    string? AssignedToName,
    string? ResolutionNotes,
    decimal? RepairCost,
    DateTime ReportedAt,
    DateTime? ResolvedAt);

public record AdminDashboardDto(
    int TotalMembers,
    int ActiveSubscriptions,
    int TrainersOnDuty,
    int SessionsToday,
    decimal RevenueThisMonth,
    decimal RevenueLastMonth,
    int EquipmentTotal,
    int EquipmentUnderMaintenance,
    int OpenMaintenanceRequests,
    IReadOnlyList<RevenuePointDto> RevenueTrend,
    IReadOnlyList<MaintenanceRequestDto> LatestMaintenance,
    IReadOnlyList<PaymentDto> LatestPayments,
    PaymentMixDto PaymentMix,
    TrainerCapacityDto TrainerCapacity,
    IReadOnlyList<ZoneStatusDto> Zones,
    IReadOnlyList<int> HourlyLoad);

/// <summary>Share of paid transactions per gateway, as whole percentages (they sum to 100 when any exist).</summary>
public record PaymentMixDto(int CreditCardPercent, int PromptPayPercent, int TotalTransactions);

/// <summary>Booked PT hours versus bookable hours across active trainers for the next seven days.</summary>
public record TrainerCapacityDto(int Percent, int BookedSlots, int TotalSlots);

/// <summary>Equipment availability for one training zone (grouped by location).</summary>
public record ZoneStatusDto(string Zone, int Total, int Available);

public record RevenuePointDto(string Label, decimal Amount);

public record MemberDashboardDto(
    UserProfileDto Profile,
    SubscriptionDto? ActiveSubscription,
    int SessionsCompleted,
    int SessionsUpcoming,
    IReadOnlyList<WorkoutSessionDto> UpcomingSessions,
    IReadOnlyList<WorkoutProgramDto> Programs,
    IReadOnlyList<PaymentDto> RecentPayments,
    MemberMetricsDto Metrics);

public record TrainerDashboardDto(
    UserProfileDto Profile,
    int SessionsToday,
    int SessionsThisWeek,
    int ActiveClients,
    decimal RatingAverage,
    IReadOnlyList<WorkoutSessionDto> TodaySchedule,
    IReadOnlyList<WorkoutSessionDto> UpcomingSessions,
    IReadOnlyList<ClientSummaryDto> Clients,
    int SessionsCompletedThisMonth,
    int MonthlySessionTarget,
    decimal EarningsThisMonth);

public record ClientSummaryDto(
    int MemberId,
    string FullName,
    string? AvatarUrl,
    string? FitnessGoal,
    int TotalSessions,
    DateTime? NextSessionAt,
    int ActivePrograms);
