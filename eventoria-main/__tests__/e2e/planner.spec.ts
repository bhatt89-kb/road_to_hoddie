/**
 * @file __tests__/e2e/planner.spec.ts
 * End-to-end tests for the event planner user journey
 */

import { test, expect } from '@playwright/test';

test.describe('Event Planner E2E Journey', () => {
  test('should complete full wedding planning workflow', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Verify landing page loaded
    await expect(page.locator('h1')).toContainText('Eventoria');
    
    // Click Start Planning button
    await page.click('text=Start Planning');
    
    // Should navigate to planner page
    await expect(page).toHaveURL(/.*planner/);
    
    // Fill out event form
    await page.selectOption('select[name="eventType"]', 'wedding');
    await page.fill('input[name="guestCount"]', '250');
    await page.fill('input[name="budget"]', '2000000');
    await page.fill('input[name="date"]', '2026-12-15');
    await page.fill('input[name="city"]', 'Mumbai');
    await page.fill('textarea[name="description"]', 'Traditional wedding ceremony');
    
    // Submit form
    await page.click('button:has-text("Generate Plan")');
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading')).toBeHidden({ timeout: 10000 });
    
    // Verify plan results are displayed
    await expect(page.locator('text=Budget Breakdown')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
    await expect(page.locator('text=Vendors')).toBeVisible();
    await expect(page.locator('text=Ideas')).toBeVisible();
  });

  test('should use preset plan for quick start', async ({ page }) => {
    await page.goto('/planner');
    
    // Click preset chip
    await page.click('text=Royal Palace Wedding');
    
    // Verify form is pre-filled
    await expect(page.locator('select[name="eventType"]')).toHaveValue('wedding');
    await expect(page.locator('input[name="guestCount"]')).toHaveValue('250');
    await expect(page.locator('input[name="city"]')).toHaveValue('Jaipur');
    
    // Generate plan
    await page.click('button:has-text("Generate Plan")');
    
    // Verify plan generated
    await expect(page.locator('text=Budget Breakdown')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/planner');
    
    // Generate a quick plan first
    await page.click('text=Royal Palace Wedding');
    await page.click('button:has-text("Generate Plan")');
    await expect(page.locator('text=Budget Breakdown')).toBeVisible({ timeout: 10000 });
    
    // Click Timeline tab
    await page.click('button[role="tab"]:has-text("Timeline")');
    await expect(page.locator('[role="tabpanel"]')).toContainText('days before');
    
    // Click Vendors tab
    await page.click('button[role="tab"]:has-text("Vendors")');
    await expect(page.locator('[role="tabpanel"]')).toContainText('checklist');
    
    // Click Ideas tab
    await page.click('button[role="tab"]:has-text("Ideas")');
    await expect(page.locator('[role="tabpanel"]')).toContainText('tier');
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/planner');
    
    // Try to submit without required fields
    await page.click('button:has-text("Generate Plan")');
    
    // Should show validation error
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should edit budget items', async ({ page }) => {
    await page.goto('/planner');
    
    // Generate plan
    await page.click('text=Royal Palace Wedding');
    await page.click('button:has-text("Generate Plan")');
    await expect(page.locator('text=Budget Breakdown')).toBeVisible({ timeout: 10000 });
    
    // Click edit on first budget item
    await page.click('button:has-text("Edit"):first');
    
    // Change amount
    const input = page.locator('input[type="number"]').first();
    await input.fill('500000');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Verify updated amount is displayed
    await expect(page.locator('text=₹5,00,000')).toBeVisible();
  });
});

test.describe('Accessibility E2E Tests', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/planner');
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Event type
    await page.keyboard.press('Tab'); // Guest count
    await page.keyboard.press('Tab'); // Budget
    
    // Verify focus is on budget input
    await expect(page.locator('input[name="budget"]')).toBeFocused();
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');
    
    // Tab to skip link
    await page.keyboard.press('Tab');
    
    // Verify skip link is visible
    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeVisible();
    
    // Click skip link
    await skipLink.click();
    
    // Focus should be on main content
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/planner');
    
    // Verify proper ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount(4); // At least some ARIA labels
    
    // Verify tab structure
    await expect(page.locator('[role="tablist"]')).toBeHidden(); // Hidden until plan generated
  });
});

test.describe('Performance E2E Tests', () => {
  test('should load homepage in < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should generate plan in < 10 seconds', async ({ page }) => {
    await page.goto('/planner');
    
    await page.click('text=Royal Palace Wedding');
    
    const startTime = Date.now();
    await page.click('button:has-text("Generate Plan")');
    await expect(page.locator('text=Budget Breakdown')).toBeVisible();
    const generateTime = Date.now() - startTime;
    
    expect(generateTime).toBeLessThan(10000);
  });
});

test.describe('Chat Interface E2E', () => {
  test('should open chat interface', async ({ page }) => {
    await page.goto('/chat');
    
    await expect(page.locator('h1')).toContainText('Celebration Advisor');
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    await page.goto('/chat');
    
    // Type a message
    await page.fill('textarea', 'What are typical wedding costs?');
    
    // Send message
    await page.click('button:has-text("Send")');
    
    // Wait for response
    await expect(page.locator('text=wedding costs')).toBeVisible({ timeout: 10000 });
  });

  test('should use starter prompts', async ({ page }) => {
    await page.goto('/chat');
    
    // Click a starter prompt chip
    await page.click('[data-starter-prompt]').first();
    
    // Message should be sent automatically
    await expect(page.locator('[role="log"]')).not.toBeEmpty({ timeout: 10000 });
  });
});
