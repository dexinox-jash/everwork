/**
 * E2E Tests - Settings (Blackbox Testing)
 * Tests settings management functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Settings', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/auth.html');
    await page.evaluate(() => localStorage.clear());
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*dashboard.html/);
  });

  test.describe('Page Navigation', () => {
    test('should navigate to settings page', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/settings/i)).toBeVisible();
    });

    test('should show guest mode card for guests', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/guest mode/i)).toBeVisible();
      await expect(page.getByText(/sign in to sync/i)).toBeVisible();
    });
  });

  test.describe('Daily Goal Setting', () => {
    test('should show daily goal option', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/daily goal/i)).toBeVisible();
    });

    test('should open daily goal modal', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/daily goal/i).click();
      
      await expect(page.getByText(/hours per day/i)).toBeVisible();
      await expect(page.locator('input[type="number"]').first()).toBeVisible();
    });

    test('should validate goal range', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/daily goal/i).click();
      
      const goalInput = page.locator('input[type="number"]').first();
      await expect(goalInput).toHaveAttribute('min', '1');
      await expect(goalInput).toHaveAttribute('max', '24');
    });
  });

  test.describe('Currency Setting', () => {
    test('should show currency option', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/currency/i)).toBeVisible();
    });

    test('should open currency selection', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/currency/i).click();
      
      // Should show currency options
      await expect(page.getByText(/us dollar/i)).toBeVisible();
    });
  });

  test.describe('Data Export', () => {
    test('should show export option', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/export data/i)).toBeVisible();
    });

    test('should trigger download on export', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      // Wait for download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByText(/export data/i).click()
      ]);
      
      expect(download.suggestedFilename()).toMatch(/everwork-backup/);
    });
  });

  test.describe('Data Import', () => {
    test('should show import option', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/import data/i)).toBeVisible();
    });

    test('should open import modal', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/import data/i).click();
      
      await expect(page.getByText(/choose backup file/i)).toBeVisible();
    });

    test('should warn about data replacement', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/import data/i).click();
      
      await expect(page.getByText(/replace all your current data/i)).toBeVisible();
    });
  });

  test.describe('Clear Data', () => {
    test('should show clear data option', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/clear all data/i)).toBeVisible();
    });

    test('should show confirmation modal', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/clear all data/i).click();
      
      await expect(page.getByText(/delete everything/i)).toBeVisible();
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
    });

    test('should require DELETE confirmation', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByText(/clear all data/i).click();
      
      const confirmInput = page.getByPlaceholder(/type delete to confirm/i);
      await expect(confirmInput).toBeVisible();
    });
  });

  test.describe('Toggles', () => {
    test('should have notification toggle', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/notifications/i)).toBeVisible();
      await expect(page.locator('.toggle-switch').first()).toBeVisible();
    });

    test('should toggle dark mode', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/dark mode/i)).toBeVisible();
      
      const darkModeToggle = page.locator('#darkModeToggle');
      await expect(darkModeToggle).toHaveClass(/active/);
    });
  });

  test.describe('User Stats', () => {
    test.beforeEach(async ({ page }) => {
      // Create a job
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
    });

    test('should show user statistics', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      // Stats should be visible
      await expect(page.getByText(/hours/i).first()).toBeVisible();
      await expect(page.getByText(/sessions/i)).toBeVisible();
      await expect(page.getByText(/jobs/i).first()).toBeVisible();
    });

    test('should update stats after creating job', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      // Jobs count should be 1
      await expect(page.getByText('1').first()).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have back button to dashboard', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await page.getByRole('link', { name: /arrow-left/i }).click();
      
      await expect(page).toHaveURL(/.*dashboard.html/);
    });

    test('should have bottom navigation', async ({ page }) => {
      await page.goto('/pages/settings.html');
      
      await expect(page.getByText(/home/i)).toBeVisible();
      await expect(page.getByText(/timer/i)).toBeVisible();
      await expect(page.getByText(/jobs/i)).toBeVisible();
      await expect(page.getByText(/stats/i)).toBeVisible();
      await expect(page.getByText(/settings/i)).toBeVisible();
    });
  });
});
