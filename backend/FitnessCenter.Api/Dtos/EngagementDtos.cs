using System.ComponentModel.DataAnnotations;

namespace FitnessCenter.Api.Dtos;

public record TrainerBlockDto(int Id, DateTime StartTime, DateTime EndTime, string? Reason);

public record CreateTrainerBlockRequest(
    [Required] DateTime StartTime,
    [Required] DateTime EndTime,
    [MaxLength(200)] string? Reason);

public record AuditLogDto(
    int Id,
    DateTime OccurredAt,
    string ActorName,
    string ActorRole,
    string Category,
    string Action,
    string? Detail,
    string Outcome);

public record CreateLeadRequest(
    [Required, MaxLength(160)] string FullName,
    [Required, RegularExpression(@"^[0-9+\-\s]{9,20}$", ErrorMessage = "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")] string Phone,
    [EmailAddress, MaxLength(256)] string? Email,
    [MaxLength(32)] string? PreferredTime,
    /// <summary>Honeypot: real visitors never see or fill this field.</summary>
    string? Website);

public record LeadDto(
    int Id,
    string FullName,
    string Phone,
    string? Email,
    string? PreferredTime,
    string Status,
    DateTime CreatedAt);
