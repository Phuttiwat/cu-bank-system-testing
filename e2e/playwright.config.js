// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup'),
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // SLOWMO=500 npx playwright test --headed  -> waits 500 ms between actions (for demos)
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
});
