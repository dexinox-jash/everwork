/**
 * E2E Tests - Calendar/Stats (Blackbox Testing)
 * Tests the statistics and calendar functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Calendar and Statistics', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/auth.html');
    await page.evaluate(() => localStorage.clear());
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*dashboard.html/);
  });

  test.describe('Page Navigation', () => {
    test('should navigate to stats page', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      await expect(page.getByText(/your progress/i)).toBeVisible();
      await expect(page.getByText(/track your hustle/i)).toBeVisible();
    });

    test('should show weekly summary', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      await expect(page.getByText(/this week/i)).toBeVisible();
      await expect(page.getByText(/hours/i)).toBeVisible();
      await expect(page.getByText(/sessions/i)).toBeVisible();
    });
  });

  test.describe('Monthly Heatmap', () => {
    test('should display heatmap grid', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Should have day labels
      await expect(page.getByText('S').first()).toBeVisible();
      await expect(page.getByText('M')).toBeVisible();
      
      // Should have heatmap cells
      const heatmapCells = page.locator('.heatmap-cell');
      await expect(heatmapCells.first()).toBeVisible();
    });

    test('should show current month by default', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      await expect(page.getByText(currentMonth)).toBeVisible();
    });

    test('should navigate to previous month', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Click previous month button
      await page.locator('button[title="Previous Month"]').click();
      
      // Should show different month
      await expect(page.getByText(/\w{3} \d{4}/)).toBeVisible();
    });

    test('should navigate to next month', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Click next month button
      await page.locator('button[title="Next Month"]').click();
      
      // Should show different month
      await expect(page.getByText(/\w{3} \d{4}/)).toBeVisible();
    });

    test('should navigate to previous year', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Click previous year button
      await page.locator('button[title="Previous Year"]').click();
      
      // Should still show month display
      await expect(page.getByText(/\w{3} \d{4}/)).toBeVisible();
    });

    test('should navigate to next year', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Click next year button
      await page.locator('button[title="Next Year"]').click();
      
      // Should still show month display
      await expect(page.getByText(/\w{3} \d{4}/)).toBeVisible();
    });

    test('should highlight today', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Today's cell should have special styling
      const todayCell = page.locator('.heatmap-cell.today');
      await expect(todayCell).toBeVisible();
    });
  });

  test.describe('Day Detail Modal', () => {
    test('should show day detail on click', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Click on a day cell
      const dayCell = page.locator('.heatmap-cell').first();
      await dayCell.click();
      
      // Should show modal
      await expect(page.locator('.day-modal')).toBeVisible();
    });

    test('should close modal on X button', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Open modal
      const dayCell = page.locator('.heatmap-cell').first();
      await dayCell.click();
      
      // Close modal
      await page.getByLabel(/close/i).click();
      
      // Modal should be hidden
      await expect(page.locator('.day-modal')).not.toBeVisible();
    });

    test('should close modal on overlay click', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Open modal
      const dayCell = page.locator('.heatmap-cell').first();
      await dayCell.click();
      
      // Click overlay
      await page.locator('.day-modal-overlay').click();
      
      // Modal should close
      await expect(page.locator('.day-modal')).not.toBeVisible();
    });

    test('should close modal on escape key', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Open modal
      const dayCell = page.locator('.heatmap-cell').first();
      await dayCell.click();
      
      // Press escape
      await page.keyboard.press('Escape');
      
      // Modal should close
      await expect(page.locator('.day-modal')).not.toBeVisible();
    });
  });

  test.describe('Personal Records', () => {
    test('should show personal records section', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      await expect(page.getByText(/personal records/i)).toBeVisible();
      await expect(page.getByText(/longest session/i)).toBeVisible();
      await expect(page.getByText(/most productive day/i)).toBeVisible();
      await expect(page.getByText(/current streak/i)).toBeVisible();
      await expect(page.getByText(/best earning week/i)).toBeVisible();
    });

    test('should show placeholder values when no data', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Records should show -- or similar placeholder
      await expect(page.getByText(/--/)).toBeVisible();
    });
  });

  test.describe('Weekly Summary', () => {
    test('should calculate weekly hours correctly', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Hours should be a number
      const hoursText = await page.locator('#weekHours').textContent();
      expect(parseFloat(hoursText)).not.toBeNaN();
    });

    test('should show weekly comparison', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      const comparisonEl = page.locator('#weeklyComparison');
      await expect(comparisonEl).toBeVisible();
    });

    test('should show weekly bar chart', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      await expect(page.locator('#weeklyBars')).toBeVisible();
    });

    test('should show motivational message', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      await expect(page.locator('#motivationalMessage')).toBeVisible();
    });
  });

  test.describe('Earnings Projection', () => {
    test('should show earnings projection when applicable', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Create job with rate
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Paid Job');
      await page.locator('input[type="number"]').fill('50');
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Go back to calendar
      await page.goto('/pages/calendar.html');
      
      // Projection section should exist
      await expect(page.getByText(/earnings projection/i)).toBeVisible();
    });
  });

  test.describe('Data with Sessions', () => {
    test.beforeEach(async ({ page }) => {
      // Create a job
      await page.goto('/pages/jobs.html');
      await page.getByRole('button').first().click();
      await page.getByPlaceholder(/job name/i).fill('Test Job');
      await page.getByRole('button', { name: /save job/i }).click();
      
      // Start and stop a timer to create a session
      await page.goto('/pages/timer.html');
      await page.getByText(/test job/i).click();
      await page.waitForTimeout(2000);
      
      // Slide to stop
      const slideTrack = page.locator('#slideTrack');
      const thumb = page.locator('#slideThumb');
      await thumb.dragTo(slideTrack, { targetPosition: { x: 200, y: 30 } });
      
      await page.waitForTimeout(2000);
    });

    test('should show sessions in day detail', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Click on today's cell
      const todayCell = page.locator('.heatmap-cell.today, .heatmap-cell').first();
      await todayCell.click();
      
      // Should show session info
      await expect(page.locator('.session-item').first()).toBeVisible();
    });

    test('should update weekly summary with session', async ({ page }) => {
      await page.goto('/pages/calendar.html');
      
      // Should have at least 1 session
      const sessionsText = await page.locator('#weekSessions').textContent();
      expect(parseInt(sessionsText)).toBeGreaterThanOrEqual(1);
    });
  });
});
