using FitnessCenter.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Data;

/// <summary>
/// Demo branches and a rolling class timetable. Kept apart from <see cref="DbSeeder"/> because that one only
/// runs on an empty database, whereas these must also appear on databases created before the feature
/// existed, and the timetable has to be topped up as time passes.
/// All names, addresses and phone numbers are fictional demo data.
/// </summary>
public static class ClubSeeder
{
    private const int TimetableDays = 14;

    // day, hour (UTC), minute, title, category, instructor key, minutes, capacity, room
    private static readonly (DayOfWeek Day, int Hour, int Minute, string Title, string Category, char Who, int Minutes, int Capacity, string Room)[] Template =
    {
        (DayOfWeek.Monday, 12, 0, "Yoga Flow", "YOGA", 'M', 60, 18, "Studio A"),
        (DayOfWeek.Monday, 18, 0, "HIIT Express", "HIIT", 'H', 45, 20, "Studio B"),
        (DayOfWeek.Tuesday, 18, 30, "BodyPump", "STRENGTH", 'S', 60, 24, "Studio A"),
        (DayOfWeek.Wednesday, 12, 0, "Pilates Core", "PILATES", 'M', 50, 16, "Studio A"),
        (DayOfWeek.Wednesday, 19, 0, "Cycling Rush", "CYCLING", 'H', 45, 20, "Cycle Room"),
        (DayOfWeek.Thursday, 18, 0, "HIIT Express", "HIIT", 'H', 45, 20, "Studio B"),
        (DayOfWeek.Thursday, 19, 0, "Mobility & Recovery", "MOBILITY", 'M', 45, 14, "Studio A"),
        (DayOfWeek.Friday, 18, 0, "BodyCombat", "COMBAT", 'H', 60, 20, "Studio B"),
        (DayOfWeek.Saturday, 9, 0, "Weekend Yoga", "YOGA", 'M', 60, 18, "Studio A"),
        (DayOfWeek.Saturday, 11, 30, "Functional Circuit", "FUNCTIONAL", 'S', 60, 16, "Functional Zone"),
        (DayOfWeek.Sunday, 9, 0, "Sunday Stretch", "MOBILITY", 'M', 45, 14, "Studio A"),
        (DayOfWeek.Sunday, 17, 0, "HYROX Prep", "HYROX", 'S', 75, 12, "HYROX Arena"),
    };

    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        await SeedBranchesAsync(db, logger, ct);
        await SeedTimetableAsync(db, logger, ct);
    }

    private static async Task SeedBranchesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await db.Branches.AnyAsync(ct)) return;

        db.Branches.AddRange(
            new Branch("TP Fitness สุขุมวิท 24", "123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย", "คลองเตย", "กรุงเทพมหานคร", "02-012-3401", 13.7233, 100.5697,
                "เปิดให้บริการ 24 ชั่วโมง", new[] { "Free Weights", "Cardio Deck", "HYROX Arena", "Sauna", "Locker" }),
            new Branch("TP Fitness สีลม", "45 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก", "บางรัก", "กรุงเทพมหานคร", "02-012-3402", 13.7286, 100.5340,
                "เปิดให้บริการ 24 ชั่วโมง", new[] { "Free Weights", "Cardio Deck", "Studio", "Locker" }),
            new Branch("TP Fitness ลาดพร้าว", "88 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร", "จตุจักร", "กรุงเทพมหานคร", "02-012-3403", 13.8030, 100.5610,
                "เปิดให้บริการ 24 ชั่วโมง", new[] { "Free Weights", "Cardio Deck", "Cycle Room", "Studio" }),
            new Branch("TP Fitness นิมมานเหมินท์", "9 ซอยนิมมานเหมินท์ 12 ตำบลสุเทพ อำเภอเมือง", "เมืองเชียงใหม่", "เชียงใหม่", "053-012-340", 18.7996, 98.9680,
                "05:00 – 23:00 น. ทุกวัน", new[] { "Free Weights", "Cardio Deck", "Studio", "Locker" }),
            new Branch("TP Fitness ป่าตอง", "77 ถนนราษฎร์อุทิศ 200 ปี ตำบลป่าตอง อำเภอกะทู้", "กะทู้", "ภูเก็ต", "076-012-340", 7.8961, 98.2963,
                "06:00 – 22:00 น. ทุกวัน", new[] { "Free Weights", "Cardio Deck", "Sauna" }),
            new Branch("TP Fitness ขอนแก่น", "21 ถนนศรีจันทร์ ตำบลในเมือง อำเภอเมือง", "เมืองขอนแก่น", "ขอนแก่น", "043-012-340", 16.4322, 102.8236,
                "05:00 – 23:00 น. ทุกวัน", new[] { "Free Weights", "Cardio Deck", "Studio" }));

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded demo branches.");
    }

    private static async Task SeedTimetableAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var horizon = now.Date.AddDays(TimetableDays);

        // Only top up when the timetable is (nearly) empty; never touch classes an admin has managed.
        if (await db.GroupClasses.AnyAsync(c => c.StartTime > now.AddDays(3), ct)) return;

        var trainers = await db.Trainers.OrderBy(t => t.Id).ToListAsync(ct);
        var branches = await db.Branches.Where(b => b.IsActive).OrderBy(b => b.Id).Take(3).ToListAsync(ct);
        if (trainers.Count == 0) return;

        Trainer Pick(char who) => who switch
        {
            'H' => trainers.FirstOrDefault(t => t.Specialization?.Contains("HIIT", StringComparison.OrdinalIgnoreCase) == true) ?? trainers[^1],
            'M' => trainers.FirstOrDefault(t => t.Specialization?.Contains("Mobility", StringComparison.OrdinalIgnoreCase) == true) ?? trainers[^1],
            _ => trainers.FirstOrDefault(t => t.Specialization?.Contains("Strength", StringComparison.OrdinalIgnoreCase) == true) ?? trainers[0],
        };

        var created = new List<GroupClass>();
        var index = 0;
        for (var date = now.Date; date < horizon; date = date.AddDays(1))
        {
            foreach (var slot in Template.Where(t => t.Day == date.DayOfWeek))
            {
                var start = date.AddHours(slot.Hour).AddMinutes(slot.Minute);
                if (start <= now.AddHours(1)) continue;

                var instructor = Pick(slot.Who);
                var branch = branches.Count == 0 ? null : branches[index % branches.Count];
                index++;

                // One deliberately tiny class so the "full" state is visible in the demo.
                var smallGroup = created.Count == 2;
                var title = smallGroup ? $"{slot.Title} (Small Group)" : slot.Title;
                var capacity = smallGroup ? 2 : slot.Capacity;

                created.Add(new GroupClass(title, slot.Category, DescriptionFor(slot.Category), slot.Room,
                    instructor.Id, branch?.Id, start, start.AddMinutes(slot.Minutes), capacity));
            }
        }

        db.GroupClasses.AddRange(created);
        await db.SaveChangesAsync(ct);

        // A few members already in, and the small group completely full.
        var members = await db.Members.OrderBy(m => m.Id).ToListAsync(ct);
        for (var i = 0; i < created.Count && members.Count > 0; i++)
        {
            var seats = created[i].Capacity == 2 ? 2 : i % 4 == 0 ? 2 : i % 3 == 0 ? 1 : 0;
            foreach (var member in members.Take(Math.Min(seats, members.Count)))
                db.ClassBookings.Add(new ClassBooking(created[i].Id, member.Id));
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Count} group classes for the next {Days} days.", created.Count, TimetableDays);
    }

    private static string DescriptionFor(string category) => category switch
    {
        "YOGA" => "ยืดเหยียดและหายใจสัมพันธ์กับท่าทาง เหมาะกับทุกระดับ",
        "HIIT" => "อินเทอร์วัลหนักสลับพัก เผาผลาญสูงใน 45 นาที",
        "STRENGTH" => "เวทเบาต่อเนื่องกับบาร์เบล เน้นทั้งร่างกาย เพลงมันส์",
        "PILATES" => "เสริมแกนกลางลำตัวและท่าทางให้มั่นคง",
        "CYCLING" => "ปั่นในห้องมืดไฟสีตามจังหวะเพลง ปรับแรงต้านได้เอง",
        "COMBAT" => "ต่อยเตะตามจังหวะ ปล่อยพลังและฝึกความคล่องตัว",
        "FUNCTIONAL" => "วงจรฝึกท่าเคลื่อนไหวพื้นฐานที่ใช้ได้ในชีวิตประจำวัน",
        "MOBILITY" => "ฟื้นฟูข้อต่อและกล้ามเนื้อหลังฝึกหนัก",
        "HYROX" => "ซ้อมสถานี HYROX ครบทั้งวิ่งและเวิร์กเอาต์",
        _ => "คลาสกรุ๊ปโดยผู้สอนที่ได้รับการรับรอง",
    };
}
