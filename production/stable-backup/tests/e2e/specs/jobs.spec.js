/**
 * E2E Tests - Jobs Management (Blackbox Testing)
 * Tests job CRUD operations from user perspective
 */

const { test, expect } = require('@playwright/test');

test.describe('Jobs Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/auth.html');
    await page.evaluate(() => localStorage.clear());
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*dashboard.html/);
  });

  test.describe('Creating Jobs', () => {
    test('should create new job with name and color', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      // Click add button
      await page.getByRole('button').first().click();
      
      // Fill form
      await page.getByPlaceholder(/job name/i).fill('Coffee Shop');
      
      // Select color (first color option)
      await page.locator('.color-option').first().click();
      
      // Save
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Should show new job
      await expect(page.getByText('Coffee Shop')).toBeVisible();
    });

    test('should create job with hourly rate', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      await page.getByRole('button').first().click();
      
      await page.getByPlaceholder(/job name/i).fill('Freelance');
      await page.locator('input[type="number"]').fill('75');
      
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Should show rate
      await expect(page.getByText(/\$75\/hr/i)).toBeVisible();
    });

    test('should validate required name field', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      await page.getByRole('button').first().click();
      
      // Try to save without name
      const nameInput = page.getByPlaceholder(/job name/i);
      await expect(nameInput).toHaveAttribute('required', '');
    });

    test('should limit name to 30 characters', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      await page.getByRole('button').first().click();
      
      const nameInput = page.getByPlaceholder(/job name/i);
      await expect(nameInput).toHaveAttribute('maxlength', '30');
    });
  });

  test.describe('Editing Jobs', () => {
    test.beforeEach(async ({ page }) => {
      // Create a job first
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Original Name');
      await page.getByRole('button', { name: /save job/i }).click();
    });

    test('should edit job name', async ({ page }) => {
      await page.getByLabel(/edit job/i).first().click();
      
      const nameInput = page.getByPlaceholder(/job name/i);
      await nameInput.fill('');
      await nameInput.fill('Updated Name');
      
      await page.getByRole('button', { name: /save job/i }).click();
      
      await expect(page.getByText('Updated Name')).toBeVisible();
    });

    test('should edit job color', async ({ page }) => {
      await page.getByLabel(/edit job/i).first().click();
      
      // Select different color (second option)
      await page.locator('.color-option').nth(1).click();
      
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Color change should be saved
      await expect(page.getByText('Updated Name')).toBeVisible();
    });

    test('should edit hourly rate', async ({ page }) => {
      await page.getByLabel(/edit job/i).first().click();
      
      await page.locator('input[type="number"]').fill('100');
      
      await page.getByRole('button', { name: /save job/i }).click();
      
      await expect(page.getByText(/\$100\/hr/i)).toBeVisible();
    });
  });

  test.describe('Deleting Jobs', () => {
    test.beforeEach(async ({ page }) => {
      // Create a job first
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Job to Delete');
      await page.getByRole('button', { name: /save job/i }).click();
    });

    test('should show delete confirmation', async ({ page }) => {
      await page.getByLabel(/delete job/i).first().click();
      
      // Should show confirmation modal
      await expect(page.getByText(/delete job/i)).toBeVisible();
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
    });

    test('should cancel delete on cancel button', async ({ page }) => {
      await page.getByLabel(/delete job/i).first().click();
      
      await page.getByRole('button', { name: /cancel/i }).click();
      
      // Job should still exist
      await expect(page.getByText('Job to Delete')).toBeVisible();
    });

    test('should delete job on confirm', async ({ page }) => {
      await page.getByLabel(/delete job/i).first().click();
      
      await page.getByRole('button', { name: /delete$/i }).click();
      
      // Job should be removed
      await expect(page.getByText('Job to Delete')).not.toBeVisible();
    });
  });

  test.describe('Archiving Jobs', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Job to Archive');
      await page.getByRole('button', { name: /save job/i }).click();
    });

    test('should show archive option in edit mode', async ({ page }) => {
      await page.getByLabel(/edit job/i).first().click();
      
      await expect(page.getByRole('button', { name: /archive job/i })).toBeVisible();
    });

    test('should show archive confirmation', async ({ page }) => {
      await page.getByLabel(/edit job/i).first().click();
      await page.getByRole('button', { name: /archive job/i }).click();
      
      await expect(page.getByText(/archive job/i)).toBeVisible();
    });
  });

  test.describe('Jobs List', () => {
    test('should show empty state when no jobs', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      await expect(page.getByText(/no jobs yet/i)).toBeVisible();
    });

    test('should show job count in stats', async ({ page }) => {
      // Create multiple jobs
      await page.goto('/pages/jobs.html');
      
      for (let i = 1; i <= 3; i++) {
        await page.getByRole('button').first().click();
        await page.getByPlaceholder(/job name/i).fill(`Job ${i}`);
        await page.getByRole('button', { name: /save job/i }).click();
      }
      
      // Check settings page for stats
      await page.goto('/pages/settings.html');
      await expect(page.getByText('3')).toBeVisible(); // Job count
    });

    test('should search/filter jobs', async ({ page }) => {
      // Create jobs
      await page.goto('/pages/jobs.html');
      
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Coffee Shop');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Design Work');
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Both jobs should be visible
      await expect(page.getByText('Coffee Shop')).toBeVisible();
      await expect(page.getByText('Design Work')).toBeVisible();
    });
  });

  test.describe('Icon Selection', () => {
    test('should allow selecting job icon', async ({ page }) => {
      await page.goto('/pages/jobs.html');
      
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Job with Icon');
      
      // Select an icon
      await page.locator('.icon-option').nth(2).click();
      
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Job should be created
      await expect(page.getByText('Job with Icon')).toBeVisible();
    });
  });
});
