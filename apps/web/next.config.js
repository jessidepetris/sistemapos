/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = withSentryConfig(nextConfig, { silent: true });
