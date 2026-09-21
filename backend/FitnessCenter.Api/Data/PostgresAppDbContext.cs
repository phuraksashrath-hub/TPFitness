using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FitnessCenter.Api.Data;

/// <summary>
/// The same model as <see cref="AppDbContext"/>, but with its own migrations (<c>Data/MigrationsPostgres</c>).
/// EF migrations bake in provider-specific column types, so SQLite and PostgreSQL cannot share one history.
/// The application resolves <see cref="AppDbContext"/> either way; only the registration in Program.cs differs.
/// </summary>
public class PostgresAppDbContext : AppDbContext
{
    public PostgresAppDbContext(DbContextOptions<PostgresAppDbContext> options) : base(options) { }
}

/// <summary>
/// Lets <c>dotnet ef migrations add ... --context PostgresAppDbContext</c> run without a database or a
/// running host. The connection string is a placeholder: nothing connects while a migration is scaffolded.
/// </summary>
public class PostgresDesignTimeFactory : IDesignTimeDbContextFactory<PostgresAppDbContext>
{
    public PostgresAppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PostgresAppDbContext>()
            .UseNpgsql("Host=localhost;Database=design_time_only;Username=postgres;Password=unused")
            .Options;
        return new PostgresAppDbContext(options);
    }
}
