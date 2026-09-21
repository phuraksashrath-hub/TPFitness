using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessCenter.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchesAndClasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    District = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Province = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    Latitude = table.Column<double>(type: "REAL", nullable: true),
                    Longitude = table.Column<double>(type: "REAL", nullable: true),
                    OpeningHours = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Facilities = table.Column<string>(type: "TEXT", maxLength: 400, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "group_classes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Room = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    InstructorId = table.Column<int>(type: "INTEGER", nullable: false),
                    BranchId = table.Column<int>(type: "INTEGER", nullable: true),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Capacity = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
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
                name: "class_bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GroupClassId = table.Column<int>(type: "INTEGER", nullable: false),
                    MemberId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "class_bookings");

            migrationBuilder.DropTable(
                name: "group_classes");

            migrationBuilder.DropTable(
                name: "branches");
        }
    }
}
