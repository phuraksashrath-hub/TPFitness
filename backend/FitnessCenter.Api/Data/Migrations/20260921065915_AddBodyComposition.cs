using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessCenter.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBodyComposition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "BodyFatPercent",
                table: "users",
                type: "REAL",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MuscleMassKg",
                table: "users",
                type: "REAL",
                precision: 5,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BodyFatPercent",
                table: "users");

            migrationBuilder.DropColumn(
                name: "MuscleMassKg",
                table: "users");
        }
    }
}
