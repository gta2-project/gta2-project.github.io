import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.route('**/*', (route) => {
		const url = new URL(route.request().url());
		if (url.hostname !== '127.0.0.1' || url.pathname.endsWith('.mp4')) return route.abort();
		return route.continue();
	});
});

for (const width of [390, 1440]) {
	test(`opens documentation from the ${width}px navigation`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		const navigation = page.getByRole('navigation', {
			name: width === 390 ? 'Mobile navigation' : 'Primary navigation',
		});
		if (width === 390) await page.locator('.mobile-nav summary').click();
		await navigation.getByRole('link', { name: 'Documentation', exact: true }).click();
		await expect(page).toHaveURL(/\/documentation\/$/);
		await expect(page).toHaveTitle(/GTA-2 documentation/);
		await expect(page.locator('[role="main"] h1')).toBeHidden();
		await expect(page.locator('[role="main"] .hero')).toBeVisible();
	});
}

test('serves nested documentation, assets, examples, and search under its prefix', async ({ page, request }) => {
	for (const path of [
		'/documentation/',
		'/documentation/start/first-task.html',
		'/documentation/extend/controller.html',
		'/documentation/_static/logo.png',
		'/documentation/_static/custom.css',
		'/documentation/_images/pipeline.svg',
		'/documentation/searchindex.js',
	]) {
		const response = await request.get(path);
		expect(response.ok(), path).toBe(true);
	}
	await page.goto('/documentation/extend/controller.html');
	const example = page.locator('a[download][href$="/point_attractor.py"]');
	await expect(example).toHaveCount(1);
	const downloadUrl = await example.evaluate((link: HTMLAnchorElement) => link.href);
	expect(new URL(downloadUrl).pathname).toContain('/documentation/_downloads/');
	const source = await request.get(downloadUrl);
	expect(source.ok()).toBe(true);
	expect(await source.text()).toContain('class PointAttractor');
	await page.goto('/documentation/search.html?q=TCP');
	await expect(page.locator('#search-results li').first()).toBeVisible();
	const result = page.locator('#search-results li a').first();
	const target = await result.evaluate((link: HTMLAnchorElement) => link.href);
	expect(new URL(target).pathname).toMatch(/^\/documentation\//);
	await result.click();
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
