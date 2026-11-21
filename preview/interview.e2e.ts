import { test, expect, type Locator, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

async function start(page: Page, english = true) {
	await page.goto('/');
	await expect(page.locator('.catalog-status')).not.toContainText(
		/Checking the catalog|กำลังตรวจสอบ/,
		{
			timeout: 12_000
		}
	);
	if (english) await page.getByRole('button', { name: 'EN', exact: true }).click();
}
async function begin(page: Page) {
	await page
		.getByRole('button', { name: /Personalize with a quick interview|ตอบสั้น ๆ เพื่อปรับมุมมอง/ })
		.click();
}
async function advance(page: Page, value: string | undefined, last = false) {
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('radio')).toHaveCount(4);
	await expect(
		dialog.getByRole('button', { name: /Apply my view|Use this view|ใช้มุมมองนี้/ })
	).toHaveCount(0);
	if (value) {
		await dialog.locator(`input[type=radio][value=${value}]`).check();
		await dialog
			.getByRole('button', { name: last ? /^(Finish interview|ตอบเสร็จแล้ว)$/ : /^(Next|ถัดไป)$/ })
			.click();
	} else {
		await dialog
			.getByRole('button', { name: /^(Skip — keep my current settings|ข้าม — ใช้การตั้งค่าปัจจุบัน)$/ })
			.click();
	}
}
async function complete(page: Page, values = ['compare', 'specs', 'durability', 'large']) {
	await begin(page);
	for (let index = 0; index < 4; index++) await advance(page, values[index], index === 3);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('.interview-receipt')).toBeVisible();
}
async function facts(root: Page | Locator) {
	return root.locator('.products [data-fact-key]').evaluateAll((nodes) => {
		// A missing photo can repeat the same sourced title beside the card heading.
		const facts = nodes.map((node) =>
			JSON.stringify({
				key: node.getAttribute('data-fact-key'),
				raw: node.getAttribute('data-raw'),
				text: node.textContent?.trim()
			})
		);
		return [...new Set(facts)].sort();
	});
}
async function noOverflow(page: Page) {
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true
	);
	if (await page.getByRole('dialog').count())
		expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
			true
		);
}

test('draft stays inert, finishing applies the answers once, and chat plus Undo preserve source facts', async ({
	page,
	context
}) => {
	await start(page);
	await expect(page.locator('.phone.marketplace')).toBeVisible();
	const original = await facts(page);
	expect(original.length).toBeGreaterThan(0);
	await context.setOffline(true);
	await begin(page);
	for (const answer of ['browse', 'photos', 'value']) {
		await advance(page, answer);
		await expect(page.locator('.phone.marketplace')).toBeVisible();
		await expect(page.locator('.interview-receipt')).toHaveCount(0);
		expect(await facts(page)).toEqual(original);
	}
	await advance(page, 'spacious', true);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('.phone')).toHaveClass(/standard/);
	await expect(page.locator('.products.grid')).toBeVisible();
	await page.getByText('How the interview adapted this shop', { exact: true }).click();
	await expect(page.getByText('Your answers set this view.', { exact: false })).toBeVisible();
	expect(await facts(page)).toEqual(original);
	await page
		.locator('.interview-receipt')
		.getByRole('button', { name: 'Chat to refine', exact: true })
		.click();
	const assistant = page.getByRole('dialog', { name: 'Your shopping companion', exact: true });
	await assistant.getByLabel('Your request', { exact: true }).fill('show as a list');
	await assistant.getByRole('button', { name: 'Send request', exact: true }).click();
	await expect(page.locator('.products.list')).toHaveCount(1);
	expect(await facts(page)).toEqual(original);
	await assistant.getByRole('button', { name: 'Undo last view change', exact: true }).click();
	await page.keyboard.press('Escape');
	await expect(page.locator('.products.grid')).toBeVisible();
	await page
		.locator('.interview-receipt')
		.getByRole('button', { name: 'Undo', exact: true })
		.click();
	await expect(page.locator('.phone.marketplace')).toBeVisible();
	await expect(page.locator('.interview-receipt')).toHaveCount(0);
	expect(await facts(page)).toEqual(original);
	await noOverflow(page);
});

