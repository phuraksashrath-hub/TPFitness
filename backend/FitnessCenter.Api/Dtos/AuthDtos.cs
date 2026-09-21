using System.ComponentModel.DataAnnotations;
using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Dtos;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(160)] string FullName,
    string? PhoneNumber,
    UserRole Role = UserRole.MEMBER,
    string? Specialization = null);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(string AccessToken, DateTime ExpiresAt, UserProfileDto User);

public record UserProfileDto(
    int Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    string Role,
    string Status,
    string DisplayTitle,
    DateTime CreatedAt);

public record UpdateProfileRequest(
    [Required, MaxLength(160)] string FullName,
    string? PhoneNumber,
    string? AvatarUrl);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword);

public record MemberProfileRequest(
    DateTime? DateOfBirth,
    string? Gender,
    decimal? HeightCm,
    decimal? WeightKg,
    string? FitnessGoal,
    string? EmergencyContact,
    [Range(2, 60)] decimal? BodyFatPercent = null,
    [Range(10, 120)] decimal? MuscleMassKg = null);

public record MemberMetricsDto(
    DateTime? DateOfBirth,
    string? Gender,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? BodyFatPercent,
    decimal? MuscleMassKg,
    string? FitnessGoal,
    string? EmergencyContact);

public record TrainerProfileRequest(
    string? Specialization,
    string? Bio,
    string? Certifications,
    int YearsOfExperience,
    decimal HourlyRate);

public record TrainerDto(
    int Id,
    string FullName,
    string Email,
    string? AvatarUrl,
    string? Specialization,
    string? Bio,
    string? Certifications,
    int YearsOfExperience,
    decimal HourlyRate,
    decimal RatingAverage,
    int RatingCount);
