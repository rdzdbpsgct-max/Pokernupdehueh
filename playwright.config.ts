import { defineConfig } from '@playwright/test';

const projects = [
  {
    name: 'chromium',
    use: { browserName: 'chromium' as const },
  },
];

if (process.env.PW_INCLUDE_WEBKIT === '1') {
  projects.push({
    name: 'webkit',
    use: { browserName: 'webkit' as const },
  });
}

const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => key !== 'NO_COLOR' && value !== undefined),
) as Record<string, string>;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects,
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    env: webServerEnv,
  },
});
