# TP FITNESS — 24 Hour Performance

Fitness Center Management System

Full-stack fitness centre management platform built around OOP and classic design patterns.

- **Backend** — ASP.NET Core 8 Web API, EF Core, SQLite (dev) / PostgreSQL (prod), JWT + BCrypt
- **Frontend** — Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Axios
- **Design system** — *Kinetic Pulse*: high-contrast bold, pulse red `#E61B23` on carbon `#111116`
  over cool-white surfaces, Anybody + Outfit typography, full-capsule controls.
  The tokens live in `frontend/src/app/globals.css` and mirror
  `stitch_fitness_center_management_platform/kinetic_pulse/DESIGN.md`.
- **UI language** — Thai, including API error messages (`DomainException` texts are served in Thai
  and shown verbatim in toasts)

> **Branding:** the product is branded *TP Fitness*. Technical identifiers that predate the rename
> are intentionally unchanged so existing databases keep working: demo emails (`@fitpulse.io`),
> the demo password, the JWT issuer/audience, promo codes (`FITPULSE10`) and the `fitpulse.token`
> localStorage key. The `stitch_…/fitpulse_24h_…` design-export folder keeps its original name.

---

## Quick start

Two terminals.

### 1. API — http://localhost:5080

```powershell
cd backend/FitnessCenter.Api
dotnet run
```

On first run the API applies migrations, creates `fitnesscenter.db` and seeds demo data.
Seeding only runs against an empty database, so after changing `DbSeeder.cs` (or pulling a new
migration that changes demo data) delete `fitnesscenter.db` and restart to get the fresh demo set.
Swagger UI: <http://localhost:5080/swagger>

### 2. Web — http://localhost:3000

```powershell
cd frontend
npm install
npm run dev
```

> The web app reads live plans and trainers from the API, so start the backend first —
> otherwise the landing page renders its empty states.

### Demo accounts

| Role    | Email                | Password        |
| ------- | -------------------- | --------------- |
| Admin   | `admin@fitpulse.io`  | `FitPulse#2026` |
| Trainer | `marcus@fitpulse.io` | `FitPulse#2026` |
| Member  | `sophia@fitpulse.io` | `FitPulse#2026` |

Other seeded members: `daniel@`, `mei@`, `kittipong@fitpulse.io` (same password).
Trainers: `marcus@`, `sirin@`, `aiko@fitpulse.io`.

---

## Screens

| Route                 | Screen                                                     |
| --------------------- | ---------------------------------------------------------- |
| `/`                   | TP Fitness — landing page (live plans and coaches)        |
| `/clubs`              | Club finder — search branches, hours, phone, map link        |
| `/classes`            | Group-class timetable (14 days); members book and cancel seats |
| `/contact`            | Contact channels and FAQ (answers mirror the real booking / payment rules) |
| `/login`, `/register` | Authentication                                              |
| `/member`             | Member portal — overview, touchless pass, weekly program     |
| `/member/booking`     | Member portal — real-time PT booking engine                 |
| `/member/classes`     | Member portal — group classes and my seats                  |
| `/member/membership`  | Member portal — plans, checkout, receipts                   |
| `/member/programs`    | Member portal — assigned workout programs                   |
| `/member/profile`     | Member portal — account, body metrics, password             |
| `/trainer`            | Trainer portal — today's schedule and verification ledger    |
| `/trainer/schedule`   | Trainer portal — weekly calendar, block / unblock time slots |
| `/trainer/clients`    | Trainer portal — assigned active members                    |
| `/trainer/programs`   | Trainer portal — workout prescription engine                |
| `/trainer/profile`    | Trainer portal — expertise, rates, public card preview      |
| `/admin`              | Admin portal — console operations, 24h load curve, zone status |
| `/admin/members`      | Admin portal — membership directory                         |
| `/admin/trainers`     | Admin portal — trainer workforce, onboarding                |
| `/admin/equipment`    | Admin portal — equipment register                           |
| `/admin/maintenance`  | Admin portal — ISO 9001 maintenance queue                   |
| `/admin/plans`        | Admin portal — plans & transaction ledger                   |
| `/admin/leads`        | Admin portal — free-pass requests from the landing page      |
| `/admin/classes`      | Admin portal — schedule, edit, cancel classes; rosters       |
| `/admin/branches`     | Admin portal — branches shown in the club finder             |

The member and trainer portals use the club top-navigation shell; the admin portal uses the
carbon console rail. Both come from `components/portal/portal-shell.tsx`.

### Design reference

`stitch_fitness_center_management_platform/` holds the source design exports the UI follows:

