import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // allowedDevOrigins: [] — this MUST be set per-session to the sandbox's
  // proxied preview hostname (e.g. "*.<CODE_SERVER_DOMAIN>") before relying
  // on live preview. Do not ship a fixed value here — the domain is
  // session-specific. Without it, Next's dev server silently rejects the
  // proxied origin: the page renders but nothing hydrates, no error shown.
};

export default nextConfig;