test('settings start the interview, cancellation is inert, and skipping completes without inventing preferences', async ({
	page
}) => {
	await start(page);
	const original = await facts(page);
	await page.getByRole('button', { name: 'Reading preferences', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('radio')).toHaveCount(4);
	await expect(dialog.getByRole('combobox')).toHaveCount(0);
	await advance(page, 'compare');
	await page.keyboard.press('Escape');
	await expect(page.locator('.interview-receipt')).toHaveCount(0);
	await expect(page.locator('.phone.marketplace')).toBeVisible();
	expect(await facts(page)).toEqual(original);
	await complete(page, ['compare']);
	await expect(page.getByRole('table')).toBeVisible();
	await expect(page.locator('.phone')).toHaveClass(/standard/);
	await page.getByText('How the interview adapted this shop', { exact: true }).click();
	await expect(
		page.getByText('Skipped questions keep their current settings.', { exact: false })
	).toBeVisible();
	expect(await facts(page)).toEqual(original);
	await page.getByRole('button', { name: 'Reset view', exact: true }).click();
	await complete(page, []);
	await expect(page.locator('.interview-receipt')).toContainText(
		'Your current view already matches these answers.'
	);
	await expect(page.locator('.phone.marketplace')).toBeVisible();
});

test('a later completed interview replaces earlier reading preferences and creates one undo step', async ({
	page
}) => {
	await start(page);
	const original = await facts(page);
	await complete(page);
	await expect(page.locator('.phone')).toHaveClass(/large-print/);
	await expect(page.getByRole('table')).toBeVisible();
	await complete(page, ['browse', 'photos', 'value', 'spacious']);
	await expect(page.locator('.phone')).toHaveClass(/standard/);
	await expect(page.locator('.products.grid')).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.phone')).toHaveClass(/large-print/);
	await expect(page.getByRole('table')).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('.phone.marketplace')).toBeVisible();
	await expect(page.locator('.interview-receipt')).toHaveCount(0);
	expect(await facts(page)).toEqual(original);
});

test('Thai interview outcomes fit the phone in every theme without a manual theme picker', async ({
	page
}) => {
	await start(page, false);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const examples = [
		{ theme: 'standard', answers: ['compare'] },
		{ theme: 'minimal', answers: ['compare', 'specs', 'performance', 'compact'] },
		{ theme: 'vibrant', answers: ['browse', 'photos', 'value', 'spacious'] },
		{ theme: 'large-print', answers: ['shortlist', 'summary', 'durability', 'large'] }
	];
	for (const example of examples) {
		if (example.theme === 'minimal' || example.theme === 'vibrant') {
			await page.getByRole('button', { name: 'เปิดผู้ช่วย', exact: true }).click();
			const chat = page.getByRole('dialog', { name: 'ผู้ช่วยเลือกซื้อ' });
			await chat.getByLabel('ความต้องการของคุณ').fill(example.theme === 'minimal' ? 'มินิมอล' : 'สีสัน');
			await chat.getByRole('button', { name: 'ส่งคำขอ' }).click();
			await page.keyboard.press('Escape');
		}
		await complete(page, example.answers);
		await expect(page.locator('.phone')).toHaveClass(new RegExp(example.theme));
		await noOverflow(page);
		if (example.theme === 'large-print') {
			const sizes = await page.locator('.interview-receipt button').evaluateAll((nodes) =>
				nodes.map((n) => ({
					font: parseFloat(getComputedStyle(n).fontSize),
					height: n.getBoundingClientRect().height
				}))
			);
			expect(sizes.every((s) => s.font >= 20 && s.height >= 48)).toBe(true);
		}
		await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click();
	}
});

test('three examples demonstrate shopper-selected outcomes without selecting or changing the shopper view', async ({
	page,
	context
}, info) => {
	await page.goto('/?view=interviews');
	await expect(page.locator('.interview-comparison')).toBeVisible();
	await page.getByRole('button', { name: 'EN', exact: true }).click();
	const panes = page.locator('[data-example]');
	await expect(panes).toHaveCount(3);
	await expect(panes.nth(0).locator('.products.grid')).toBeVisible();
	await expect(panes.nth(1).getByRole('table')).toBeVisible();
	await expect(panes.nth(2).locator('.products.list')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Use this view', exact: true })).toHaveCount(0);
	await expect(page.getByText(/These examples do not change your shop/)).toBeVisible();
	const snapshots = await Promise.all((await panes.all()).map(facts));
	expect(snapshots[0]).toEqual(snapshots[1]);
	expect(snapshots[1]).toEqual(snapshots[2]);
	if (info.project.name === 'laptop') {
		const boxes = await panes.evaluateAll((items) =>
			items.map((n) => ({ x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y }))
		);
		expect(boxes[0].y).toBe(boxes[1].y);
		expect(boxes[0].x).toBeLessThan(boxes[1].x);
	}
	await context.setOffline(true);
	await panes.nth(0).getByText('Edit answers', { exact: true }).click();
	await panes.nth(0).getByLabel('What are you here to do?').selectOption('compare');
	await expect(panes.nth(0).getByRole('table')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Use this view', exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Back to my shop', exact: true }).click();
	await expect(page.locator('.phone.marketplace')).toBeVisible();
	await expect(page.locator('.interview-receipt')).toHaveCount(0);
	await noOverflow(page);
});

