import { expect, test } from '@playwright/test';

const languages = {
	en: {
		start: 'Start a quick interview',
		close: 'Close interview',
		first: 'What are you here to do?',
		compare: 'Compare',
		next: 'Next',
		skip: 'Skip — keep my current settings',
		review: 'Review your view',
		stage: 'Review',
		apply: 'Apply my view',
		chat: 'Refine this view in chat',
		input: 'Ask the store'
	},
	th: {
		start: 'เริ่มตอบคำถามสั้น ๆ',
		close: 'ปิดแบบสอบถาม',
		first: 'วันนี้อยากเลือกซื้อแบบไหน?',
		compare: 'เปรียบเทียบ',
		next: 'ถัดไป',
		skip: 'ข้าม — ใช้การตั้งค่าปัจจุบัน',
		review: 'ตรวจมุมมองที่เสนอ',
		stage: 'ทบทวน',
		apply: 'ใช้มุมมองนี้',
		chat: 'แชตปรับมุมมองต่อ',
		input: 'ถามหน้าร้าน'
	}
};

for (const viewport of [
	{ width: 390, height: 844 },
	{ width: 1440, height: 900 }
]) {
	for (const [locale, text] of Object.entries(languages)) {
		test(`keyboard interview and chat handoff in ${locale} at ${viewport.width}px`, async ({
			page,
			context
		}) => {
			await page.setViewportSize(viewport);
			await page.goto('/');
			const language = page.getByRole('button', { name: 'ไทย', exact: true });
			await expect(language).toBeEnabled();
			if (locale === 'th') await language.click();
			const start = page.getByRole('button', { name: text.start });
			await start.press('Enter');
			const dialog = page.getByRole('dialog');
			await expect(dialog.getByRole('heading', { name: text.first })).toBeFocused();
			await dialog.getByRole('button', { name: text.close, exact: true }).press('Enter');
			await expect(start).toBeFocused();
			await start.press('Enter');
			await context.setOffline(true);
			await page.keyboard.press('Tab');
			await expect(dialog.getByRole('radio').first()).toBeFocused();
			await page.keyboard.press('ArrowRight');
			await expect(dialog.getByRole('radio', { name: text.compare, exact: true })).toBeChecked();
			await dialog.getByRole('button', { name: text.next }).press('Enter');
			for (let remaining = 0; remaining < 3; remaining++)
				await dialog.getByRole('button', { name: text.skip }).press('Enter');
			await expect(dialog.getByRole('heading', { name: text.review })).toBeFocused();
			await expect(dialog.locator('[aria-current="step"]')).toHaveText(text.stage);
			await expect(dialog.getByRole('button', { name: text.apply })).toBeInViewport();
			await dialog.getByRole('button', { name: text.apply }).press('Enter');
			await expect(page.locator('#products')).toBeFocused();
			const chat = page.getByRole('button', { name: text.chat });
			await expect(chat).toBeInViewport({ ratio: 1 });
			const undo = page.getByRole('button', {
				name: locale === 'th' ? 'ย้อนกลับ' : 'Undo',
				exact: true
			});
			await expect(undo).toBeInViewport({ ratio: 1 });
			await chat.press('Enter');
			await expect(page.getByRole('textbox', { name: text.input })).toBeFocused();
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
		});
	}
}
