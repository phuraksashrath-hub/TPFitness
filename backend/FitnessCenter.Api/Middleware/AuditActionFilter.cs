using System.Security.Claims;
using System.Text.RegularExpressions;
using FitnessCenter.Api.Common;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FitnessCenter.Api.Middleware;

/// <summary>
/// Audits every state-changing call made by a signed-in user, so new endpoints are covered without
/// touching each controller. Only known routes get a readable label; anything else falls back to
/// the raw method and path so nothing silently escapes the trail.
/// </summary>
public class AuditActionFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> ReadOnlyMethods = new(StringComparer.OrdinalIgnoreCase) { "GET", "HEAD", "OPTIONS" };

    // "METHOD route-template" -> (category, label shown in the admin console)
    private static readonly Dictionary<string, (string Category, string Label)> Labels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PUT api/auth/me"] = ("ACCESS", "อัปเดตข้อมูลบัญชี"),
        ["POST api/auth/change-password"] = ("ACCESS", "เปลี่ยนรหัสผ่าน"),

        ["POST api/plans"] = ("CATALOG", "สร้างแพ็กเกจใหม่"),
        ["PUT api/plans/{id}"] = ("CATALOG", "แก้ไขสิทธิ์/ราคาแพ็กเกจ"),
        ["DELETE api/plans/{id}"] = ("CATALOG", "เก็บแพ็กเกจเข้าคลัง"),

        ["POST api/subscriptions"] = ("BILLING", "สมัครและชำระเงินแพ็กเกจ"),
        ["POST api/subscriptions/{id}/renew"] = ("BILLING", "ต่ออายุแพ็กเกจ"),
        ["POST api/subscriptions/{id}/cancel"] = ("BILLING", "ยกเลิกแพ็กเกจสมาชิก"),

        ["POST api/sessions/book"] = ("BOOKING", "จองเซสชัน PT"),
        ["PUT api/sessions/{id}/reschedule"] = ("BOOKING", "เลื่อนเซสชัน PT"),
        ["POST api/sessions/{id}/cancel"] = ("BOOKING", "ยกเลิกเซสชัน PT"),
        ["POST api/sessions/{id}/complete"] = ("BOOKING", "ปิดเซสชันการฝึก"),

        ["POST api/members/{id}/status"] = ("PEOPLE", "เปลี่ยนสถานะสมาชิก"),
        ["PUT api/members/me/metrics"] = ("PEOPLE", "อัปเดตข้อมูลร่างกายสมาชิก"),
        ["PUT api/trainers/me/expertise"] = ("PEOPLE", "อัปเดตโปรไฟล์โค้ช"),

        ["POST api/trainers/me/blocks"] = ("SCHEDULE", "บล็อกเวลาสอน"),
        ["DELETE api/trainers/me/blocks/{id}"] = ("SCHEDULE", "ปลดบล็อกเวลาสอน"),

        ["POST api/programs"] = ("PROGRAM", "ออกโปรแกรมฝึก"),
        ["PUT api/programs/{id}"] = ("PROGRAM", "แก้ไขโปรแกรมฝึก"),
        ["DELETE api/programs/{id}"] = ("PROGRAM", "ลบโปรแกรมฝึก"),

        ["POST api/equipment"] = ("FACILITY", "ลงทะเบียนอุปกรณ์ใหม่"),
        ["PUT api/equipment/{id}"] = ("FACILITY", "แก้ไขข้อมูลอุปกรณ์"),
        ["DELETE api/equipment/{id}"] = ("FACILITY", "ปลดระวางอุปกรณ์"),
        ["PATCH api/equipment/{id}/status"] = ("FACILITY", "เปลี่ยนสถานะอุปกรณ์"),
        ["POST api/maintenance"] = ("FACILITY", "แจ้งซ่อมอุปกรณ์"),
        ["POST api/maintenance/{id}/assign"] = ("FACILITY", "มอบหมายงานซ่อม"),
        ["POST api/maintenance/{id}/resolve"] = ("FACILITY", "ปิดงานซ่อม"),
        ["POST api/maintenance/{id}/reject"] = ("FACILITY", "ปฏิเสธคำขอซ่อม"),

        ["POST api/leads/{id}/status"] = ("LEAD", "อัปเดตสถานะผู้สนใจทดลองเล่น"),

        ["POST api/classes/{id}/book"] = ("CLASS", "จองที่นั่งคลาสกรุ๊ป"),
        ["POST api/classes/{id}/cancel"] = ("CLASS", "ยกเลิกที่นั่งคลาสกรุ๊ป"),
        ["POST api/classes"] = ("CLASS", "สร้างคลาสกรุ๊ป"),
        ["PUT api/classes/{id}"] = ("CLASS", "แก้ไขคลาสกรุ๊ป"),
        ["POST api/classes/{id}/cancel-class"] = ("CLASS", "ยกเลิกคลาสกรุ๊ป"),
        ["POST api/branches"] = ("BRANCH", "เพิ่มสาขา"),
        ["PUT api/branches/{id}"] = ("BRANCH", "แก้ไขข้อมูลสาขา"),
    };

    private static readonly Regex ConstraintPattern = new(@"\{(\w+):[^}]+\}", RegexOptions.Compiled);

    private readonly IAuditService _audit;

    public AuditActionFilter(IAuditService audit) => _audit = audit;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();

        var request = context.HttpContext.Request;
        if (ReadOnlyMethods.Contains(request.Method)) return;

        var principal = context.HttpContext.User;
        if (principal.Identity?.IsAuthenticated != true ||
            !int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return;

        string outcome;
        if (executed.Exception is DomainException { StatusCode: StatusCodes.Status403Forbidden })
            outcome = "DENIED";
        else if (executed.Exception is null && (executed.Result as IStatusCodeActionResult)?.StatusCode is null or < 400)
            outcome = "SUCCESS";
        else
            return; // validation errors and conflicts are not access decisions

        // Templates carry route constraints ("{id:int}"); the label table is keyed without them.
        var template = ConstraintPattern.Replace(
            context.ActionDescriptor.AttributeRouteInfo?.Template ?? request.Path.Value ?? string.Empty, "{$1}");
        var key = $"{request.Method} {template}";
        var (category, label) = Labels.TryGetValue(key, out var found)
            ? found
            : ("ACCESS", $"{request.Method} /{template.TrimStart('/')}");

        var parts = new List<string>();
        if (context.RouteData.Values.TryGetValue("id", out var id)) parts.Add($"#{id}");
        if (request.Query.TryGetValue("status", out var status)) parts.Add($"→ {status}");
        var detail = parts.Count == 0 ? null : string.Join(" ", parts);

        await _audit.RecordForUserAsync(userId, category, label, detail, outcome);
    }
}