| Folder                                     | What it defines                              |
| ------------------------------------------ | -------------------------------------------- |
| `kinetic_pulse/DESIGN.md`                  | Colour, type, spacing, elevation and shape tokens |
| `fitpulse_24h_fitness_landing_page/`       | Landing page composition                     |
| `member_portal_smart_booking_subscription/`| Member portal and booking flow               |
| `trainer_portal_schedule_client_management/`| Trainer portal                              |
| `admin_portal_operations_maintenance/`     | Admin console                                |

---

## Domain model (OOP)

```
User (abstract)
├── Member      — body metrics, subscriptions, sessions, payments
├── Trainer     — specialisation, certifications, rating, hourly rate
└── Admin       — department

MembershipPlan ──< Subscription ──< WorkoutSession >── Trainer
                        │
                        └──< Payment (abstract)
                                ├── CreditCardPayment
                                └── PromptPayPayment

WorkoutProgram ──< WorkoutExercise
Equipment ──< MaintenanceRequest
```

`User` and `Payment` are mapped Table-Per-Hierarchy, so inheritance is preserved in the database
via the `user_type` / `payment_type` discriminators. All state is encapsulated behind private
setters and intention-revealing methods (`ConsumeSession`, `Renew`, `Reschedule`, `Resolve`, …).

## Design patterns

| Pattern      | Where                                                 | Why                                                                      |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| **Factory**  | `Patterns/Factory/PaymentFactory.cs`                  | Builds the right `Payment` subclass from a `PaymentMethod` + request      |
| **Strategy** | `Patterns/Strategy/*`                                 | Interchangeable discount rules; `BestOfferDiscountResolver` picks the best |
| Polymorphism | `Payment.Process()`                                   | Each gateway renders its own receipt line                                 |

Adding a new discount rule means registering one more `IDiscountStrategy` in `Program.cs` — no
existing code changes. Available promo codes: `FITPULSE10`, `NEWYEAR20`, `VIP25`.

## Business rules

1. **Membership check** — booking requires an `ACTIVE`, unexpired subscription *and* an active account.
2. **Session quota** — booking requires `remaining_sessions > 0`; cancelling returns the credit.
3. **Conflict prevention** — overlap checks in `BookingService` plus a filtered unique index
   `uq_trainer_timeslot` on `(TrainerId, StartTime) WHERE Status = 'BOOKED'` as the last line of defence.
4. **Discounts** — the strategy engine computes the discount *before* the net amount is persisted.

5. **Trainer blocks** — a trainer can close time windows (`/api/trainers/me/blocks`). Blocked hours
   show as unavailable in the booking grid and cannot be booked; a block cannot be placed over an
   existing booking.

6. **Group classes** — seats are limited (`Capacity`). Booking needs an active, unexpired membership
   (no PT credit is used), refuses a full class, and refuses a member who already has a PT session or
   another class at that time. A seat can be given back until 2 hours before the start. The last seat
   is race-safe: a booking that pushes a class over capacity is rolled back, so 4 members grabbing 1
   seat at once yields exactly 1 winner. An instructor teaching a class cannot be booked for PT (or
   block time) in the same window, and cancelling a class releases every seat.

Extra guards: members cannot double-book themselves, cancellations need 2 hours' notice, and the
gym only accepts bookings between 06:00 and 22:00 UTC.

---

## Branches and classes

`ClubSeeder` adds six demo branches and a rolling 14-day class timetable on startup, separately from
`DbSeeder`, so databases created before these features still get them. Branch names, addresses and phone
numbers are fictional demo data. The timetable is topped up only when fewer than 3 days of future classes
remain, and it never touches classes an admin has managed. Admins manage both at `/admin/branches` and
`/admin/classes`; a branch with upcoming classes cannot be closed.

## Audit trail and leads

- **Audit log** — `AuditActionFilter` records every state-changing call made by a signed-in user
  (who, role, what, outcome) into `audit_logs`, and `AuthService` records logins including failures.
  New endpoints are covered automatically; give them a readable Thai label in the filter's `Labels`
  table, otherwise they appear as `METHOD /route`. Admins read it via `GET /api/audit` and on the
  console dashboard. Audit rows are written on their own DbContext so they never persist half-finished
  work from the request being audited.
- **Free-pass leads** — the landing-page form posts to the anonymous `POST /api/leads`. It is
  rate-limited (5 requests/minute/IP), has a honeypot field, and ignores a repeat of the same phone
  number within 24 hours. Admins work the list at `/admin/leads`.

---

## Configuration

`backend/FitnessCenter.Api/appsettings.json`

