using System.ComponentModel.DataAnnotations;

namespace FitnessCenter.Api.Dtos;

public record BranchDto(
    int Id,
    string Name,
    string Address,
    string District,
    string Province,
    string? Phone,
    double? Latitude,
    double? Longitude,
    string OpeningHours,
    IReadOnlyList<string> Facilities,
    bool IsActive);

public record SaveBranchRequest(
    [Required, MaxLength(160)] string Name,
    [Required, MaxLength(300)] string Address,
    [Required, MaxLength(120)] string District,
    [Required, MaxLength(120)] string Province,
    [MaxLength(32)] string? Phone,
    double? Latitude,
    double? Longitude,
    [MaxLength(120)] string? OpeningHours,
    IReadOnlyList<string>? Facilities,
    bool IsActive = true);

public record GroupClassDto(
    int Id,
    string Title,
    string Category,
    string? Description,
    string? Room,
    int InstructorId,
    string InstructorName,
    string? InstructorAvatarUrl,
    int? BranchId,
    string? BranchName,
    DateTime StartTime,
    DateTime EndTime,
    int Capacity,
    int BookedCount,
    int SeatsLeft,
    string Status,
    bool IsBookedByMe);

public record SaveGroupClassRequest(
    [Required, MaxLength(160)] string Title,
    [Required, MaxLength(32)] string Category,
    [MaxLength(1000)] string? Description,
    [MaxLength(80)] string? Room,
    [Required] int InstructorId,
    int? BranchId,
    [Required] DateTime StartTime,
    [Range(30, 180)] int DurationMinutes = 60,
    [Range(1, 200)] int Capacity = 20);

public record ClassAttendeeDto(int MemberId, string FullName, string? AvatarUrl, DateTime BookedAt);
