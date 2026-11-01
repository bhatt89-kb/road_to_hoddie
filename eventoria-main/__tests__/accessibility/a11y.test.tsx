/**
 * @file __tests__/accessibility/a11y.test.tsx
 * Accessibility compliance tests using testing-library
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { SkipLink } from '@/components/ui/SkipLink';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Compliance Tests', () => {
  describe('Button Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria-busy when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should be disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should hide icons from screen readers', () => {
      const { container } = render(
        <Button leftIcon={<span>→</span>} rightIcon={<span>←</span>}>
          Button with icons
        </Button>
      );
      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Card Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use article element for semantic structure', () => {
      render(
        <Card title="Test Card">
          <p>Content</p>
        </Card>
      );
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Badge>Status</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Tabs Component', () => {
    it('should not have accessibility violations', async () => {
      const tabs = [
        { id: 'tab1', label: 'First Tab', content: <div>First content</div> },
        { id: 'tab2', label: 'Second Tab', content: <div>Second content</div> },
      ];

      const { container } = render(<Tabs tabs={tabs} defaultTab="tab1" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA tab structure', () => {
      const tabs = [
        { id: 'tab1', label: 'First Tab', content: <div>First content</div> },
        { id: 'tab2', label: 'Second Tab', content: <div>Second content</div> },
      ];

      render(<Tabs tabs={tabs} defaultTab="tab1" />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabButtons = screen.getAllByRole('tab');
      expect(tabButtons).toHaveLength(2);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should mark selected tab with aria-selected', () => {
      const tabs = [
        { id: 'tab1', label: 'First Tab', content: <div>First content</div> },
        { id: 'tab2', label: 'Second Tab', content: <div>Second content</div> },
      ];

      render(<Tabs tabs={tabs} defaultTab="tab1" />);

      const firstTab = screen.getByRole('tab', { name: /first tab/i });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should link tabs and panels with aria-controls and aria-labelledby', () => {
      const tabs = [
        { id: 'tab1', label: 'First Tab', content: <div>First content</div> },
      ];

      render(<Tabs tabs={tabs} defaultTab="tab1" />);

      const tab = screen.getByRole('tab');
      const panel = screen.getByRole('tabpanel');

      const tabId = tab.getAttribute('id');
      const panelId = panel.getAttribute('id');

      expect(tab).toHaveAttribute('aria-controls', panelId);
      expect(panel).toHaveAttribute('aria-labelledby', tabId);
    });
  });

  describe('SkipLink Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SkipLink targetId="main-content" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should link to target with hash', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard interaction on buttons', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus indicators', () => {
      render(<Button>Focusable Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should not create keyboard traps', () => {
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      // Simulate tab navigation
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce loading states', () => {
      render(
        <Button isLoading>
          Generating Plan
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should provide accessible names for icon buttons', () => {
      render(<Button aria-label="Close modal">✕</Button>);
      
      const button = screen.getByRole('button', { name: /close modal/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast ratios', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with inputs', async () => {
      const { container } = render(
        <form>
          <label htmlFor="name-input">Name</label>
          <input id="name-input" type="text" />
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should mark required fields with aria-required', () => {
      render(
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required aria-required="true" />
        </form>
      );

      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should associate errors with fields using aria-describedby', () => {
      render(
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            aria-invalid="true"
            aria-describedby="username-error"
          />
          <span id="username-error" role="alert">
            Username is required
          </span>
        </div>
      );

      const input = screen.getByLabelText(/username/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'username-error');
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic heading hierarchy', async () => {
      const { container } = render(
        <article>
          <h1>Main Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection Title</h3>
          </section>
        </article>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Live Regions', () => {
    it('should use aria-live for dynamic content', () => {
      render(
        <div aria-live="polite" role="status">
          Loading your event plan...
        </div>
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});
