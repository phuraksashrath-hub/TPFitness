using FitnessCenter.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FitnessCenter.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<MembershipPlan> MembershipPlans => Set<MembershipPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<WorkoutProgram> WorkoutPrograms => Set<WorkoutProgram>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<TrainerBlock> TrainerBlocks => Set<TrainerBlock>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<TrialLead> TrialLeads => Set<TrialLead>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<GroupClass> GroupClasses => Set<GroupClass>();
    public DbSet<ClassBooking> ClassBookings => Set<ClassBooking>();

    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        // SQLite (and Postgres `timestamp`) drop the DateTimeKind, which would make the API
        // serialize timestamps without the trailing "Z" and shift every time shown in the browser.
        builder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        builder.Properties<DateTime?>().HaveConversion<NullableUtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        ConfigureUsers(b);
        ConfigurePlansAndSubscriptions(b);
        ConfigureSessions(b);
        ConfigurePrograms(b);
        ConfigureEquipment(b);
        ConfigurePayments(b);
        ConfigureEngagement(b);
        ConfigureClubs(b);

        if (Database.IsSqlite()) MapDecimalsAsDouble(b);
    }

    /// <summary>SQLite has no decimal type, so it cannot ORDER BY or SUM one. Store them as REAL instead.</summary>
    private static void MapDecimalsAsDouble(ModelBuilder b)
    {
        var decimalProperties = b.Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?));

        foreach (var property in decimalProperties)
            property.SetProviderClrType(typeof(double));
    }

    private static void ConfigureUsers(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.HasDiscriminator<string>("user_type")
             .HasValue<Admin>("ADMIN")
             .HasValue<Trainer>("TRAINER")
             .HasValue<Member>("MEMBER");

            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.Email).IsUnique().HasDatabaseName("uq_users_email");
            e.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(160).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(32);
            e.Property(x => x.AvatarUrl).HasMaxLength(512);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        });

        b.Entity<Member>(e =>
        {
            e.Property(x => x.Gender).HasMaxLength(24);
            e.Property(x => x.FitnessGoal).HasMaxLength(512);
            e.Property(x => x.EmergencyContact).HasMaxLength(128);
            e.Property(x => x.HeightCm).HasPrecision(5, 2);
            e.Property(x => x.WeightKg).HasPrecision(5, 2);
            e.Property(x => x.BodyFatPercent).HasPrecision(4, 1);
            e.Property(x => x.MuscleMassKg).HasPrecision(5, 2);
        });

        b.Entity<Trainer>(e =>
        {
            e.Property(x => x.Specialization).HasMaxLength(160);
            e.Property(x => x.Bio).HasMaxLength(2000);
            e.Property(x => x.Certifications).HasMaxLength(1000);
            e.Property(x => x.HourlyRate).HasPrecision(10, 2);
            e.Property(x => x.RatingAverage).HasPrecision(3, 2);
        });

        b.Entity<Admin>(e => e.Property(x => x.Department).HasMaxLength(120));
    }

    private static void ConfigurePlansAndSubscriptions(ModelBuilder b)
    {
        b.Entity<MembershipPlan>(e =>
        {
            e.ToTable("membership_plans");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.Perks).HasMaxLength(1000);
            e.Property(x => x.Tier).HasMaxLength(32);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasIndex(x => x.Name).IsUnique().HasDatabaseName("uq_plans_name");
        });

        b.Entity<Subscription>(e =>
        {
            e.ToTable("subscriptions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);

            e.HasOne(x => x.Member)
             .WithMany(m => m.Subscriptions)
             .HasForeignKey(x => x.MemberId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.MembershipPlan)
             .WithMany(p => p.Subscriptions)
             .HasForeignKey(x => x.MembershipPlanId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.MemberId, x.Status }).HasDatabaseName("ix_subscriptions_member_status");
        });
    }

    private static void ConfigureSessions(ModelBuilder b)
    {
        b.Entity<WorkoutSession>(e =>
        {
            e.ToTable("workout_sessions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.Property(x => x.CancellationReason).HasMaxLength(500);

            e.HasOne(x => x.Member)
             .WithMany(m => m.Sessions)
             .HasForeignKey(x => x.MemberId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Trainer)
             .WithMany(t => t.Sessions)
             .HasForeignKey(x => x.TrainerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Subscription)
             .WithMany()
             .HasForeignKey(x => x.SubscriptionId)
             .OnDelete(DeleteBehavior.SetNull);

            // Business rule #3: a trainer can never hold two live bookings on the same start slot.
            e.HasIndex(x => new { x.TrainerId, x.StartTime })
             .IsUnique()
             .HasDatabaseName("uq_trainer_timeslot")
             .HasFilter("\"Status\" = 'BOOKED'");

            e.HasIndex(x => new { x.MemberId, x.StartTime }).HasDatabaseName("ix_sessions_member_start");
        });
    }

    private static void ConfigureClubs(ModelBuilder b)
    {
        b.Entity<Branch>(e =>
        {
            e.ToTable("branches");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.HasIndex(x => x.Name).IsUnique().HasDatabaseName("uq_branches_name");
            e.Property(x => x.Address).HasMaxLength(300).IsRequired();
            e.Property(x => x.District).HasMaxLength(120).IsRequired();
            e.Property(x => x.Province).HasMaxLength(120).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(32);
            e.Property(x => x.OpeningHours).HasMaxLength(120).IsRequired();
            e.Property(x => x.Facilities).HasMaxLength(400);
        });

        b.Entity<GroupClass>(e =>
        {
            e.ToTable("group_classes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(160).IsRequired();
            e.Property(x => x.Category).HasMaxLength(32).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.Room).HasMaxLength(80);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);

            e.HasOne(x => x.Instructor)
             .WithMany()
             .HasForeignKey(x => x.InstructorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Branch)
             .WithMany()
             .HasForeignKey(x => x.BranchId)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.StartTime).HasDatabaseName("ix_group_classes_start");
        });

        b.Entity<ClassBooking>(e =>
        {
            e.ToTable("class_bookings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);

            e.HasOne(x => x.GroupClass)
             .WithMany(c => c.Bookings)
             .HasForeignKey(x => x.GroupClassId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Member)
             .WithMany()
             .HasForeignKey(x => x.MemberId)
             .OnDelete(DeleteBehavior.Cascade);

            // A member holds at most one live seat per class; cancelled seats stay as history.
            e.HasIndex(x => new { x.GroupClassId, x.MemberId })
             .IsUnique()
             .HasDatabaseName("uq_class_member_seat")
             .HasFilter("\"Status\" = 'BOOKED'");
        });
    }

    private static void ConfigureEngagement(ModelBuilder b)
    {
        b.Entity<TrainerBlock>(e =>
        {
            e.ToTable("trainer_blocks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Reason).HasMaxLength(200);
            e.HasOne(x => x.Trainer)
             .WithMany()
             .HasForeignKey(x => x.TrainerId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.TrainerId, x.StartTime }).HasDatabaseName("ix_trainer_blocks_trainer_start");
        });

        b.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActorName).HasMaxLength(160).IsRequired();
            e.Property(x => x.ActorRole).HasMaxLength(16).IsRequired();
            e.Property(x => x.Category).HasMaxLength(24).IsRequired();
            e.Property(x => x.Action).HasMaxLength(200).IsRequired();
            e.Property(x => x.Detail).HasMaxLength(400);
            e.Property(x => x.Outcome).HasMaxLength(16).IsRequired();
            e.HasIndex(x => x.OccurredAt).HasDatabaseName("ix_audit_logs_occurred");
        });

        b.Entity<TrialLead>(e =>
        {
            e.ToTable("trial_leads");
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(160).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(32).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.PreferredTime).HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(x => new { x.Phone, x.CreatedAt }).HasDatabaseName("ix_trial_leads_phone_created");
        });
    }

    private static void ConfigurePrograms(ModelBuilder b)
    {
        b.Entity<WorkoutProgram>(e =>
        {
            e.ToTable("workout_programs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(160).IsRequired();
            e.Property(x => x.Goal).HasMaxLength(300);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.Difficulty).HasMaxLength(24);

            e.HasOne(x => x.Member)
             .WithMany(m => m.Programs)
             .HasForeignKey(x => x.MemberId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Trainer)
             .WithMany(t => t.Programs)
             .HasForeignKey(x => x.TrainerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<WorkoutExercise>(e =>
        {
            e.ToTable("workout_exercises");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(500);
            e.Property(x => x.WeightKg).HasPrecision(6, 2);

            e.HasOne(x => x.WorkoutProgram)
             .WithMany(p => p.Exercises)
             .HasForeignKey(x => x.WorkoutProgramId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureEquipment(ModelBuilder b)
    {
        b.Entity<Equipment>(e =>
        {
            e.ToTable("equipment");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.SerialNumber).HasMaxLength(64).IsRequired();
            e.Property(x => x.Category).HasMaxLength(48);
            e.Property(x => x.Brand).HasMaxLength(96);
            e.Property(x => x.Location).HasMaxLength(120);
            e.Property(x => x.ImageUrl).HasMaxLength(512);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);
            e.HasIndex(x => x.SerialNumber).IsUnique().HasDatabaseName("uq_equipment_serial");
        });

        b.Entity<MaintenanceRequest>(e =>
        {
            e.ToTable("maintenance_requests");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000).IsRequired();
            e.Property(x => x.ResolutionNotes).HasMaxLength(2000);
            e.Property(x => x.RepairCost).HasPrecision(10, 2);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(24);
            e.Property(x => x.Priority).HasConversion<string>().HasMaxLength(16);

            e.HasOne(x => x.Equipment)
             .WithMany(q => q.MaintenanceRequests)
             .HasForeignKey(x => x.EquipmentId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ReportedBy)
             .WithMany()
             .HasForeignKey(x => x.ReportedByUserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.AssignedTo)
             .WithMany()
             .HasForeignKey(x => x.AssignedToUserId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigurePayments(ModelBuilder b)
    {
        b.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.HasKey(x => x.Id);
            e.HasDiscriminator<string>("payment_type")
             .HasValue<CreditCardPayment>("CREDIT_CARD")
             .HasValue<PromptPayPayment>("PROMPT_PAY");

            e.Property(x => x.GrossAmount).HasPrecision(12, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(12, 2);
            e.Property(x => x.NetAmount).HasPrecision(12, 2);
            e.Property(x => x.DiscountLabel).HasMaxLength(160);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.TransactionReference).HasMaxLength(64).IsRequired();
            e.Property(x => x.FailureReason).HasMaxLength(500);
            e.Ignore(x => x.Method);

            e.HasIndex(x => x.TransactionReference).IsUnique().HasDatabaseName("uq_payments_reference");

            e.HasOne(x => x.Member)
             .WithMany(m => m.Payments)
             .HasForeignKey(x => x.MemberId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Subscription)
             .WithMany(s => s.Payments)
             .HasForeignKey(x => x.SubscriptionId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<CreditCardPayment>(e =>
        {
            e.Property(x => x.CardHolderName).HasMaxLength(160);
            e.Property(x => x.CardLast4).HasMaxLength(4);
            e.Property(x => x.CardBrand).HasMaxLength(24);
            e.Property(x => x.ExpiryMonthYear).HasMaxLength(7);
        });

        b.Entity<PromptPayPayment>(e =>
        {
            e.Property(x => x.PromptPayId).HasMaxLength(32);
            e.Property(x => x.QrPayload).HasMaxLength(512);
        });
    }
}
