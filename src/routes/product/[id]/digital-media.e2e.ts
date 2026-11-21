import { expect, test } from '@playwright/test';

test('digital media belongs to the digital cooker and plays locally on demand', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const cachedClips = ['digital-overview', 'digital-rice', 'digital-serving'].map((name) =>
		page.waitForResponse(
			(response) =>
				response.url().includes(name) &&
				response.url().includes('.mp4') &&
				response.headers()['content-type']?.startsWith('video/') &&
				response.ok()
		)
	);
	await page.goto('/product/cooker-2');
	const gallery = page.getByRole('region', { name: 'Product photos' });
	await expect(gallery.locator('img').first()).toHaveAttribute('src', /digital-hero/);
	await expect(gallery.locator('[data-fact="spec.programs"]')).toHaveText('9');
	const media = page.getByRole('region', { name: 'Simulated review media' });
	await expect(media.getByRole('link')).toHaveCount(3);
	await Promise.all(cachedClips.map(async (response) => (await response).finished()));
	await context.setOffline(true);
	await gallery.getByRole('button', { name: 'Play rice cooker overview' }).click();
	await expect
		.poll(() => gallery.locator('video').evaluate((node) => (node as HTMLVideoElement).currentTime))
		.toBeGreaterThan(0);
	await gallery.getByRole('button', { name: /Close video/ }).click();
	await page.getByRole('button', { name: 'Play simulated rice demonstration' }).click();
	const dialog = page.getByRole('dialog', { name: 'Simulated product video' });
	await expect
		.poll(() => dialog.locator('video').evaluate((node) => (node as HTMLVideoElement).currentTime))
		.toBeGreaterThan(0);
	await page.keyboard.press('Escape');
	await expect(
		page.getByRole('button', { name: 'Play simulated rice demonstration' })
	).toBeFocused();
	await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');
});

for (const lang of ['en', 'th']) {
	test(`phone digital gallery caption clears navigation in ${lang}`, async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/product/cooker-2?lang=${lang}`);
		await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');
		const caption = await page.locator('.gallery [data-fact="shop"]').boundingBox();
		expect(caption).not.toBeNull();
		for (const control of await page.locator('header a, header button').all()) {
			if (!(await control.isVisible())) continue;
			const box = await control.boundingBox();
			if (!box || !caption) continue;
			const width =
				Math.min(caption.x + caption.width, box.x + box.width) - Math.max(caption.x, box.x);
			const height =
				Math.min(caption.y + caption.height, box.y + box.height) - Math.max(caption.y, box.y);
			expect(
				width <= 0 || height <= 0,
				(await control.getAttribute('aria-label')) ?? (await control.innerText())
			).toBe(true);
		}
	});
}
