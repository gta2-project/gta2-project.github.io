import { expect, test } from '@playwright/test';

const viewports = [
	{ width: 390, height: 844 },
	{ width: 768, height: 1024 },
	{ width: 1024, height: 768 },
	{ width: 1440, height: 900 },
	{ width: 1920, height: 1080 },
];

const benchmarkValues = [
	[90, 85, 55, 40, 75], [100, 85, 40, 45, 60], [100, 75, 5, 40, 45], [85, 75, 0, 30, 45],
	[85, 75, 5, 20, 40], [90, 65, 10, 40, 40], [80, 55, 0, 15, 0], [95, 80, 35, 45, 55],
	[100, 80, 40, 60, 80], [100, 75, 10, 30, 50], [85, 75, 0, 35, 50], [90, 75, 0, 40, 50],
	[90, 75, 10, 20, 5], [80, 60, 0, 20, 0],
];

test.beforeEach(async ({ page }) => {
	await page.route('**/*.mp4', (route) => route.abort());
});

test('renders without console errors or horizontal page overflow', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('ERR_FAILED')) errors.push(message.text()); });
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('From Language to Manipulation');

	for (const viewport of viewports) {
		await page.setViewportSize(viewport);
		const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, page: document.documentElement.scrollWidth }));
		expect(dimensions.page, `${viewport.width}px layout overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
	}

	expect(errors).toEqual([]);
});

test('exposes all tasks, source figures, methods, and values', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.paper-experiment-figure--light')).toHaveCount(1);
	await expect(page.locator('.paper-experiment-figure--dark')).toHaveCount(1);
	await expect(page.locator('.task-card')).toHaveCount(10);
	await expect(page.locator('.behavior-card')).toHaveCount(5);

	const rows = page.locator('.data-table-details tbody tr');
	await expect(rows).toHaveCount(14);
	for (let index = 0; index < benchmarkValues.length; index += 1) {
		const cells = await rows.nth(index).locator('td').allTextContents();
		expect(cells.map((cell) => Number.parseInt(cell, 10))).toEqual(benchmarkValues[index]);
	}


	await expect(page.getByRole('button', { name: 'Open the targeted feedback progression figure at full size' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open the full benchmark results figure at full size' })).toBeVisible();
});

test('filmstrip controls move the task rail', async ({ page }) => {
	await page.goto('/');
	const rail = page.locator('[data-filmstrip-rail]');
	await rail.scrollIntoViewIfNeeded();
	await expect(rail).toBeVisible();
	const before = await rail.evaluate((element) => element.scrollLeft);
	await page.locator('[data-filmstrip-next]').click();
	await page.waitForTimeout(800);
	const after = await rail.evaluate((element) => element.scrollLeft);
	expect(after).toBeGreaterThan(before);
});

test('mobile navigation exposes every primary section', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.locator('.mobile-nav summary').click();
	const links = page.locator('.mobile-nav nav a');
	await expect(links).toHaveCount(4);
	await expect(links).toHaveText(['Tasks', 'Method', 'Results', 'More']);
	await links.first().click();
	await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
});

test('desktop method narrative activates the responsible representation', async ({ page, browserName }) => {
	test.skip(browserName !== 'chromium', 'Scroll activation is covered once; the static mobile fallback is covered cross-browser.');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const generator = page.locator('[data-method-step="generator"]');
	await generator.scrollIntoViewIfNeeded();
	await expect.poll(() => page.locator('[data-method-flow]').getAttribute('data-active')).toBe('generator');
	await expect(page.locator('[data-method-node="generator"]')).toHaveClass(/is-active/);
});

test('video dialog loads on demand, closes with Escape, and restores focus', async ({ page, browserName }) => {
	test.skip(browserName !== 'chromium', 'Interaction contract is covered once; cross-browser rendering is covered separately.');
	await page.goto('/');
	const opener = page.getByRole('button', { name: 'Watch Pi-0.5 benchmark' });
	await opener.scrollIntoViewIfNeeded();
	await opener.click();
	const dialog = page.locator('#pi05-demo-dialog');
	await expect(dialog).toHaveAttribute('open', '');
	await expect(dialog.locator('video')).toHaveAttribute('src', '/media/pi05-benchmark.mp4');
	await page.keyboard.press('Escape');
	await expect(dialog).not.toHaveAttribute('open', '');
	await expect(dialog.locator('video')).not.toHaveAttribute('src');
	await expect(opener).toBeFocused();
});

test('reduced motion stops autoplay and the no-JS page retains its content', async ({ page, browser, browserName }) => {
	test.skip(browserName !== 'chromium', 'Media preference and no-JS fallbacks are browser-independent.');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect.poll(() => page.locator('[data-hero-video]').evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);

	const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	const noJsPage = await noJs.newPage();
	await noJsPage.goto('http://127.0.0.1:4321/');
	await expect(noJsPage.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(noJsPage.locator('[data-hero-video]')).toHaveAttribute('poster', '/media/gta2-hero-poster.jpg');
	await expect(noJsPage.getByText('Read the full abstract')).toBeVisible();
	await noJs.close();
});

test('initial report and core media assets resolve', async ({ request }) => {
	for (const path of ['/gta2-initial-report.pdf', '/media/gta2-hero-poster.jpg', '/media/gta2-hero-cut.mp4']) {
		const response = await request.get(path, { headers: { Range: 'bytes=0-1023' } });
		expect(response.ok(), path).toBe(true);
	}
});
