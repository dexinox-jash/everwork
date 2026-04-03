/**
 * E2E Tests - Timer Functionality (Blackbox Testing)
 * Tests the complete timer flow from user perspective
 */

const { test, expect } = require('@playwright/test');

test.describe('Timer Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Go to auth and login as guest
    await page.goto('/pages/auth.html');
    await page.evaluate(() => localStorage.clear());
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*dashboard.html/);
  });

  test.describe('Starting Timer', () => {
    test('should show job selection when starting timer', async ({ page }) => {
      // First, create a job
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click(); // Add job button
      
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Go to timer page
      await page.goto('/pages/timer.html');
      
      // Should show job list
      await expect(page.getByText(/test job/i)).toBeVisible();
    });

    test('should start timer when selecting job', async ({ page }) => {
      // Create job first
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Start timer
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Should show timer view
      await expect(page.getByText(/currently working/i)).toBeVisible();
      await expect(page.locator('#timerDisplay')).toBeVisible();
    });

    test('should persist timer when navigating away', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Navigate away
      await page.goto('/pages/dashboard.html');
      
      // Come back to timer
      await page.goto('/pages/timer.html');
      
      // Timer should still be running
      await expect(page.getByText(/currently working/i)).toBeVisible();
    });
  });

  test.describe('Timer Display', () => {
    test('should show correct time format', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Wait a moment for timer to start
      await page.waitForTimeout(1000);
      
      // Check timer format (HH:MM:SS)
      const timerText = await page.locator('#timerDisplay').textContent();
      expect(timerText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('should update timer every second', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Get initial time
      const initialTime = await page.locator('#timerDisplay').textContent();
      
      // Wait 2 seconds
      await page.waitForTimeout(2000);
      
      // Get new time
      const newTime = await page.locator('#timerDisplay').textContent();
      
      // Times should be different
      expect(newTime).not.toBe(initialTime);
    });
  });

  test.describe('Stopping Timer', () => {
    test('should stop timer with slide gesture', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Get slide track
      const slideTrack = page.locator('#slideTrack');
      const trackBox = await slideTrack.boundingBox();
      
      // Perform slide gesture (drag thumb to right)
      const thumb = page.locator('#slideThumb');
      await thumb.dragTo(slideTrack, {
        targetPosition: { x: trackBox.width - 60, y: trackBox.height / 2 }
      });
      
      // Wait for stop animation
      await page.waitForTimeout(1000);
      
      // Should show success or redirect
      await expect(page.getByText(/great work/i)).toBeVisible({ timeout: 5000 });
    });

    test('should save session on stop', async ({ page }) => {
      // Start and stop timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Wait a few seconds
      await page.waitForTimeout(3000);
      
      // Stop timer
      const slideTrack = page.locator('#slideTrack');
      const thumb = page.locator('#slideThumb');
      await thumb.dragTo(slideTrack, {
        targetPosition: { x: 200, y: 30 }
      });
      
      await page.waitForTimeout(2000);
      
      // Go to dashboard and check for session
      await page.goto('/pages/dashboard.html');
      
      // Should show today's session
      await expect(page.getByText(/test job/i)).toBeVisible();
    });
  });

  test.describe('Timer Notes', () => {
    test('should add note to timer', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Open note modal
      await page.getByLabel(/add note/i).click();
      
      // Add note
      await page.getByPlaceholder(/what are you working on/i).fill('Testing the timer');
      await page.getByRole('button', { name: /save/i }).click();
      
      // Should close modal
      await expect(page.getByPlaceholder(/what are you working on/i)).not.toBeVisible();
    });
  });

  test.describe('Timer Recovery', () => {
    test('should recover timer after page refresh', async ({ page }) => {
      // Start timer
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      
      // Wait a bit
      await page.waitForTimeout(2000);
      
      // Refresh page
      await page.reload();
      
      // Timer should still be running
      await expect(page.getByText(/currently working/i)).toBeVisible();
      
      // Timer should show elapsed time > 0
      const timerText = await page.locator('#timerDisplay').textContent();
      const [hours, minutes, seconds] = timerText.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      expect(totalSeconds).toBeGreaterThan(0);
    });

    test('should handle corrupted timer data gracefully', async ({ page }) => {
      // Set corrupted data
      await page.evaluate(() => {
        localStorage.setItem('activeTimer', 'invalid json');
      });
      
      await page.goto('/pages/timer.html');
      
      // Should not crash, should show job selector
      await expect(page.getByText(/select a job/i)).toBeVisible();
    });
  });

  test.describe('Earnings Display', () => {
    test('should show earnings when job has hourly rate', async ({ page }) => {
      // Create job with rate
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Paid Job');
      await page.locator('input[type="number"]').fill('50');
      await page.getByRole('button', { name: /save job/i }).click();
      
      await page.goto('/pages/timer.html');
      await page.getByText(/paid job/i).click();
      
      // Should show earnings
      await expect(page.getByText(/\$0\.00/)).toBeVisible();
      await expect(page.getByText(/earned/i)).toBeVisible();
    });
  });
});
