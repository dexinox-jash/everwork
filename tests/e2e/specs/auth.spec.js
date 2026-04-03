/**
 * E2E Tests - Authentication (Blackbox Testing)
 * Tests user-facing auth flows from the UI perspective
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.goto('/pages/auth.html');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Login Page', () => {
    test('should display login form by default', async ({ page }) => {
      await expect(page.getByPlaceholder('Email address')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText(/incorrect password|invalid credential/i)).toBeVisible();
    });

    test('should toggle between login and signup', async ({ page }) => {
      // Initially shows login
      await expect(page.getByPlaceholder('Email address')).toBeVisible();
      
      // Click signup tab
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show signup form
      await expect(page.getByPlaceholder('Your name')).toBeVisible();
      await expect(page.getByPlaceholder('Create password')).toBeVisible();
      await expect(page.getByPlaceholder('Confirm password')).toBeVisible();
    });

    test('should validate password match on signup', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await page.getByPlaceholder('Your name').fill('Test User');
      await page.getByPlaceholder('Email address').fill('new@example.com');
      await page.getByPlaceholder('Create password').fill('password123');
      await page.getByPlaceholder('Confirm password').fill('differentpassword');
      
      await page.getByRole('button', { name: /create account/i }).click();
      
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should enable guest mode', async ({ page }) => {
      await page.getByRole('button', { name: /continue as guest/i }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.html/);
      
      // Verify guest mode is active
      const isGuest = await page.evaluate(() => 
        localStorage.getItem('everwork_guest_mode')
      );
      expect(isGuest).toBe('true');
    });

    test('should show Google sign-in button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should show forgot password link', async ({ page }) => {
      await expect(page.getByText(/forgot password/i)).toBeVisible();
    });

    test('should require email for password reset', async ({ page }) => {
      await page.getByText(/forgot password/i).click();
      
      // Should show error if no email entered
      await expect(page.getByText(/please enter your email/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/pages/dashboard.html');
      
      // Should redirect to auth
      await expect(page).toHaveURL(/.*auth.html/);
    });

    test('should allow guest users to access dashboard', async ({ page }) => {
      // Set guest mode
      await page.goto('/pages/auth.html');
      await page.evaluate(() => {
        localStorage.setItem('everwork_guest_mode', 'true');
      });
      
      await page.goto('/pages/dashboard.html');
      
      // Should stay on dashboard
      await expect(page).toHaveURL(/.*dashboard.html/);
    });
  });

  test.describe('Logout', () => {
    test('should sign out and redirect to auth', async ({ page }) => {
      // Login as guest first
      await page.goto('/pages/auth.html');
      await page.getByRole('button', { name: /continue as guest/i }).click();
      await expect(page).toHaveURL(/.*dashboard.html/);
      
      // Navigate to settings and logout
      await page.goto('/pages/settings.html');
      await page.getByText(/sign out/i).click();
      await page.getByRole('button', { name: /sign out/i }).click();
      
      // Should redirect to auth
      await expect(page).toHaveURL(/.*auth.html/);
      
      // Verify localStorage cleared
      const isGuest = await page.evaluate(() => 
        localStorage.getItem('everwork_guest_mode')
      );
      expect(isGuest).toBeNull();
    });
  });
});
