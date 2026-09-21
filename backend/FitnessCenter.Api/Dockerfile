# TP Fitness API — container image for hosts such as Render, Railway or Fly.io.
# Build context is this folder:  docker build -t tpfitness-api backend/FitnessCenter.Api

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first so this layer is cached until the package list changes.
COPY FitnessCenter.Api.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish FitnessCenter.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# Containers have no persistent disk, so the database is PostgreSQL. Everything else (Jwt__Key,
# ConnectionStrings__Postgres, Cors__AllowedOrigins__0, Seed__AdminEmail, ...) comes from the host's
# environment variables; see "Going live" in README.md.
ENV ASPNETCORE_ENVIRONMENT=Production \
    Database__Provider=Postgres \
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true \
    DOTNET_NOLOGO=1

# The base image ships an unprivileged "app" user (.NET 8+).
USER app

# Hosts inject PORT; 8080 is the fallback for a plain `docker run -p 8080:8080`.
EXPOSE 8080
CMD ["sh", "-c", "exec dotnet FitnessCenter.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
