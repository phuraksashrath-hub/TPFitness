using FitnessCenter.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Data;

public static class DbSeeder
{
    /// <summary>
    /// Production start-up: creates the first administrator from configuration (Seed:AdminEmail / Seed:AdminPassword)
    /// when the database has no users at all. Nothing else is seeded, and no password ships in the code.
    /// </summary>
    public static async Task EnsureBootstrapAdminAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct)) return;

        var email = config["Seed:AdminEmail"];
        var password = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("The database has no users. Set Seed__AdminEmail and Seed__AdminPassword to create the first administrator.");
            return;
        }
        if (password.Length < 12)
            throw new InvalidOperationException("Seed:AdminPassword must be at least 12 characters.");

        var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        db.Users.Add(new Admin(email.Trim().ToLowerInvariant(), hash, config["Seed:AdminName"] ?? "ผู้ดูแลระบบ", null));
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created the first administrator {Email}.", email);
    }

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("Database already contains data; skipping seed.");
            return;
        }

        var demoPassword = config["Seed:DefaultPassword"]
            ?? throw new InvalidOperationException("Seed:DefaultPassword must be set to seed demo accounts.");
        var hash = BCrypt.Net.BCrypt.HashPassword(demoPassword, workFactor: 11);
        var now = DateTime.UtcNow;

        var admin = new Admin("admin@fitpulse.io", hash, "ณัฐชา อรุณโรจน์", "+66810000001");
        admin.SetDepartment("ฝ่ายปฏิบัติการ");

        var trainers = new List<Trainer>
        {
            BuildTrainer("marcus@fitpulse.io", hash, "มาร์คัส เชน", "+66810000010", "Strength & Hypertrophy", 8, 1200m, 4.9m,
                "NSCA-CSCS, NASM-CPT, USA Weightlifting L2",
                "โค้ชพาวเวอร์ลิฟติ้งที่เน้นการเพิ่มน้ำหนักอย่างเป็นระบบ ควบคู่กับเทคนิคที่ปลอดภัย"),
            BuildTrainer("sirin@fitpulse.io", hash, "ศิริน วัชรพงษ์", "+66810000011", "HIIT & Fat Loss", 5, 950m, 4.7m,
                "ACE-CPT, TRX Certified, HYROX Certified",
                "ผู้เชี่ยวชาญด้าน Metabolic Conditioning ที่สร้างนิสัยลดไขมันอย่างยั่งยืน"),
            BuildTrainer("aiko@fitpulse.io", hash, "อะอิโกะ ทานะกะ", "+66810000012", "Mobility & Rehab", 10, 1400m, 5.0m,
                "FMS Level 2, Yoga RYT-500",
                "นักบำบัดการเคลื่อนไหว ช่วยให้สมาชิกฝึกได้โดยไม่เจ็บในระยะยาว")
        };

        var members = new List<Member>
        {
            BuildMember("sophia@fitpulse.io", hash, "โซเฟีย รัตนะกุล", "+66820000001", new DateTime(1996, 3, 14), "FEMALE", 165, 58, "ลดน้ำหนัก 5 กก. และวิ่ง 10 กม. ให้จบ"),
            BuildMember("daniel@fitpulse.io", hash, "ดนัย ประเสริฐ", "+66820000002", new DateTime(1990, 9, 2), "MALE", 178, 82, "เบนช์น้ำหนักเท่าตัวให้ได้"),
            BuildMember("mei@fitpulse.io", hash, "เมย์ หลิน", "+66820000003", new DateTime(1999, 12, 21), "FEMALE", 160, 52, "แก้บุคลิกภาพและเพิ่มความยืดหยุ่น"),
            BuildMember("kittipong@fitpulse.io", hash, "กิตติพงศ์ แซ่ลิ้ม", "+66820000004", new DateTime(1985, 6, 8), "MALE", 172, 90, "ลดไขมันให้เหลือ 18%")
        };

        db.Users.Add(admin);
        db.Users.AddRange(trainers);
        db.Users.AddRange(members);

        var plans = new List<MembershipPlan>
        {
            new("Freedom", "สัญญาสั้น 3 เดือน ยกเลิกได้ง่าย ไม่มีค่าปรับเมื่อครบกำหนด", 5250m, 90, 2, "STANDARD",
                "เข้าคลับได้ทุกสาขาทั่วไทย|เข้าใช้งานตลอด 24 ชม.|ล็อกเกอร์ส่วนตัว|ตรวจองค์ประกอบร่างกาย 1 ครั้ง|เช็กอินด้วย QR ไร้สัมผัส"),
            new("Flexi 6 Months", "สัญญา 6 เดือน พร้อมคลาสกรุ๊ปไม่จำกัดและเทรนเนอร์ส่วนตัว 8 ครั้ง/เดือน", 9900m, 180, 8, "PREMIUM",
                "สิทธิ์ทั้งหมดของ Freedom|คลาสกรุ๊ปไม่จำกัด|เทรนเนอร์ส่วนตัว 8 ครั้ง/เดือน|ปรึกษาโภชนาการ|หยุดพักสิทธิ์ได้ 1 เดือน"),
            new("Stay Fit 12 Months", "สัญญารายปี คุ้มที่สุด พร้อมโค้ชประจำตัวและห้องฟื้นฟูร่างกาย", 18600m, 365, 10, "ELITE",
                "สิทธิ์ทั้งหมดของ Flexi 6 Months|โค้ชประจำตัว|ห้องฟื้นฟูร่างกายและซาวน่า|สิทธิ์จองก่อนใคร|ตรวจ InBody ทุกเดือน|ฟรี TP Fitness Duffle Bag")
        };

        db.MembershipPlans.AddRange(plans);

        var equipment = new List<Equipment>
        {
            new("Technogym Skillrun Treadmill", "EQ-TGM-9021", "CARDIO", "Technogym", "Cardio Deck (Lane 04)", new DateTime(2024, 2, 10), null),
            new("Concept2 RowErg PM5", "EQ-ROW-3305", "CARDIO", "Concept2", "Functional Zone (Bay 01)", new DateTime(2023, 11, 5), null),
            new("Eleiko IWF Power Rack", "EQ-ELK-1109", "STRENGTH", "Eleiko", "Free Weights Platform 2", new DateTime(2024, 5, 22), null),
            new("Hammer Strength Leg Press", "EQ-HMS-0077", "STRENGTH", "Hammer Strength", "Strength Zone", new DateTime(2022, 8, 30), null),
            new("Assault AirBike Pro", "EQ-ABP-0211", "CONDITIONING", "Assault Fitness", "HYROX Performance Arena", new DateTime(2025, 1, 18), null),
            new("Keiser Functional Trainer", "EQ-KSR-0090", "FUNCTIONAL", "Keiser", "Functional Area", new DateTime(2023, 4, 2), null)
        };

        db.Equipment.AddRange(equipment);
        await db.SaveChangesAsync(ct);

        // Subscriptions + payments so dashboards have realistic numbers on first run.
        var subscriptions = new List<Subscription>();
        for (var i = 0; i < members.Count; i++)
        {
            var plan = plans[i % plans.Count];
            var subscription = new Subscription(members[i], plan, now.AddDays(-15 - i * 7), autoRenew: i % 2 == 0);
            subscription.Activate();
            subscriptions.Add(subscription);
            db.Subscriptions.Add(subscription);
        }
        await db.SaveChangesAsync(ct);

        for (var i = 0; i < subscriptions.Count; i++)
        {
            var subscription = subscriptions[i];
            var plan = subscription.MembershipPlan;

            Payment payment = i % 2 == 0
                ? new CreditCardPayment(members[i], subscription, plan.Price, members[i].FullName, "4539578763621486", "12/29")
                : new PromptPayPayment(members[i], subscription, plan.Price, members[i].PhoneNumber ?? "0820000000");

            payment.ApplyDiscount(Math.Round(plan.Price * 0.1m, 2), "โปรเปิดตัวสาขา (-10%)");
            payment.MarkPaid();
            db.Payments.Add(payment);
        }
        await db.SaveChangesAsync(ct);

        // A week of bookings spread over the three trainers.
        var baseDay = now.Date.AddDays(1).AddHours(7);
        var sessionSlots = new[] { 0, 2, 4, 25, 27, 49, 51, 73 };
        for (var i = 0; i < sessionSlots.Length; i++)
        {
            var member = members[i % members.Count];
            var trainer = trainers[i % trainers.Count];
            var subscription = subscriptions[i % subscriptions.Count];
            var start = baseDay.AddHours(sessionSlots[i]);

            var session = new WorkoutSession(member, trainer, subscription, start, start.AddHours(1),
                i % 3 == 0 ? "เน้นท่าพื้นฐาน (Compound Lifts)" : null);

            subscription.ConsumeSession();
            db.WorkoutSessions.Add(session);
        }

        var program = new WorkoutProgram(members[0], trainers[0], "12-Week Strength Foundation",
            "สร้างพื้นฐานกล้ามเนื้อควบคู่กับการลดไขมัน",
            "แบ่งบน-ล่าง เน้นหลัก Progressive Overload", 12, "INTERMEDIATE");
        program.AddExercise("Back Squat", 1, 5, 5, 60, 120, "วอร์มอัพด้วยบาร์เปล่าก่อน");
        program.AddExercise("Romanian Deadlift", 1, 4, 8, 45, 90, null);
        program.AddExercise("Bench Press", 3, 5, 5, 40, 120, null);
        program.AddExercise("Seated Row", 3, 4, 10, 35, 75, null);
        program.AddExercise("Zone 2 Intervals", 5, 1, 1, null, 0, "พายเรือ 35 นาที");
        db.WorkoutPrograms.Add(program);

        var mobility = new WorkoutProgram(members[2], trainers[2], "Posture Reset", "แก้บุคลิกภาพจากการนั่งทำงานนาน",
            "โปรแกรมยืดเหยียดรายวันควบคู่การเสริมความแข็งแรงสะบัก", 6, "BEGINNER");
        mobility.AddExercise("Thoracic Extension on Roller", 1, 3, 10, null, 30, null);
        mobility.AddExercise("Band Pull-Apart", 1, 3, 15, null, 45, null);
        mobility.AddExercise("90/90 Hip Switch", 4, 3, 12, null, 30, null);
        db.WorkoutPrograms.Add(mobility);

        var brokenBike = new MaintenanceRequest(equipment[4], members[1], "พัดลมของ Air Bike มีเสียงครูด",
            "พัดลมมีเสียงครูดดังเมื่อใช้แรงต้านเกินระดับ 6 และหน้าจอกะพริบ", MaintenancePriority.HIGH);
        var loosePin = new MaintenanceRequest(equipment[3], trainers[1], "สลักน้ำหนักของ Leg Press ฝืด",
            "สลักเลือกน้ำหนักเสียบไม่สุดที่แผ่น 120 กก.", MaintenancePriority.MEDIUM);
        var treadmillBelt = new MaintenanceRequest(equipment[0], members[3], "สายพานลู่วิ่งลื่น",
            "สายพานลื่นเมื่อวิ่งเร็วเกิน 14 กม./ชม. ต้องปรับความตึงใหม่", MaintenancePriority.CRITICAL);
        treadmillBelt.Assign(admin.Id);

        db.MaintenanceRequests.AddRange(brokenBike, loosePin, treadmillBelt);

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded demo data. Sign in with admin@fitpulse.io / {Password}", demoPassword);
    }

    private static Trainer BuildTrainer(string email, string hash, string name, string phone,
        string specialization, int years, decimal rate, decimal rating, string certifications, string bio)
    {
        var trainer = new Trainer(email, hash, name, phone);
        trainer.UpdateExpertise(specialization, bio, certifications, years, rate);
        trainer.UpdateProfile(name, phone, $"https://i.pravatar.cc/160?u={Uri.EscapeDataString(email)}");
        for (var i = 0; i < 10; i++) trainer.AddRating((int)Math.Round(rating));
        return trainer;
    }

    private static Member BuildMember(string email, string hash, string name, string phone,
        DateTime dob, string gender, decimal height, decimal weight, string goal)
    {
        var member = new Member(email, hash, name, phone);
        // Rough demo body composition derived from height/weight so the telemetry card has data.
        var isFemale = gender == "FEMALE";
        var bmi = weight / (height / 100m * height / 100m);
        var bodyFat = Math.Round(Math.Clamp((isFemale ? 24m : 15m) + (bmi - 22m) * 1.1m, 8m, 40m), 1);
        var muscle = Math.Round(weight * (isFemale ? 0.36m : 0.44m), 1);
        member.UpdateBodyMetrics(dob, gender, height, weight, goal, null, bodyFat, muscle);
        member.UpdateProfile(name, phone, $"https://i.pravatar.cc/160?u={Uri.EscapeDataString(email)}");
        return member;
    }
}
