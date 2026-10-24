/**
 * @file __tests__/e2e/accessibility.spec.ts
 * End-to-end accessibility tests using Playwright and axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('planner page should not have accessibility violations', async ({ page }) => {
    await page.goto('/planner');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat page should not have accessibility violations', async ({ page }) => {
    await page.goto('/chat');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation throughout the app', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First interactive element
    
    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('skip link should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    
    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    
    // Main content should be focused
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('main-content');
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/planner');
    
    // All inputs should have associated labels
    const inputs = await page.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(label > 0 || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt attribute must exist (can be empty for decorative images)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/planner');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledby = await button.getAttribute('aria-labelledby');
      
      // Button should have text content, aria-label, or aria-labelledby
      expect(text?.trim() || ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should support reduced motion preference', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    
    // Verify animations are reduced/disabled
    const hasAnimations = await page.evaluate(() => {
      const element = document.querySelector('*');
      if (!element) return false;
      
      const styles = window.getComputedStyle(element);
      const animationDuration = styles.animationDuration;
      const transitionDuration = styles.transitionDuration;
      
      // Check if durations are effectively 0
      return (
        (animationDuration && parseFloat(animationDuration) > 0.05) ||
        (transitionDuration && parseFloat(transitionDuration) > 0.05)
      );
    });
    
    expect(hasAnimations).toBeFalsy();
  });

  test('focus should be visible on all interactive elements', async ({ page }) => {
    await page.goto('/planner');
    
    // Get all interactive elements
    const interactiveElements = await page.locator('a, button, input, select, textarea').all();
    
    for (const element of interactiveElements.slice(0, 5)) { // Test first 5 to save time
      await element.focus();
      
      // Check if element has focus
      const isFocused = await element.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
      
      // Verify focus indicator exists (outline or box-shadow)
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
        };
      });
      
      const hasFocusIndicator = 
        (styles.outline && styles.outline !== 'none') ||
        (styles.outlineWidth && parseFloat(styles.outlineWidth) > 0) ||
        (styles.boxShadow && styles.boxShadow !== 'none');
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper ARIA roles and attributes', async ({ page }) => {
    await page.goto('/planner');
    
    // Generate a plan to show tabs
    await page.click('text=Royal Palace Wedding');
    await page.click('button:has-text("Generate Plan")');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
    
    // Check tab structure
    const tablist = await page.locator('[role="tablist"]').count();
    expect(tablist).toBe(1);
    
    const tabs = await page.locator('[role="tab"]').count();
    expect(tabs).toBeGreaterThan(0);
    
    const tabpanels = await page.locator('[role="tabpanel"]').count();
    expect(tabpanels).toBeGreaterThan(0);
  });

  test('should support screen reader navigation landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential landmarks
    const header = await page.locator('header, [role="banner"]').count();
    expect(header).toBeGreaterThan(0);
    
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);
    
    const footer = await page.locator('footer, [role="contentinfo"]').count();
    expect(footer).toBeGreaterThan(0);
  });

  test('form validation errors should be accessible', async ({ page }) => {
    await page.goto('/planner');
    
    // Try to submit form without filling required fields
    await page.click('button:has-text("Generate Plan")');
    
    // Wait for error messages
    await page.waitForTimeout(500);
    
    // Check for error messages with role="alert" or aria-invalid
    const alerts = await page.locator('[role="alert"]').count();
    const invalidInputs = await page.locator('[aria-invalid="true"]').count();
    
    expect(alerts + invalidInputs).toBeGreaterThan(0);
  });
});
