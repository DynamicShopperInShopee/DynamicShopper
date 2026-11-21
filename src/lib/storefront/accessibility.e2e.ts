import { expect, test, type Locator } from '@playwright/test';

const themes = ['standard', 'minimal', 'vibrant', 'large'] as const;
const languages = ['en', 'th'] as const;
const viewports = [
	{ width: 1440, height: 900 },
	{ width: 390, height: 844 }
];
const cooker = 'cooker-one-button';

async function assertReadable(scope: Locator, large: boolean) {
	const violations = await scope.evaluate(
		async (root, { floor, tap }) => {
			type Color = [number, number, number, number];
			const white: Color = [255, 255, 255, 1];
			const black: Color = [0, 0, 0, 1];
			await document.fonts.ready;
			const styles = new Map<Element, CSSStyleDeclaration>();
			const style = (element: Element) => {
				let value = styles.get(element);
				if (!value) {
					value = getComputedStyle(element);
					styles.set(element, value);
				}
				return value;
			};
			function color(value: string): Color | undefined {
				const channels = value.match(/\d*\.?\d+/g)?.map(Number);
				if (!channels || channels.length < 3) return;
				return [channels[0], channels[1], channels[2], channels[3] ?? 1];
			}
			function luminance(value: Color) {
				const linear = value.slice(0, 3).map((entry) => {
					const channel = entry / 255;
					return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
				});
				return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
			}
			function contrast(foreground: Color, background: Color) {
				const a = luminance(foreground);
				const b = luminance(background);
				return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
			}
			function background(element: Element, stop: Element | null = null, base = white): Color {
				const layers: Color[] = [];
				for (
					let ancestor: Element | null = element;
					ancestor && ancestor !== stop;
					ancestor = ancestor.parentElement
				) {
					const value = color(style(ancestor).backgroundColor);
					if (!value || value[3] === 0) continue;
					layers.push(value);
					if (value[3] === 1) break;
				}
				return layers.reduceRight<Color>(
					([r, g, b], [fr, fg, fb, alpha]) => [
						fr * alpha + r * (1 - alpha),
						fg * alpha + g * (1 - alpha),
						fb * alpha + b * (1 - alpha),
						1
					],
					base
				);
			}
			const bitmaps = new Map<HTMLImageElement, CanvasRenderingContext2D>();
			async function captionContrast(node: Node, image: HTMLImageElement, foreground: Color) {
				let bitmap = bitmaps.get(image);
				if (!bitmap) {
					await image.decode();
					const canvas = document.createElement('canvas');
					canvas.width = image.naturalWidth;
					canvas.height = image.naturalHeight;
					const context = canvas.getContext('2d', { willReadFrequently: true });
					if (!context) throw new Error('Cannot measure the product caption against its photo');
					context.drawImage(image, 0, 0);
					bitmap = context;
					bitmaps.set(image, context);
				}
				const frame = image.getBoundingClientRect();
				const scale = Math.max(
					frame.width / image.naturalWidth,
					frame.height / image.naturalHeight
				);
				const x = frame.x + (frame.width - scale * image.naturalWidth) / 2;
				const y = frame.y + (frame.height - scale * image.naturalHeight) / 2;
				const range = document.createRange();
				range.selectNode(node);
				let lowest = Infinity;
				for (const rect of range.getClientRects()) {
					const left = Math.max(0, Math.floor((rect.left - x) / scale));
					const top = Math.max(0, Math.floor((rect.top - y) / scale));
					const right = Math.min(image.naturalWidth, Math.ceil((rect.right - x) / scale));
					const bottom = Math.min(image.naturalHeight, Math.ceil((rect.bottom - y) / scale));
					if (right <= left || bottom <= top) continue;
					const pixels = bitmap.getImageData(left, top, right - left, bottom - top).data;
					for (let i = 0; i < pixels.length; i += 4)
						lowest = Math.min(
							lowest,
							contrast(foreground, [pixels[i], pixels[i + 1], pixels[i + 2], 1])
						);
				}
				if (!Number.isFinite(lowest)) throw new Error('Caption text does not overlay the photo');
				return lowest;
			}
			function visible(element: Element) {
				return (
					element.getClientRects().length > 0 &&
					style(element).visibility === 'visible' &&
					style(element).clipPath !== 'inset(50%)' &&
					!element.closest('.visually-hidden, .sr-only')
				);
			}

			const problems = new Set<string>();
			const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
			while (walker.nextNode()) {
				const node = walker.currentNode;
				const element = node.parentElement;
				const text = node.textContent?.trim().slice(0, 80);
				if (!text || !element || !visible(element)) continue;
				const font = Number.parseFloat(style(element).fontSize);
				if (font < floor - 0.1) problems.add(`Text "${text}" is ${font}px, minimum ${floor}px`);
				if (element.closest(':disabled')) continue;
				const foreground = color(style(element).color);
				if (!foreground) continue;
				const image = element.closest('.caption')?.parentElement?.querySelector('img');
				const ratio = image
					? await captionContrast(node, image, foreground)
					: contrast(foreground, background(element));
				if (ratio < 4.5) problems.add(`Text "${text}" has a contrast ratio of ${ratio.toFixed(2)}`);
			}

			for (const element of root.querySelectorAll<HTMLElement>(
				'button, a[href], input:not([type=hidden]), select, textarea, summary'
			)) {
				if (!visible(element) || element.matches(':disabled')) continue;
				const label =
					element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName;
				const proxy =
					element instanceof HTMLInputElement && element.type === 'checkbox'
						? element.labels?.[0]
						: undefined;
				const stretched =
					element.matches('a') && getComputedStyle(element, '::after').position === 'absolute'
						? element.closest('.product')
						: undefined;
				const rect = (proxy || stretched || element).getBoundingClientRect();
				if (Math.min(rect.width, rect.height) < tap - 0.1) {
					problems.add(
						`Control "${label.slice(0, 80)}" is ${Math.round(rect.width)} × ${Math.round(rect.height)}px, minimum ${tap}px`
					);
				}
			}

			for (const glyph of root.querySelectorAll<SVGElement>('.art svg')) {
				if (!visible(glyph)) continue;
				const foreground = color(style(glyph).color);
				if (!foreground) continue;
				const gallery = glyph.closest('.gallery');
				const ratio = gallery
					? Math.min(
							contrast(foreground, background(glyph, gallery, black)),
							contrast(foreground, background(glyph, gallery, white))
						)
					: contrast(foreground, background(glyph));
				if (ratio < 3) {
					problems.add('Product glyph has less than 3:1 contrast');
				}
			}
			if (floor === 20) {
				const seam = style(root.closest('.store') ?? root)
					.getPropertyValue('--seam')
					.trim();
				if (/^#[0-9a-f]{6}$/i.test(seam)) {
					const channel = (i: number) => Number.parseInt(seam.slice(i, i + 2), 16);
					if (contrast([channel(1), channel(3), channel(5), 1], background(root)) < 3)
						problems.add('The large-print seam has less than 3:1 contrast');
				}
			}
			return [...problems];
		},
		{ floor: large ? 20 : 12, tap: large ? 48 : 44 }
	);
	expect(violations).toEqual([]);
}

