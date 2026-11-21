import { expect, test } from '@playwright/test';

for (const locale of ['en', 'th'] as const) {
	for (const skipLast of [false, true]) {
		test(`${locale}: interview ${skipLast ? 'skip' : 'answer'} completes automatically and Undo restores the shelf`, async ({
			page
		}) => {
			await page.setViewportSize({
				width: locale === 'th' ? 390 : 1440,
				height: locale === 'th' ? 844 : 900
			});
			await page.goto('/');
			if (locale === 'th') await page.getByRole('button', { name: 'ไทย', exact: true }).click();
			await page
				.getByRole('button', {
					name: locale === 'th' ? 'เริ่มตอบคำถามสั้น ๆ' : 'Start a quick interview',
					exact: true
				})
				.click();
			const dialog = page.getByRole('dialog');
			await dialog
				.getByRole('radio', { name: locale === 'th' ? 'เปรียบเทียบ' : 'Compare', exact: true })
				.check();
			await dialog
				.getByRole('button', { name: locale === 'th' ? 'ถัดไป' : 'Next', exact: true })
				.click();
			await expect(page.locator('.store')).toHaveClass(/event-demo/);
			for (let i = 0; i < 2; i++) await dialog.getByRole('button', { name: /Skip|ข้าม/ }).click();
			if (skipLast) await dialog.getByRole('button', { name: /Skip|ข้าม/ }).click();
			else {
				await dialog.getByRole('radio').first().check();
				await dialog.getByRole('button', { name: /Finish|เสร็จ/ }).click();
			}
			await expect(dialog).toHaveCount(0);
			await expect(
				page.getByRole('region', {
					name: locale === 'th' ? 'ตารางสินค้า' : 'Product table',
					exact: true
				})
			).toBeVisible();
			await page
				.getByRole('button', { name: locale === 'th' ? 'ย้อนกลับ' : 'Undo', exact: true })
				.click();
			await expect(page.locator('.store')).toHaveClass(/event-demo/);
		});
	}
}
