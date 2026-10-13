import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	reporter: 'line',
	use: {
		baseURL: 'http://127.0.0.1:4321',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
		// Let Playwright own the process; prevent Astro's agent-triggered detachment.
		env: { ASTRO_PREVIEW_BACKGROUND: '1', ASTRO_TELEMETRY_DISABLED: '1' },
		url: 'http://127.0.0.1:4321',
		reuseExistingServer: false,
		timeout: 60_000,
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
	],
});