for (const theme of themes) {
	for (const lang of languages) {
		for (const { width, height } of viewports) {
			test(`${theme}, ${lang}, ${width}×${height} is readable and keyboard-operable`, async ({
				page
			}) => {
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.setViewportSize({ width, height });
				await page.goto('/?view=receipt');
				const store = page.locator('.store');
				const search = page.getByRole('searchbox');
				await expect(search).toBeEnabled();

				if (lang === 'th') await page.getByRole('button', { name: 'ไทย', exact: true }).click();
				await page.getByLabel(lang === 'th' ? 'ธีม' : 'Theme', { exact: true }).selectOption(theme);
				await expect(store).toHaveAttribute('lang', lang);
				await expect(store).toHaveAttribute('data-theme', theme);
				await search.fill(lang === 'th' ? 'หม้อหุงข้าว' : 'rice cooker');
				await search.press('Enter');
				const fact = (field: string) =>
					store
						.locator(
							`[data-product-id="${cooker}"][data-fact="${field}"], [data-product="${cooker}"][data-field="${field}"]`
						)
						.first();
				await expect(fact('name')).toBeVisible();
				await expect(fact('price')).toHaveText(lang === 'th' ? '690 บาท' : '฿690');

				const skip = page.getByRole('link', {
					name: lang === 'th' ? 'ข้ามไปที่รายการสินค้า' : 'Skip to products'
				});
				await skip.focus();
				await expect(skip).toBeFocused();
				expect(await skip.evaluate((link) => getComputedStyle(link).clipPath)).toBe('none');

				const filters = page.getByRole('button', {
					name: lang === 'th' ? 'ตัวกรอง' : 'Filters',
					exact: true
				});
				await filters.press('Enter');
				await expect(filters).toHaveAttribute('aria-expanded', 'true');
				await expect(filters).toBeFocused();
				const outline = await filters.evaluate((button) => ({
					width: Number.parseFloat(getComputedStyle(button).outlineWidth),
					style: getComputedStyle(button).outlineStyle
				}));
				expect(outline.width).toBeGreaterThanOrEqual(2);
				expect(outline.style).not.toBe('none');
				expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
					width
				);
				await assertReadable(store, theme === 'large');

				const chatTitle = lang === 'th' ? 'แชตกับผู้ช่วย' : 'Chat with the assistant';
				const inputLabel = lang === 'th' ? 'ถามหน้าร้าน' : 'Ask the store';
				if (width === 390) {
					const trigger = page.getByRole('button', { name: chatTitle, exact: true });
					await trigger.press('Enter');
					const dialog = page.getByRole('dialog', { name: chatTitle });
					await expect(dialog.getByRole('textbox', { name: inputLabel })).toBeFocused();
					await assertReadable(dialog, theme === 'large');
					await page.keyboard.press('Escape');
					await expect(dialog).toBeHidden();
					await expect(trigger).toBeFocused();
				} else {
					const dock = page.getByRole('complementary', { name: chatTitle });
					const shelf = await page.locator('#products').first().boundingBox();
					const bounds = await dock.boundingBox();
					expect(shelf && bounds && shelf.x + shelf.width <= bounds.x + 1).toBe(true);
				}

				expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
			});
			test(`listing ${theme}, ${lang}, ${width}×${height} is readable and keyboard-operable`, async ({
				page
			}) => {
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.setViewportSize({ width, height });
				await page.goto(`/product/${cooker}?view=receipt&theme=${theme}&lang=${lang}`);
				const listing = page.getByRole('main');
				await expect(listing).toHaveAttribute('lang', lang);
				await expect(listing).toHaveAttribute('data-theme', theme);
				await expect(listing.getByRole('heading', { level: 1 })).toBeVisible();
				await expect(
					listing.locator(`[data-product-id="${cooker}"][data-fact="price"]`)
				).toHaveText(lang === 'th' ? '690 บาท' : '฿690');
				await expect(listing.locator('[data-proof="verified"]')).toBeVisible();
				expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
					width
				);
				await assertReadable(listing, theme === 'large');

				const specsName = lang === 'th' ? 'สเปกสินค้า' : 'Specifications';
				const specs = page.getByRole('button', { name: specsName, exact: true });
				await specs.press('Enter');
				const sheet = page.getByRole('dialog', { name: specsName, exact: true });
				await expect(sheet.locator('[data-fact="spec.capacity"]')).toHaveText(
					lang === 'th' ? '1.8 ลิตร' : '1.8 L'
				);
				await expect(
					sheet.getByRole('button', { name: lang === 'th' ? 'ตกลง' : 'Done' })
				).toBeFocused();
				await assertReadable(sheet, theme === 'large');
				await page.keyboard.press('Escape');
				await expect(sheet).toBeHidden();
				await expect(specs).toBeFocused();
				expect(await specs.evaluate((button) => getComputedStyle(button).outlineStyle)).not.toBe(
					'none'
				);
				expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
			});
		}
	}
}

