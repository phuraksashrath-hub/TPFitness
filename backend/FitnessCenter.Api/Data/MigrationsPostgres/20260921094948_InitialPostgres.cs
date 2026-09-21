using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FitnessCenter.Api.Data.MigrationsPostgres
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActorId = table.Column<int>(type: "integer", nullable: true),
                    ActorName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ActorRole = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Category = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Detail = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Outcome = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    District = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Province = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    OpeningHours = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Facilities = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "equipment",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    SerialNumber = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Category = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    Brand = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: true),
                    Location = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    PurchaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastServicedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "membership_plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    SessionsPerMonth = table.Column<int>(type: "integer", nullable: false),
                    Perks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Tier = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membership_plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "trial_leads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PreferredTime = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trial_leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_type = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Department = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Gender = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: true),
                    HeightCm = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    FitnessGoal = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    EmergencyContact = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    BodyFatPercent = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    MuscleMassKg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    Specialization = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Bio = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Certifications = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    YearsOfExperience = table.Column<int>(type: "integer", nullable: true),
                    HourlyRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    RatingAverage = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: true),
                    RatingCount = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "group_classes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Category = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Room = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    InstructorId = table.Column<int>(type: "integer", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_group_classes_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_group_classes_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EquipmentId = table.Column<int>(type: "integer", nullable: false),
                    ReportedByUserId = table.Column<int>(type: "integer", nullable: false),
                    AssignedToUserId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    ResolutionNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RepairCost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    ReportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_maintenance_requests_equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_maintenance_requests_users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_maintenance_requests_users_ReportedByUserId",
                        column: x => x.ReportedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    MembershipPlanId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RemainingSessions = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    AutoRenew = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_subscriptions_membership_plans_MembershipPlanId",
                        column: x => x.MembershipPlanId,
                        principalTable: "membership_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_subscriptions_users_MemberId",
                        column: x => x.MemberId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trainer_blocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TrainerId = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trainer_blocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trainer_blocks_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_programs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    TrainerId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Goal = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DurationWeeks = table.Column<int>(type: "integer", nullable: false),
                    Difficulty = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_programs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_programs_users_MemberId",
                        column: x => x.MemberId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workout_programs_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "class_bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GroupClassId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_class_bookings_group_classes_GroupClassId",
                        column: x => x.GroupClassId,
                        principalTable: "group_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_bookings_users_MemberId",
                        column: x => x.MemberId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    SubscriptionId = table.Column<int>(type: "integer", nullable: true),
                    GrossAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    DiscountLabel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    TransactionReference = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    payment_type = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    CardHolderName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CardLast4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    CardBrand = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: true),
                    ExpiryMonthYear = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    PromptPayId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    QrPayload = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    QrExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payments_subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_payments_users_MemberId",
                        column: x => x.MemberId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workout_sessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    TrainerId = table.Column<int>(type: "integer", nullable: false),
                    SubscriptionId = table.Column<int>(type: "integer", nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_sessions_subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_workout_sessions_users_MemberId",
                        column: x => x.MemberId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workout_sessions_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workout_exercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkoutProgramId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    Sets = table.Column<int>(type: "integer", nullable: false),
                    Reps = table.Column<int>(type: "integer", nullable: false),
                    WeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    RestSeconds = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_exercises_workout_programs_WorkoutProgramId",
                        column: x => x.WorkoutProgramId,
                        principalTable: "workout_programs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_occurred",
                table: "audit_logs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "uq_branches_name",
                table: "branches",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_class_bookings_MemberId",
                table: "class_bookings",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "uq_class_member_seat",
                table: "class_bookings",
                columns: new[] { "GroupClassId", "MemberId" },
                unique: true,
                filter: "\"Status\" = 'BOOKED'");

            migrationBuilder.CreateIndex(
                name: "uq_equipment_serial",
                table: "equipment",
                column: "SerialNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_group_classes_BranchId",
                table: "group_classes",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_group_classes_InstructorId",
                table: "group_classes",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "ix_group_classes_start",
                table: "group_classes",
                column: "StartTime");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_requests_AssignedToUserId",
                table: "maintenance_requests",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_requests_EquipmentId",
                table: "maintenance_requests",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_requests_ReportedByUserId",
                table: "maintenance_requests",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "uq_plans_name",
                table: "membership_plans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_MemberId",
                table: "payments",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_SubscriptionId",
                table: "payments",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "uq_payments_reference",
                table: "payments",
                column: "TransactionReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_MembershipPlanId",
                table: "subscriptions",
                column: "MembershipPlanId");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_member_status",
                table: "subscriptions",
                columns: new[] { "MemberId", "Status" });

            migrationBuilder.CreateIndex(
                name: "ix_trainer_blocks_trainer_start",
                table: "trainer_blocks",
                columns: new[] { "TrainerId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "ix_trial_leads_phone_created",
                table: "trial_leads",
                columns: new[] { "Phone", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "uq_users_email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workout_exercises_WorkoutProgramId",
                table: "workout_exercises",
                column: "WorkoutProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_programs_MemberId",
                table: "workout_programs",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_programs_TrainerId",
                table: "workout_programs",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "ix_sessions_member_start",
                table: "workout_sessions",
                columns: new[] { "MemberId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_sessions_SubscriptionId",
                table: "workout_sessions",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "uq_trainer_timeslot",
                table: "workout_sessions",
                columns: new[] { "TrainerId", "StartTime" },
                unique: true,
                filter: "\"Status\" = 'BOOKED'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "class_bookings");

            migrationBuilder.DropTable(
                name: "maintenance_requests");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "trainer_blocks");

            migrationBuilder.DropTable(
                name: "trial_leads");

            migrationBuilder.DropTable(
                name: "workout_exercises");

            migrationBuilder.DropTable(
                name: "workout_sessions");

            migrationBuilder.DropTable(
                name: "group_classes");

            migrationBuilder.DropTable(
                name: "equipment");

            migrationBuilder.DropTable(
                name: "workout_programs");

            migrationBuilder.DropTable(
                name: "subscriptions");

            migrationBuilder.DropTable(
                name: "branches");

            migrationBuilder.DropTable(
                name: "membership_plans");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
