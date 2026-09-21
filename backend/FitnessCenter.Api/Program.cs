using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Middleware;
using FitnessCenter.Api.Patterns.Factory;
using FitnessCenter.Api.Patterns.Strategy;
using FitnessCenter.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "FitPulseFrontend";

// ---------- Persistence ----------
var provider = builder.Configuration.GetValue("Database:Provider", "Sqlite")!;
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres"));
    else
        options.UseSqlite(builder.Configuration.GetConnectionString("Sqlite"));
});

// ---------- Auth ----------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be set (Jwt__Key environment variable) to a random secret of at least 32 characters.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt.Issuer,
        ValidAudience = jwt.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

// ---------- Application services ----------
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.Configure<PaymentOptions>(o =>
    o.AllowSimulated = builder.Configuration.GetValue("Payments:AllowSimulated", builder.Environment.IsDevelopment()));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IClassService, ClassService>();
builder.Services.AddScoped<IProgramService, ProgramService>();
builder.Services.AddScoped<IFacilityService, FacilityService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddSingleton<IAuditService, AuditService>();
builder.Services.AddScoped<AuditActionFilter>();

// ---------- Design patterns ----------
builder.Services.AddSingleton<IPaymentFactory, PaymentFactory>();
builder.Services.AddScoped<IDiscountStrategy, PromoCodeDiscountStrategy>();
builder.Services.AddScoped<IDiscountStrategy, LoyaltyDiscountStrategy>();
builder.Services.AddScoped<IDiscountStrategy, LongTermPlanDiscountStrategy>();
builder.Services.AddScoped<IDiscountStrategy, BirthdayDiscountStrategy>();
builder.Services.AddScoped<IDiscountResolver, BestOfferDiscountResolver>();

// ---------- Web ----------
builder.Services.AddControllers(options => options.Filters.AddService<AuditActionFilter>())
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// The public free-pass form is the only anonymous write endpoint, so it gets a per-IP limit.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Sign-in and sign-up are the brute-force targets. 10 attempts a minute per client address.
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = builder.Configuration.GetValue("RateLimits:AuthPerMinute", 10), Window = TimeSpan.FromMinutes(1) }));
    options.AddPolicy("leads", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" })
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "TP Fitness Center API", Version = "v1" });

    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT returned by /api/auth/login.",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };

    options.AddSecurityDefinition("Bearer", scheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    await db.Database.MigrateAsync();
    if (app.Configuration.GetValue("Seed:DemoData", app.Environment.IsDevelopment()))
    {
        await DbSeeder.SeedAsync(db, app.Configuration, logger);
        await ClubSeeder.SeedAsync(db, logger);
    }
    else
    {
        await DbSeeder.EnsureBootstrapAdminAsync(db, app.Configuration, logger);
    }
}

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    // Responses carry personal data and per-user state; never let a shared cache keep them.
    if (context.Request.Path.StartsWithSegments("/api")) headers["Cache-Control"] = "no-store";
    await next();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o => o.DocumentTitle = "TP Fitness API");
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapGet("/health", (Microsoft.Extensions.Options.IOptions<PaymentOptions> payments) => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    // Lets the web app warn shoppers when checkout is only a simulation.
    payments = payments.Value.AllowSimulated ? "simulated" : "disabled"
}));

app.Run();
