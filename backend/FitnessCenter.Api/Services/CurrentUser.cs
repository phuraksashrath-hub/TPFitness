using System.Security.Claims;
using FitnessCenter.Api.Common;
using FitnessCenter.Api.Domain;

namespace FitnessCenter.Api.Services;

public interface ICurrentUser
{
    int Id { get; }
    UserRole Role { get; }
    bool IsAdmin { get; }
}

public class CurrentUser : ICurrentUser
{
    private readonly ClaimsPrincipal? _principal;

    public CurrentUser(IHttpContextAccessor accessor) => _principal = accessor.HttpContext?.User;

    public int Id
    {
        get
        {
            var raw = _principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(raw, out var id))
                throw DomainException.Forbidden("คำขอนี้ไม่ได้มาจากผู้ใช้ที่เข้าสู่ระบบ");
            return id;
        }
    }

    public UserRole Role =>
        Enum.TryParse<UserRole>(_principal?.FindFirstValue(ClaimTypes.Role), out var role)
            ? role
            : throw DomainException.Forbidden("ไม่พบข้อมูลสิทธิ์ของผู้ใช้ในคำขอ");

    public bool IsAdmin => _principal?.IsInRole(nameof(UserRole.ADMIN)) == true;
}
