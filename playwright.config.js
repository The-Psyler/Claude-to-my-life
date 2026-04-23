const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:5173/Claude-to-my-life/',
        headless: true,
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173/Claude-to-my-life/',
        reuseExistingServer: true,
        timeout: 15000,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