test('shows reviewed offline prices even with a conflicting saved browser catalog', async ({
	page
}) => {
	const first = { id: '58418206.41776476003', price: 475, name: { en: 'Breeze Matic detergent' } };
	await page.addInitScript((listing) => {
		localStorage.setItem(
			'dynamicshopper.catalog.v1',
			JSON.stringify({ items: [{ ...listing, price: 1 }] })
		);
	}, first);
	await page.route('**/api/catalog/**', (route) => route.abort());
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('7 products');
	await expect(page.locator('.catalog-status')).toContainText('Offline starter catalog');
	await expect(page.locator(`[data-fact-key="${first.id}:shopPrice"]`).first()).toHaveAttribute(
		'data-raw',
		String(first.price)
	);
	await page
		.locator('.products')
		.getByRole('button', { name: 'View product', exact: true })
		.first()
		.click();
	const title = page.getByRole('dialog').getByRole('heading', { name: first.name.en, exact: true });
	await expect(title).toHaveAttribute('data-fact-key', `${first.id}:name`);
	await expect(title).toHaveAttribute('data-raw', first.name.en);
});

test('uses validated same-origin listings while online and returns to starter facts offline', async ({
	page
}) => {
	const id = '1.1';
	const name = { en: 'Test listing', th: 'สินค้าทดสอบ' };
	const listing = {
		id,
		name,
		category: 'test',
		price: null,
		currency: 'THB',
		image: null,
		source: 'https://shopee.co.th/product/1/1',
		size: null
	};
	const response = {
		items: [listing],
		categories: [{ id: 'test', name, count: 1 }],
		snapshot: {
			id: 'fixture',
			source: 'https://shopee.co.th/',
			observedAt: null,
			importedAt: '2026-11-21',
			total: 1
		}
	};
	await page.route('**/api/catalog/snapshot', (route) => route.fulfill({ json: response }));
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('Catalog loaded');
	await expect(page.locator(`[data-fact-key="${id}:name"]`).first()).toHaveAttribute(
		'data-raw',
		name.en
	);
	await expect(page.locator(`[data-fact-key="${id}:shopPrice"]`)).toHaveCount(0);
	await page.unroute('**/api/catalog/snapshot');
	await page.route('**/api/catalog/snapshot', (route) => route.abort());
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('7 products');
	await expect(page.locator('.catalog-status')).toContainText('Offline starter catalog');
});

test('an unavailable original has a readable photo status on its card and open listing', async ({
	page
}) => {
	await page.route('**/api/catalog/**', (route) => route.abort());
	await page.route('**/*', (route) =>
		route.request().resourceType() === 'image' ? route.abort() : route.fallback()
	);
	await start(page);
	const first = page.locator('.products .picture').first();
	await expect(first).toContainText('Verified image unavailable');
	await first.click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('Verified image unavailable');
	await expect(dialog.locator('img')).toHaveCount(0);
	await expect(dialog.getByRole('heading', { name: 'Breeze Matic detergent' })).toBeVisible();
});

test('only a matching reviewed original can replace an unavailable catalog image', async ({
	page
}) => {
	const id = '58418206.41776476003';
	const name = { en: 'Fixture listing', th: 'รายการทดสอบ' };
	const listing = {
		id,
		name,
		category: 'test',
		price: null,
		currency: 'THB',
		image: `/api/catalog/images/${id}`,
		source: 'https://shopee.co.th/product/58418206/41776476003',
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81zto-mh6rw0c4qej18b',
		size: null
	};
	const response = {
		items: [listing],
		categories: [{ id: 'test', name, count: 1 }],
		snapshot: {
			id: 'fixture',
			source: 'https://shopee.co.th/',
			observedAt: null,
			importedAt: '2026-11-21',
			total: 1
		}
	};
	await page.route('**/api/catalog/snapshot', (route) => route.fulfill({ json: response }));
	await page.route('**/api/catalog/images/**', (route) => route.abort());
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('Catalog loaded');
	const picture = page.locator('.products .picture');
	await expect
		.poll(() => picture.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
		.toBeGreaterThan(0);
	// Losing the checked-in copy still leaves the validated same-listing API image.
	await page.route('**/*.jpg', (route) =>
		route.request().resourceType() === 'image' ? route.abort() : route.fallback()
	);
	const original = fileURLToPath(new URL('../src/lib/assets/shop/breeze.jpg', import.meta.url));
	await page.route('**/api/catalog/images/**', (route) =>
		route.fulfill({ path: original, contentType: 'image/jpeg' })
	);
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('Catalog loaded');
	await expect(picture.locator('img')).toHaveAttribute('src', listing.image);
	await expect
		.poll(() => picture.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
		.toBeGreaterThan(0);
	await page.route('**/api/catalog/images/**', (route) => route.abort());

	listing.imageSource = 'https://down-th.img.susercontent.com/file/changed-original';
	await start(page);
	await expect(page.locator('.catalog-status')).toContainText('Catalog loaded');
	await expect(picture).toContainText('Verified image unavailable');
	await expect(picture.locator('img')).toHaveCount(0);
});
