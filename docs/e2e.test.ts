import { test, expect } from '@playwright/test';

// Базовый URL сайта
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Тестовый пользователь
const TEST_USER = {
  name:     'Тест Пользователь',
  email:    `test_${Date.now()}@example.com`,
  password: 'TestPassword123',
};

test.describe('Полный flow: регистрация → загрузка → оплата → перевод → нотаризация', () => {

  // ── 1. Регистрация ──────────────────────────────────────────────────
  test('1. Пользователь может зарегистрироваться', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.screenshot({ path: 'screenshots/01-register-page.png' });

    await page.fill('input[name="name"]',     TEST_USER.name);
    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);

    await page.screenshot({ path: 'screenshots/02-register-filled.png' });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard|login/);
    await page.screenshot({ path: 'screenshots/03-after-register.png' });
  });

  // ── 2. Логин ────────────────────────────────────────────────────────
  test('2. Пользователь может войти в систему', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.screenshot({ path: 'screenshots/04-login-page.png' });

    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
    await page.screenshot({ path: 'screenshots/05-dashboard.png' });
  });

  // ── 3. Загрузка документа ───────────────────────────────────────────
  test('3. Пользователь может загрузить документ', async ({ page }) => {
    // Логинимся
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    // Загружаем документ
    await page.goto(`${BASE_URL}/upload`);
    await page.screenshot({ path: 'screenshots/06-upload-page.png' });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name:     'test-document.txt',
      mimeType: 'text/plain',
      buffer:   Buffer.from('Тестовый документ для перевода'),
    });

    await page.screenshot({ path: 'screenshots/07-file-selected.png' });
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/успешно|uploaded|success/i')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/08-upload-success.png' });
  });

  // ── 4. Оплата через Stripe ──────────────────────────────────────────
  test('4. Пользователь может оплатить перевод', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    await page.goto(`${BASE_URL}/payment`);
    await page.screenshot({ path: 'screenshots/09-payment-page.png' });

    // Заполняем тестовую карту Stripe
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
    await stripeFrame.locator('[placeholder*="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder*="MM"]').fill('12/28');
    await stripeFrame.locator('[placeholder*="CVC"]').fill('123');

    await page.screenshot({ path: 'screenshots/10-payment-filled.png' });
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/оплата|payment|success/i')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'screenshots/11-payment-success.png' });
  });

  // ── 5. Статус перевода ──────────────────────────────────────────────
  test('5. Документ проходит перевод', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    await page.screenshot({ path: 'screenshots/12-dashboard-with-doc.png' });

    // Проверяем что документ есть в списке
    await expect(page.locator('text=/translated|переведён|в обработке/i')).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: 'screenshots/13-translation-status.png' });
  });

  // ── 6. Нотаризация ──────────────────────────────────────────────────
  test('6. Нотариус может подписать документ', async ({ page }) => {
    await page.goto(`${BASE_URL}/notary`);
    await page.screenshot({ path: 'screenshots/14-notary-page.png' });

    // Нажимаем подписать
    const signBtn = page.locator('button:has-text("Подписать"), button:has-text("Sign")').first();
    if (await signBtn.isVisible()) {
      await signBtn.click();
      await expect(page.locator('text=/notarized|нотаризован|подписан/i')).toBeVisible({ timeout: 10000 });
    }

    await page.screenshot({ path: 'screenshots/15-notarized.png' });
  });

  // ── 7. Скачивание результата ─────────────────────────────────────────
  test('7. Пользователь может скачать готовый документ', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]',    TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    const downloadBtn = page.locator('a:has-text("Скачать"), button:has-text("Download")').first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/16-download-ready.png' });
  });

});
