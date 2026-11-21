import { expect, test } from '@playwright/test';

test('the digital alias shows catalog modes, package items and extended specifications', async ({
	page,
	context
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-2');
	const main = page.locator('main');
	const details = page.locator('#details');
	await expect(main).toHaveAttribute('data-product', 'cooker-digital');
	await expect(details.locator('#digital-modes [data-fact="spec.programs"]')).toHaveText('9');
	await expect(details.locator('[data-fact^="detail.mode."]')).toHaveCount(9);
	await expect(details.locator('[data-fact="detail.packageCount"]')).toHaveText('6');
	await expect(details.locator('[data-fact^="detail.part."]')).toHaveCount(6);
	await expect(details.locator('#digital-serving [data-fact="spec.capacity"]')).toHaveText('2 L');
	await expect(details.locator('#digital-preset [data-fact="detail.presetHours"]')).toHaveText(
		'24 h'
	);
	await expect(details.locator('#digital-dimensions [data-fact="detail.depth"]')).toHaveAttribute(
		'data-raw',
		'24.5'
	);
	await expect(
		details.locator('[data-fact^="detail."]:not([data-product-id="cooker-digital"])')
	).toHaveCount(0);
	await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');

	await context.setOffline(true);
	const trigger = page.getByRole('button', { name: 'Specifications', exact: true });
	await trigger.click();
	const sheet = page.getByRole('dialog', { name: 'Specifications' });
	const scroll = sheet.getByRole('region', { name: 'Product attributes' });
	const done = sheet.getByRole('button', { name: 'Done' });
	await expect(scroll.locator('[data-fact="detail.model"]')).toBeVisible();
	await expect(scroll.locator('[data-fact="detail.weight"]')).toHaveText('1.7 kg');
	await expect(scroll.locator('[data-fact="detail.coating"]')).toHaveCount(1);
	await scroll.focus();
	await page.keyboard.press('End');
	await expect.poll(() => scroll.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
	await expect(done).toBeInViewport();
	await done.click();
	await expect(trigger).toBeFocused();
});

test('Thai digital details format the same facts without altering the one-button listing', async ({
	page
}) => {
	await page.goto('/product/cooker-digital?lang=th&theme=minimal');
	const details = page.locator('#details');
	await expect(details.locator('#digital-serving [data-fact="spec.capacity"]')).toHaveText('2 ลิตร');
	await expect(details.locator('[data-fact="detail.presetHours"]')).toHaveText('24 ชม.');
	await expect(details.locator('[data-fact="detail.presetHours"]')).toHaveAttribute(
		'data-raw',
		'24'
	);
	await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');

	await page.goto('/product/cooker-1?lang=th');
	await expect(page.locator('main')).toHaveAttribute('data-product', 'cooker-one-button');
	await expect(details.locator('[data-fact^="detail."]')).toHaveCount(0);
	await expect(details.locator('#cooker-capacity [data-fact="spec.capacity"]')).toHaveText(
		'1.8 ลิตร'
	);
	await expect(details.locator('#cooker-switch')).toBeVisible();
});

test('dimension values stay beside the cooker diagram and carry their catalog facts', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/product/cooker-2?lang=th');
	const dimensions = page.locator('#digital-dimensions');
	const information = page.getByRole('region', { name: 'ข้อมูลสินค้า' });
	const photo = dimensions.locator('img');
	await photo.scrollIntoViewIfNeeded();
	const bounds = (await photo.boundingBox())!;
	for (const [field, raw, formatted] of [
		['detail.width', '20', '20 ซม.'],
		['detail.depth', '24.5', '24.5 ซม.'],
		['detail.height', '21', '21 ซม.']
	]) {
		const measurement = dimensions.locator(`[data-fact="${field}"]`);
		await expect(measurement).toHaveAttribute('data-product-id', 'cooker-digital');
		await expect(measurement).toHaveAttribute('data-raw', raw);
		await expect(measurement).toHaveText(formatted);
		await expect(measurement).toHaveCSS('font-family', /IBM Plex Mono/);
		await expect(information.locator(`[data-fact="${field}"]`)).toHaveText(formatted);
		const label = (await measurement.boundingBox())!;
		if (field === 'detail.height') {
			expect(label.x).toBeLessThan(bounds.x);
			expect(label.y).toBeGreaterThan(bounds.y + bounds.height * 0.25);
			expect(label.y + label.height).toBeLessThan(bounds.y + bounds.height * 0.75);
		} else {
			expect(label.y).toBeGreaterThan(bounds.y + bounds.height * 0.8);
		}
	}
	await expect(dimensions.locator('[data-fact="detail.voltage"]')).toHaveText('220–240 โวลต์');
	await expect(information.locator('[data-fact="detail.weight"]')).toHaveText('1.7 กก.');
	await expect(page.locator('[data-proof]')).toHaveAttribute('data-proof', 'verified');
});

for (const lang of ['en', 'th']) {
	test(`large-print description captions fit the portrait panels in ${lang}`, async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/product/cooker-digital?theme=large&lang=${lang}`);
		await page.evaluate(() => document.fonts.ready);
		for (const panel of ['digital-intro', 'digital-serving', 'digital-nonstick']) {
			const caption = page.locator(`#${panel} figcaption`);
			await expect(caption).toBeVisible();
			const fits = await caption.evaluate((node) => {
				const panel = node.parentElement!.getBoundingClientRect();
				return Array.from(node.querySelectorAll('h3, p')).every((text) => {
					const range = document.createRange();
					range.selectNodeContents(text);
					return (
						Number.parseFloat(getComputedStyle(text).fontSize) >= 20 &&
						Array.from(range.getClientRects()).every(
							(line) => line.left >= panel.left - 1 && line.right <= panel.right + 1
						)
					);
				});
			});
			expect(fits).toBe(true);
		}
	});
}

for (const theme of ['standard', 'minimal', 'vibrant', 'large']) {
	for (const viewport of [
		{ width: 390, height: 844 },
		{ width: 1440, height: 900 }
	]) {
		test(`digital description loads its illustrations in ${theme} at ${viewport.width}px`, async ({
			page
		}) => {
			await page.setViewportSize(viewport);
			await page.goto(`/product/cooker-digital?theme=${theme}`);
			const story = page.locator('#digital-description');
			const photos = story.locator('img');
			await expect(story).toBeVisible();
			await expect(story.locator('figure img')).toHaveCount(7);
			await expect(story.locator('#digital-preset svg')).toBeVisible();
			await expect(story.locator('#digital-preset img')).toHaveCount(0);
			await expect(story.locator('#digital-package img')).toHaveCount(1);
			for (const photo of await photos.all()) {
				await photo.scrollIntoViewIfNeeded();
				await expect
					.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
					.toBeGreaterThan(0);
			}
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
			if (theme === 'large') {
				await expect(story.locator('[data-fact="detail.presetHours"]')).toHaveCSS(
					'font-size',
					'20px'
				);
			}
		});
	}
}
