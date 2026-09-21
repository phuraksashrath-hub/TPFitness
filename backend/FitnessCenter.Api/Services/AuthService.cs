using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, bool allowPrivilegedRoles, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IAuditService _audit;

    public AuthService(AppDbContext db, ITokenService tokens, IAuditService audit)
    {
        _db = db;
        _tokens = tokens;
        _audit = audit;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, bool allowPrivilegedRoles, CancellationToken ct = default)
    {
        var email = User.NormalizeEmail(request.Email);

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            throw DomainException.Conflict("อีเมลนี้ถูกลงทะเบียนไว้แล้ว");

        if (!allowPrivilegedRoles && request.Role != UserRole.MEMBER)
            throw DomainException.Forbidden("เฉพาะผู้ดูแลระบบเท่านั้นที่สร้างบัญชีเทรนเนอร์หรือแอดมินได้");

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        User user = request.Role switch
        {
            UserRole.TRAINER => CreateTrainer(email, hash, request),
            UserRole.ADMIN => new Admin(email, hash, request.FullName, request.PhoneNumber),
            _ => new Member(email, hash, request.FullName, request.PhoneNumber)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        await _audit.RecordForUserAsync(user.Id, "ACCESS", "สร้างบัญชีใหม่", user.Role.ToString());

        var (token, expiresAt) = _tokens.CreateAccessToken(user);
        return new AuthResponse(token, expiresAt, user.ToProfileDto());
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = User.NormalizeEmail(request.Email);
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Same message for unknown email and wrong password to avoid account enumeration.
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await _audit.RecordAnonymousAsync("ACCESS", "เข้าสู่ระบบไม่สำเร็จ", email, "DENIED");
            throw new DomainException("อีเมลหรือรหัสผ่านไม่ถูกต้อง", StatusCodes.Status401Unauthorized);
        }

        if (user.Status != UserStatus.ACTIVE)
        {
            await _audit.RecordForUserAsync(user.Id, "ACCESS", "เข้าสู่ระบบด้วยบัญชีที่ถูกระงับ", null, "DENIED");
            throw DomainException.Forbidden("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเคาน์เตอร์ต้อนรับ");
        }

        user.MarkLoggedIn();
        await _db.SaveChangesAsync(ct);
        await _audit.RecordForUserAsync(user.Id, "ACCESS", "เข้าสู่ระบบ", null);

        var (token, expiresAt) = _tokens.CreateAccessToken(user);
        return new AuthResponse(token, expiresAt, user.ToProfileDto());
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object?[] { userId }, ct)
            ?? throw DomainException.NotFound("ผู้ใช้");
        return user.ToProfileDto();
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object?[] { userId }, ct)
            ?? throw DomainException.NotFound("ผู้ใช้");

        user.UpdateProfile(request.FullName, request.PhoneNumber, request.AvatarUrl);
        await _db.SaveChangesAsync(ct);
        return user.ToProfileDto();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object?[] { userId }, ct)
            ?? throw DomainException.NotFound("ผู้ใช้");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new DomainException("รหัสผ่านปัจจุบันไม่ถูกต้อง", StatusCodes.Status401Unauthorized);

        user.ChangePasswordHash(BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12));
        await _db.SaveChangesAsync(ct);
    }

    private static Trainer CreateTrainer(string email, string hash, RegisterRequest request)
    {
        var trainer = new Trainer(email, hash, request.FullName, request.PhoneNumber);
        trainer.UpdateExpertise(request.Specialization, null, null, 0, 0);
        return trainer;
    }
}