test('X-ray ignores typed or modified x and restores focus on close', async ({ page }) => {
	await page.goto('/?view=receipt');
	const search = page.getByRole('searchbox');
	const trigger = page.getByRole('button', { name: 'X-ray', exact: true });
	const panel = page.locator('#store-xray');
	await expect(search).toBeEnabled();
	await search.press('x');
	await expect(search).toHaveValue('x');
	await expect(panel).toBeHidden();

	await trigger.focus();
	await trigger.press('Alt+x');
	await expect(panel).toBeHidden();
	await trigger.press('x');
	const close = panel.getByRole('button', { name: 'Close X-ray', exact: true });
	await expect(close).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(trigger).toBeFocused();

	await trigger.press('Enter');
	await close.press('x');
	await expect(panel).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('X-ray shows explicit offline control and leaves unavailable measurements unpopulated', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	const panel = page.locator('#store-xray');
	await expect(panel.getByText('Offline accuracy unavailable', { exact: true })).toBeVisible();
	await expect(panel.getByText('Model accuracy unavailable', { exact: true })).toBeVisible();
	await panel.getByRole('checkbox', { name: 'Force offline', exact: true }).check();
	await expect(panel.getByRole('checkbox', { name: 'Force offline', exact: true })).toBeChecked();

	const dock = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await dock.getByRole('textbox', { name: 'Ask the store' }).fill('gaming mouse');
	await dock.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(panel.getByText('Reply passed', { exact: true })).toBeVisible();
	await expect(panel.getByText('Store updated', { exact: true })).toBeVisible();
	await expect(panel.locator('[data-source="trace"]')).toHaveCount(0);

	const optIn = panel.getByRole('button', { name: 'Try live model', exact: true });
	if (await optIn.count()) await expect(optIn).toBeDisabled();
	else await expect(panel.getByRole('button', { name: 'Simulate poisoned model' })).toHaveCount(0);
});

test('development X-ray guards a poisoned model without changing product facts', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?view=receipt');
	await page.getByRole('button', { name: 'X-ray', exact: true }).click();
	const panel = page.locator('#store-xray');
	const poison = panel.getByRole('button', { name: 'Simulate poisoned model', exact: true });
	test.skip((await poison.count()) === 0, 'The poisoned model is available in development only.');
	const price = page.locator('#products [data-fact="price"]').first();
	const before = await price.getAttribute('data-raw');

	await poison.click();
	await expect(
		panel.getByRole('button', { name: 'Poisoned model armed', exact: true })
	).toBeDisabled();
	const dock = page.getByRole('complementary', { name: 'Chat with the assistant' });
	await dock.getByRole('textbox', { name: 'Ask the store' }).fill('summer');
	await dock.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(panel.getByText('Reply replaced', { exact: true })).toBeVisible();
	await expect(panel.getByText('Store unchanged', { exact: true })).toBeVisible();
	await expect(price).toHaveAttribute('data-raw', before!);
});
