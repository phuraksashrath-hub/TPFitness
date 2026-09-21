using System.Web;
using Npgsql;

namespace FitnessCenter.Api.Data;

/// <summary>
/// Hosting platforms (Render, Railway, Heroku, Neon) hand out a URI such as
/// <c>postgres://user:pass@host:5432/db?sslmode=require</c>, while Npgsql is happiest with key/value pairs.
/// Anything that is not a URI is returned unchanged, so an ordinary connection string still works.
/// </summary>
public static class PostgresConnection
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException("ConnectionStrings:Postgres must be set when Database:Provider is Postgres.");

        var text = value.Trim();
        if (!text.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !text.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return text;

        var uri = new Uri(text);
        var credentials = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : null,
        };

        var query = HttpUtility.ParseQueryString(uri.Query);
        if (Enum.TryParse<SslMode>(query["sslmode"], ignoreCase: true, out var ssl))
            builder.SslMode = ssl;

        return builder.ConnectionString;
    }
}
