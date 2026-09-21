namespace FitnessCenter.Api.Domain;

/// <summary>
/// Base class for every account in the system. Mapped with Table-Per-Hierarchy
/// so <see cref="Member"/> and <see cref="Trainer"/> share the same Users table.
/// </summary>
public abstract class User
{
    public int Id { get; protected set; }

    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public string? AvatarUrl { get; private set; }

    public UserRole Role { get; protected set; }
    public UserStatus Status { get; private set; } = UserStatus.ACTIVE;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; private set; }

    protected User() { }

    protected User(string email, string passwordHash, string fullName, string? phoneNumber)
    {
        Email = NormalizeEmail(email);
        PasswordHash = passwordHash;
        FullName = fullName;
        PhoneNumber = phoneNumber;
    }

    /// <summary>Short label used on dashboards. Overridden by subclasses.</summary>
    public virtual string GetDisplayTitle() => FullName;

    public void UpdateProfile(string fullName, string? phoneNumber, string? avatarUrl)
    {
        if (!string.IsNullOrWhiteSpace(fullName)) FullName = fullName.Trim();
        PhoneNumber = phoneNumber;
        AvatarUrl = avatarUrl;
    }

    public void ChangePasswordHash(string newHash) => PasswordHash = newHash;

    public void MarkLoggedIn() => LastLoginAt = DateTime.UtcNow;

    public void SetStatus(UserStatus status) => Status = status;

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
