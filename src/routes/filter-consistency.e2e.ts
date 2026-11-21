import { expect, test, type Locator } from '@playwright/test';
import { categories } from '../lib/store-catalog';

async function appearance(control: Locator) {
	return control.evaluate((node) => {
		const style = getComputedStyle(node);
		return {
			background: style.backgroundColor,
			fontSize: style.fontSize,
			fontWeight: style.fontWeight,
			radius: style.borderRadius,
			paddingStart: style.paddingInlineStart,
			paddingEnd: style.paddingInlineEnd,
			borderColor: style.borderColor,
			borderWidth: style.borderWidth,
			color: style.color,
			height: node.getBoundingClientRect().height
		};
	});
}

for (const locale of ['en', 'th'] as const) {
	for (const width of [390, 1440]) {
		test(`category, shipping and capacity filters share a visual language in ${locale} at ${width}px`, async ({
			page,
			context
		}) => {
			const th = locale === 'th';
			const shippingName = th ? 'ส่งฟรี' : 'Free shipping';
			await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
			await page.goto('/');
			await expect(page.getByRole('button', { name: 'ไทย', exact: true })).toBeEnabled();
			if (th) await page.getByRole('button', { name: 'ไทย', exact: true }).click();
			await context.setOffline(true);
			const home = page.getByRole('navigation', {
				name: th ? 'หมวดหมู่' : 'Categories',
				exact: true
			});
			const gap = await home.evaluate((node) => getComputedStyle(node).columnGap);
			const normal = await appearance(
				home.getByRole('button', { name: shippingName, exact: true })
			);
			const selected = await appearance(
				home.getByRole('button', { name: th ? 'ทั้งหมด' : 'All', exact: true })
			);
			expect(normal.height).toBeGreaterThanOrEqual(44);
			expect(Number.parseFloat(normal.fontSize)).toBeGreaterThanOrEqual(12);

			await home.getByRole('button', { name: categories.cooker[locale], exact: true }).click();
			const cooker = page.getByRole('navigation', {
				name: th ? 'ตัวกรองหม้อหุงข้าว' : 'Rice cooker filters'
			});
			const shipping = cooker.getByRole('button', { name: shippingName, exact: true });
			expect(
				await shipping.locator('..').evaluate((node) => getComputedStyle(node).columnGap)
			).toBe(gap);
			const capacity = cooker
				.getByRole('button')
				.filter({ has: page.locator('[data-fact="spec.capacity"]') })
				.first();
			const category = cooker.getByRole('combobox', {
				name: th ? 'หมวดหมู่' : 'Categories',
				exact: true
			});
			const categoryChip = category.locator('..');
			for (const control of [shipping, capacity, categoryChip]) {
				expect(await appearance(control)).toEqual(normal);
			}
			await capacity.click();
			await expect(capacity).toHaveAttribute('aria-pressed', 'true');
			expect(await appearance(capacity)).toEqual(selected);
			await capacity.click();
			await shipping.click();
			await expect(shipping).toHaveAttribute('aria-pressed', 'true');
			expect(await appearance(shipping)).toEqual(selected);
			await shipping.click();
			await category.focus();
			expect(await categoryChip.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe(
				'2px'
			);

			await category.selectOption('skin');
			const skincare = page.getByRole('navigation', {
				name: th ? 'ตัวกรองสกินแคร์' : 'Skincare filters'
			});
			expect(
				await appearance(skincare.getByRole('button', { name: shippingName, exact: true }))
			).toEqual(normal);
			await skincare.getByRole('button', { name: shippingName, exact: true }).click();
			expect(
				await appearance(skincare.getByRole('button', { name: shippingName, exact: true }))
			).toEqual(selected);
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
		});
	}
}