```jsonc
{
  "Database": { "Provider": "Sqlite" },     // or "Postgres"
  "ConnectionStrings": {
    "Sqlite": "Data Source=fitnesscenter.db",
    "Postgres": "Host=localhost;Port=5432;Database=fitnesscenter;Username=postgres;Password=postgres"
  },
  "Jwt": { "Issuer": "FitPulse", "Audience": "FitPulseClient", "Key": "", "ExpiryMinutes": 480 },
  "Cors": { "AllowedOrigins": ["http://localhost:3000"] }
}
```

> **Security:** `Jwt:Key` is intentionally empty in `appsettings.json`. The development key lives in
> `appsettings.Development.json`. For any real deployment supply it through user-secrets or the
> `Jwt__Key` environment variable — never commit it.

Frontend configuration lives in `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5080
```

### Switching to PostgreSQL

SQLite and PostgreSQL each have their own migration history, because migrations contain provider-specific
column types: `Data/Migrations` (SQLite) and `Data/MigrationsPostgres` (`PostgresAppDbContext`, same model).
Set `Database__Provider=Postgres` and `ConnectionStrings__Postgres`; the API applies the right set on start-up.
The connection string may be a normal key/value string or a hosting URI (`postgres://user:pass@host:5432/db`).
The database must use **UTF-8** (the default on hosted Postgres); the API logs a warning if it does not.

After changing the model, add a migration to **both** sets:

```powershell
cd backend/FitnessCenter.Api
dotnet ef migrations add <Name> -o Data/Migrations                                            # SQLite
dotnet ef migrations add <Name> --context PostgresAppDbContext -o Data/MigrationsPostgres     # PostgreSQL
```

---

## Going live

The defaults are **safe for production and inconvenient for demos**: with `ASPNETCORE_ENVIRONMENT=Production`
nothing is seeded, Swagger is off, no password ships in the code and checkout refuses to "take" payment.

### Try it on a phone first (same Wi-Fi)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\serve-on-lan.ps1
```

It builds the web app against this PC's LAN address, starts the API and the web app on all interfaces with
matching CORS, and prints the address to open on the phone. If the phone cannot connect, allow the two ports
in Windows Firewall (the script prints the command). It uses demo data and the demo-login panel: do not expose it
to the internet.

### API environment variables (production)

| Variable | Purpose |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT=Production` | Turns off Swagger and demo seeding, enables HTTPS redirection |
| `Jwt__Key` | **Required**, random secret of at least 32 characters (the API refuses to start without it). Generate one with `openssl rand -base64 48` |
| `ConnectionStrings__Sqlite` or `Database__Provider=Postgres` + `ConnectionStrings__Postgres` | Database. SQLite is one file: keep it on a persistent volume and back it up |
| `Cors__AllowedOrigins__0` | The public web address, e.g. `https://www.example.com` |
| `AllowedHosts` | Your API host name instead of `*` |
| `Seed__AdminEmail`, `Seed__AdminPassword` | Creates the **first administrator** when the database has no users (password 12+ characters). Remove them after first start |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` | **Required behind a reverse proxy / load balancer.** Without it every visitor shares the proxy's address, so the sign-in limit (10/min per address, `RateLimits__AuthPerMinute`) would lock everyone out together |
| `Payments__AllowSimulated=true` | Only for a demo. See the blocker below |
| `Seed__DemoData=true` + `Seed__DefaultPassword` | Only for a public demo site: seeds the demo accounts, branches and classes |

### Web app

Copy `frontend/.env.production.example` to `.env.production`, set `NEXT_PUBLIC_API_BASE_URL` to the API's public
**https** address, then `npm run build && npm run start`. These values are compiled in, so changing them needs a rebuild.
Serve both over HTTPS: a phone will block an https page that calls an http API.

### Deploy: Vercel (web) + Render (API and database)

Vercel hosts only the Next.js app. The .NET API and its database run elsewhere; this repository ships a
`Dockerfile` and a [`render.yaml`](render.yaml) for **Render**, but any host that runs a Docker image and offers
PostgreSQL works the same way (set the variables from the table above).

1. **Push the repository to GitHub** (`frontend/` must be plain folders in this repo, not a nested git repository).
2. **API + database on Render:** New → Blueprint → select the repository. Fill the three prompted values:
   `Cors__AllowedOrigins__0` (put a placeholder such as `https://example.com` for now), `Seed__AdminEmail`,
   `Seed__AdminPassword` (12+ characters). Render builds the image, creates PostgreSQL, applies the migrations and
   creates the first administrator. Check `https://<your-api>.onrender.com/health`.
   If you create the service by hand instead of using the Blueprint: runtime Docker, Dockerfile path
   `backend/FitnessCenter.Api/Dockerfile`, Docker context `backend/FitnessCenter.Api`, health check path `/health`.
