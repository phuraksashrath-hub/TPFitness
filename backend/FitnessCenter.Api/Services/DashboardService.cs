using System.Globalization;
using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IDashboardService
{
    Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken ct = default);
    Task<MemberDashboardDto> GetMemberDashboardAsync(int memberId, CancellationToken ct = default);
    Task<TrainerDashboardDto> GetTrainerDashboardAsync(int trainerId, CancellationToken ct = default);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly IBillingService _billing;
    private readonly TimeProvider _clock;

    private const int MonthlySessionTarget = 40;
    private const int BookableHoursPerDay = 16; // 06:00–22:00, mirrors BookingService opening hours

    public DashboardService(AppDbContext db, IBillingService billing, TimeProvider clock)
    {
        _db = db;
        _billing = billing;
        _clock = clock;
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);

        var totalMembers = await _db.Members.CountAsync(ct);
        var activeSubscriptions = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.ACTIVE && s.EndDate > now, ct);
        var trainersOnDuty = await _db.Trainers.CountAsync(t => t.Status == UserStatus.ACTIVE, ct);
        var sessionsToday = await _db.WorkoutSessions.CountAsync(s => s.StartTime >= todayStart && s.StartTime < todayEnd && s.Status == SessionStatus.BOOKED, ct);

        var revenueThisMonth = await SumRevenueAsync(monthStart, monthStart.AddMonths(1), ct);
        var revenueLastMonth = await SumRevenueAsync(lastMonthStart, monthStart, ct);

        var equipmentTotal = await _db.Equipment.CountAsync(ct);
        var equipmentUnderMaintenance = await _db.Equipment.CountAsync(e => e.Status == EquipmentStatus.UNDER_MAINTENANCE, ct);
        var openMaintenance = await _db.MaintenanceRequests.CountAsync(m => m.Status == MaintenanceStatus.OPEN || m.Status == MaintenanceStatus.IN_PROGRESS, ct);

        var trend = new List<RevenuePointDto>();
        for (var i = 5; i >= 0; i--)
        {
            var from = monthStart.AddMonths(-i);
            var to = from.AddMonths(1);
            trend.Add(new RevenuePointDto(from.ToString("MMM", CultureInfo.InvariantCulture), await SumRevenueAsync(from, to, ct)));
        }

        var latestMaintenance = await _db.MaintenanceRequests
            .Include(m => m.Equipment).Include(m => m.ReportedBy).Include(m => m.AssignedTo)
            .OrderByDescending(m => m.ReportedAt).Take(6).ToListAsync(ct);

        var latestPayments = await _billing.GetPaymentsAsync(null, 6, ct);

        var cardCount = await _db.Payments.OfType<CreditCardPayment>().CountAsync(p => p.Status == PaymentStatus.PAID, ct);
        var promptPayCount = await _db.Payments.OfType<PromptPayPayment>().CountAsync(p => p.Status == PaymentStatus.PAID, ct);
        var paidTotal = cardCount + promptPayCount;
        var cardPercent = paidTotal == 0 ? 0 : (int)Math.Round(cardCount * 100.0 / paidTotal);
        var paymentMix = new PaymentMixDto(cardPercent, paidTotal == 0 ? 0 : 100 - cardPercent, paidTotal);

        var bookedNext7Days = await _db.WorkoutSessions.CountAsync(
            s => s.Status == SessionStatus.BOOKED && s.StartTime >= now && s.StartTime < now.AddDays(7), ct);
        var totalSlots = trainersOnDuty * BookableHoursPerDay * 7;
        var capacity = new TrainerCapacityDto(
            totalSlots == 0 ? 0 : (int)Math.Round(bookedNext7Days * 100.0 / totalSlots), bookedNext7Days, totalSlots);

        var zones = (await _db.Equipment
                .Where(e => e.Status != EquipmentStatus.RETIRED)
                .Select(e => new { Zone = e.Location ?? e.Category, e.Status })
                .ToListAsync(ct))
            .GroupBy(e => e.Zone)
            .Select(g => new ZoneStatusDto(g.Key, g.Count(), g.Count(e => e.Status != EquipmentStatus.UNDER_MAINTENANCE)))
            .OrderBy(z => z.Zone)
            .ToList();

        // Hour-of-day distribution of PT sessions: the closest real signal we have to club load.
        var hourly = new int[24];
        var sessionStarts = await _db.WorkoutSessions
            .Where(s => s.Status == SessionStatus.BOOKED || s.Status == SessionStatus.COMPLETED)
            .Select(s => s.StartTime)
            .ToListAsync(ct);
        foreach (var start in sessionStarts) hourly[start.Hour]++;

        return new AdminDashboardDto(
            totalMembers, activeSubscriptions, trainersOnDuty, sessionsToday,
            revenueThisMonth, revenueLastMonth, equipmentTotal, equipmentUnderMaintenance, openMaintenance,
            trend,
            latestMaintenance.OrderByDescending(m => m.Priority).Select(m => m.ToDto()).ToList(),
            latestPayments,
            paymentMix, capacity, zones, hourly);
    }

    public async Task<MemberDashboardDto> GetMemberDashboardAsync(int memberId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == memberId, ct)
            ?? throw DomainException.NotFound("สมาชิก");

        var activeSubscription = await _billing.GetActiveSubscriptionAsync(memberId, ct);

        var completed = await _db.WorkoutSessions.CountAsync(s => s.MemberId == memberId && s.Status == SessionStatus.COMPLETED, ct);

        var upcoming = await _db.WorkoutSessions
            .Include(s => s.Member).Include(s => s.Trainer)
            .Where(s => s.MemberId == memberId && s.Status == SessionStatus.BOOKED && s.StartTime >= now)
            .OrderBy(s => s.StartTime).Take(8).ToListAsync(ct);

        var programs = await _db.WorkoutPrograms
            .Include(p => p.Member).Include(p => p.Trainer).Include(p => p.Exercises)
            .Where(p => p.MemberId == memberId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt).Take(5).ToListAsync(ct);

        var payments = await _billing.GetPaymentsAsync(memberId, 5, ct);

        return new MemberDashboardDto(
            member.ToProfileDto(), activeSubscription, completed, upcoming.Count,
            upcoming.Select(s => s.ToDto()).ToList(),
            programs.Select(p => p.ToDto()).ToList(),
            payments,
            member.ToMetricsDto());
    }

    public async Task<TrainerDashboardDto> GetTrainerDashboardAsync(int trainerId, CancellationToken ct = default)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var weekEnd = todayStart.AddDays(7);

        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == trainerId, ct)
            ?? throw DomainException.NotFound("เทรนเนอร์");

        var today = await _db.WorkoutSessions
            .Include(s => s.Member).Include(s => s.Trainer)
            .Where(s => s.TrainerId == trainerId && s.StartTime >= todayStart && s.StartTime < todayEnd)
            .OrderBy(s => s.StartTime).ToListAsync(ct);

        var upcoming = await _db.WorkoutSessions
            .Include(s => s.Member).Include(s => s.Trainer)
            .Where(s => s.TrainerId == trainerId && s.Status == SessionStatus.BOOKED && s.StartTime >= todayEnd && s.StartTime < weekEnd)
            .OrderBy(s => s.StartTime).ToListAsync(ct);

        var sessionsThisWeek = await _db.WorkoutSessions
            .CountAsync(s => s.TrainerId == trainerId && s.StartTime >= todayStart && s.StartTime < weekEnd, ct);

        var clients = await _db.WorkoutSessions
            .Where(s => s.TrainerId == trainerId)
            .GroupBy(s => s.MemberId)
            .Select(g => new
            {
                MemberId = g.Key,
                TotalSessions = g.Count(),
                NextSessionAt = g.Where(s => s.Status == SessionStatus.BOOKED && s.StartTime >= now)
                                 .Min(s => (DateTime?)s.StartTime)
            })
            .ToListAsync(ct);

        var memberIds = clients.Select(c => c.MemberId).ToList();

        var memberInfo = await _db.Members
            .Where(m => memberIds.Contains(m.Id))
            .Select(m => new
            {
                m.Id,
                m.FullName,
                m.AvatarUrl,
                m.FitnessGoal,
                ActivePrograms = m.Programs.Count(p => p.IsActive && p.TrainerId == trainerId)
            })
            .ToListAsync(ct);

        var clientSummaries = clients
            .Join(memberInfo, c => c.MemberId, m => m.Id, (c, m) =>
                new ClientSummaryDto(m.Id, m.FullName, m.AvatarUrl, m.FitnessGoal, c.TotalSessions, c.NextSessionAt, m.ActivePrograms))
            .OrderBy(c => c.NextSessionAt ?? DateTime.MaxValue)
            .ToList();

        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var completedThisMonth = await _db.WorkoutSessions
            .Where(s => s.TrainerId == trainerId && s.Status == SessionStatus.COMPLETED
                        && s.StartTime >= monthStart && s.StartTime < monthStart.AddMonths(1))
            .Select(s => new { s.StartTime, s.EndTime })
            .ToListAsync(ct);
        var earnings = completedThisMonth.Sum(s => (decimal)(s.EndTime - s.StartTime).TotalHours) * trainer.HourlyRate;

        return new TrainerDashboardDto(
            trainer.ToProfileDto(),
            today.Count(s => s.Status == SessionStatus.BOOKED),
            sessionsThisWeek,
            clientSummaries.Count,
            trainer.RatingAverage,
            today.Select(s => s.ToDto()).ToList(),
            upcoming.Select(s => s.ToDto()).ToList(),
            clientSummaries,
            completedThisMonth.Count,
            MonthlySessionTarget,
            Math.Round(earnings, 2));
    }

    private async Task<decimal> SumRevenueAsync(DateTime from, DateTime to, CancellationToken ct)
    {
        var total = await _db.Payments
            .Where(p => p.Status == PaymentStatus.PAID && p.PaidAt >= from && p.PaidAt < to)
            .SumAsync(p => (decimal?)p.NetAmount, ct);

        return Math.Round(total ?? 0m, 2);
    }
}
