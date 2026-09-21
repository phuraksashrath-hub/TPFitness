import type { NextConfig } from "next";

// Baseline hardening for every response. A Content-Security-Policy is deliberately not set here: Next injects
// inline scripts, so a useful CSP needs per-request nonces and should be added together with the hosting setup.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Only meaningful over HTTPS; browsers ignore it on plain HTTP.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Give the demo switches a value at build time. Unset NEXT_PUBLIC_* variables are not inlined, which would leave
  // the demo-login code (and its credentials) in the production bundle even though it never renders.
  env: {
    NEXT_PUBLIC_DEMO_LOGIN: process.env.NEXT_PUBLIC_DEMO_LOGIN ?? "false",
    NEXT_PUBLIC_DEMO_PASSWORD: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