3. **Web on Vercel:** Add New → Project → import the repository, set **Root Directory = `frontend`**, and add
   the environment variable `NEXT_PUBLIC_API_BASE_URL=https://<your-api>.onrender.com`. Deploy.
4. **Close the loop:** copy the Vercel address (e.g. `https://tpfitness.vercel.app`) into the API's
   `Cors__AllowedOrigins__0` and redeploy the API. Only that exact origin is allowed, so the address is the
   production domain, not the per-deployment preview URLs (previews will fail CORS unless added as
   `Cors__AllowedOrigins__1`, `__2`, ...).
5. Sign in at `/login` with the administrator you created, then add plans, trainers, branches and classes from the
   admin portal. A fresh production database is empty on purpose.

For a **public demo** instead (demo accounts, sample data, simulated checkout), also set on the API
`Seed__DemoData=true`, `Seed__DefaultPassword=<a password>` and `Payments__AllowSimulated=true` (they are the
commented block in `render.yaml`), and on Vercel `NEXT_PUBLIC_DEMO_LOGIN=true` plus `NEXT_PUBLIC_DEMO_PASSWORD`
with the same password. Then anyone can sign in with the demo accounts and change data, so do not put real
personal data into a demo site.

Free tiers (Render web service and database, Vercel Hobby) have limits such as sleeping when idle, a
database that expires, and non-commercial-use terms. Check each provider's current terms and pricing before
relying on them.

### Before real customers use it

These are decisions and content, not code, so they are **not** done:

1. **Payments are simulated.** There is no payment gateway: every checkout is marked paid instantly and the card
   form sends the full card number to this API. Integrate a provider with hosted fields / tokenization (so card
   numbers never touch the server) before charging anyone. Until then production checkout stays disabled.
2. **Legal pages are missing.** The footer's terms / privacy items are plain text and the sign-up form mentions a privacy
   policy that does not exist. The site collects names, phone numbers, body measurements and payment details.
3. **Times are shown in UTC** everywhere (booking hours 06:00–22:00 UTC are 13:00–05:00 in Thailand). Decide whether to
   show and enforce opening hours in `Asia/Bangkok` before launch.
4. **Marketing copy is placeholder:** "42 clubs", "1,000+ machines", "100+ coaches", the welcome-kit offer and its
   code / remaining spots, the "from 1,550 THB" price, the hotline and e-mail address. Also decide whether the public
   "system architecture" section and the "Admin" header link belong on the customer site.
5. **Images:** the landing and class photos came from the design export, are low resolution and show the old
   "FitPulse" name. Seeded avatars load from `i.pravatar.cc` (demo data only).
6. No password reset or e-mail verification yet; the session token lives in `localStorage` (8 h) and no
   Content-Security-Policy is set. Plan these with the hosting setup.

---

## Project layout

```
FitnessCenter/
├── FitnessCenter.sln
├── backend/FitnessCenter.Api/
│   ├── Common/            DomainException
│   ├── Controllers/       Auth, Plans, Sessions, Subscriptions (+ Payments),
│   │                      Trainers (+ Members), OperationsControllers.cs
│   │                      (Programs, Equipment, Maintenance, Dashboard)
│   ├── Data/              AppDbContext, DbSeeder, UtcDateTimeConverter, Migrations
│   ├── Domain/            User/Member/Trainer/Admin, MembershipPlan, Subscription,
│   │                      WorkoutSession, WorkoutProgram, Equipment, Payment
│   ├── Dtos/              Request/response contracts
│   ├── Mapping/           Domain → DTO projections
│   ├── Middleware/        Global exception handling
│   ├── Patterns/          Factory + Strategy
│   └── Services/          Auth, Billing, Booking, Program, Facility, Dashboard
└── frontend/src/
    ├── app/               Landing, auth, member/trainer/admin portals
    │   └── globals.css    Kinetic Pulse design tokens
    ├── components/        ui/ primitives, landing/, portal/
    └── lib/               api client, services, types, auth context, formatting
```

## Notes

- All timestamps are stored and served as **UTC**; `UtcDateTimeConverter` keeps the `DateTimeKind`
  through SQLite so the browser never shifts times.
- Decimals are mapped to `REAL` on SQLite because SQLite cannot `ORDER BY` or `SUM` a decimal.
- Card numbers are never persisted — only the brand and last four digits.
- The touchless club pass (`components/portal/touchless-pass.tsx`) renders a deterministic matrix
  from the member's rolling pass payload. It is a visual pass, not a scannable QR symbol — the
  turnstile reads the payload string itself.
- Anybody and Outfit carry no Thai glyphs, so Thai copy falls through to Noto Sans Thai, which is
  loaded alongside them in `app/layout.tsx`.
