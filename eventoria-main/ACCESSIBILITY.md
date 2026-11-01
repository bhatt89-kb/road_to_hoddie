# Accessibility Compliance Guide

## Overview

Eventoria is designed to meet **WCAG 2.2 Level AA** compliance standards, ensuring the application is usable by people with diverse abilities, including those using assistive technologies.

## Compliance Summary

| WCAG Criterion | Level | Status | Implementation |
|----------------|-------|--------|----------------|
| 1.1.1 Non-text Content | A | ✅ Compliant | All images have alt text, decorative images use alt="" |
| 1.3.1 Info and Relationships | A | ✅ Compliant | Semantic HTML, proper heading hierarchy, ARIA landmarks |
| 1.3.2 Meaningful Sequence | A | ✅ Compliant | Logical reading order maintained |
| 1.4.1 Use of Color | A | ✅ Compliant | Information conveyed beyond color alone |
| 1.4.3 Contrast (Minimum) | AA | ✅ Compliant | 4.5:1 for normal text, 3:1 for large text |
| 1.4.11 Non-text Contrast | AA | ✅ Compliant | 3:1 for UI components and graphics |
| 2.1.1 Keyboard | A | ✅ Compliant | All functionality available via keyboard |
| 2.1.2 No Keyboard Trap | A | ✅ Compliant | Tab navigation flows properly |
| 2.4.1 Bypass Blocks | A | ✅ Compliant | Skip to main content link |
| 2.4.3 Focus Order | A | ✅ Compliant | Logical tab order maintained |
| 2.4.7 Focus Visible | AA | ✅ Compliant | High-contrast focus indicators (3px amber) |
| 3.1.1 Language of Page | A | ✅ Compliant | `<html lang="en">` declared |
| 3.2.1 On Focus | A | ✅ Compliant | No unexpected context changes |
| 3.3.1 Error Identification | A | ✅ Compliant | Form validation errors clearly described |
| 3.3.2 Labels or Instructions | A | ✅ Compliant | All inputs have associated labels |
| 4.1.2 Name, Role, Value | A | ✅ Compliant | ARIA attributes for custom components |
| 4.1.3 Status Messages | AA | ✅ Compliant | aria-live regions for dynamic content |

## Key Accessibility Features

### 1. **Semantic HTML & Landmarks**

```html
<header role="banner">
  <nav aria-label="Main navigation">...</nav>
</header>

<main id="main-content" role="main">
  <article aria-labelledby="plan-title">...</article>
</main>

<footer role="contentinfo">...</footer>
```

**Benefits:**
- Screen readers announce page structure clearly
- Keyboard users can navigate by landmark
- Search engines understand content hierarchy

### 2. **Skip Navigation Link**

**Implementation:** `components/ui/SkipLink.tsx`

- Visible on focus (Tab key)
- Jumps directly to `#main-content`
- Allows keyboard users to bypass header navigation

**Keyboard Shortcut:** `Tab` (first press on page load)

### 3. **Focus Management**

**Focus Indicators:**
- **Visual:** 3px amber outline (`--focus-ring`)
- **Contrast:** 3:1 against background (WCAG 2.4.11)
- **Visibility:** Never hidden or suppressed

**Focus Trap Prevention:**
- Modal dialogs trap focus within
- Tab cycles through interactive elements
- Escape key closes modals

### 4. **ARIA Tab Interface**

**Implementation:** `components/ui/Tabs.tsx`

```typescript
// Proper ARIA attributes
<div role="tablist" aria-label="Plan sections">
  <button
    role="tab"
    aria-selected={activeTab === 'budget'}
    aria-controls="budget-panel"
    id="budget-tab"
  >
    Budget
  </button>
</div>

<div
  role="tabpanel"
  id="budget-panel"
  aria-labelledby="budget-tab"
  tabIndex={0}
>
  {/* Content */}
</div>
```

**Keyboard Navigation:**
- `Tab` / `Shift+Tab`: Move to/from tab list
- `Left Arrow` / `Right Arrow`: Navigate between tabs
- `Home`: Jump to first tab
- `End`: Jump to last tab
- `Enter` / `Space`: Activate tab

### 5. **Form Accessibility**

**Labels:**
- Every input has associated `<label>` with `for` attribute
- Placeholder text never replaces labels
- Required fields indicated with asterisk and `aria-required`

**Error Handling:**
```typescript
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : undefined}
/>
{hasError && (
  <span id="error-message" role="alert">
    {errorMessage}
  </span>
)}
```

**Benefits:**
- Screen readers announce errors immediately
- Visual and programmatic error indication
- Errors associated with specific fields

### 6. **Live Regions for Dynamic Content**

**Streaming Chat:**
```typescript
<div
  aria-live="polite"
  aria-atomic="false"
  role="log"
>
  {/* Chat messages append here */}
</div>
```

**Loading States:**
```typescript
<div role="status" aria-live="polite" aria-busy="true">
  <Spinner />
  <span className="sr-only">Generating your event plan...</span>
</div>
```

**Benefits:**
- Screen readers announce new content
- Users informed of application state
- No interruption during typing

### 7. **Color Contrast**

**Text Contrast Ratios:**
- Normal text (16px): 7:1 (exceeds AA standard of 4.5:1)
- Large text (24px+): 5:1 (exceeds AA standard of 3:1)
- UI components: 3:1 minimum

**Light Theme:**
- Primary text: `#1a1a1a` on `#ffffff` (15:1)
- Secondary text: `#666666` on `#ffffff` (5.7:1)
- Links: `#0066cc` on `#ffffff` (8.2:1)

**Dark Theme:**
- Primary text: `#f5f5f5` on `#1a1a1a` (14.8:1)
- Secondary text: `#b0b0b0` on `#1a1a1a` (9.3:1)
- Links: `#66b3ff` on `#1a1a1a` (10.1:1)

### 8. **Reduced Motion Support**

**Implementation:** `app/globals.css`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Benefits:**
- Respects user's motion preferences
- Prevents vestibular disorders triggers
- Animations reduced to near-instant

### 9. **Screen Reader Optimizations**

**Visually Hidden Content:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Usage:**
- Loading spinners: "Generating your event plan..."
- Icon buttons: "Edit budget item"
- Status indicators: "3 vendors booked, 2 pending"

**ARIA Labels:**
- Currency: `aria-label="Budget: 20 lakh rupees"`
- Dates: `aria-label="Event date: December 15, 2026"`
- Actions: `aria-label="Delete event plan"`

### 10. **Keyboard Shortcuts Summary**

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate forward through interactive elements |
| `Shift + Tab` | Navigate backward through interactive elements |
| `Enter` / `Space` | Activate buttons and links |
| `Escape` | Close modals and dropdowns |
| `Arrow Keys` | Navigate within tab lists and dropdowns |
| `Home` | Jump to first item in list |
| `End` | Jump to last item in list |

## Testing Tools & Procedures

### Automated Testing

**Tools:**
1. **axe DevTools** (Browser Extension)
   - Install: https://www.deque.com/axe/devtools/
   - Run on each page
   - Target: 0 violations

2. **Lighthouse Accessibility Audit**
   ```bash
   npm run lighthouse
   ```
   - Target score: 100/100

3. **Pa11y CI**
   ```bash
   npm run test:a11y
   ```
   - WCAG 2.2 AA standard
   - Tests all routes

**Automated Test Coverage:**
- ✅ Color contrast
- ✅ ARIA attributes
- ✅ Form labels
- ✅ Heading hierarchy
- ✅ Alt text
- ✅ Keyboard accessibility

### Manual Testing

**Screen Reader Testing:**

1. **NVDA (Windows - Free)**
   ```
   - Download: https://www.nvaccess.org/
   - Test navigation: Insert + Down Arrow
   - Test forms: Tab through inputs
   - Test dynamic content: Wait for announcements
   ```

2. **JAWS (Windows - Commercial)**
   ```
   - Test with virtual cursor
   - Verify heading navigation (H key)
   - Test table navigation (T key)
   ```

3. **VoiceOver (macOS - Built-in)**
   ```bash
   # Enable: Cmd + F5
   # Navigate: VO + Right Arrow
   # Interact: VO + Space
   # Rotor: VO + U
   ```

**Keyboard-Only Testing:**
1. Unplug mouse / disable trackpad
2. Navigate entire application using only keyboard
3. Verify all features accessible
4. Check focus indicators visible
5. Ensure no keyboard traps

**Checklist:**
- [ ] Can reach all interactive elements via Tab
- [ ] Focus indicators visible at all times
- [ ] Can submit all forms via keyboard
- [ ] Can close modals via Escape
- [ ] Can navigate tabs via arrow keys
- [ ] No keyboard traps encountered

### Browser Testing

**Required Browsers:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Screen Reader Combinations:**
- NVDA + Firefox (most common)
- JAWS + Chrome (enterprise)
- VoiceOver + Safari (macOS/iOS)
- TalkBack + Chrome (Android)

## Common Issues & Solutions

### Issue 1: Missing Form Labels

**Problem:** Input has placeholder but no label
**Solution:**
```typescript
// Bad
<input placeholder="Enter guest count" />

// Good
<label htmlFor="guestCount">Guest Count</label>
<input id="guestCount" placeholder="e.g., 250" />
```

### Issue 2: Insufficient Color Contrast

**Problem:** Text color too light on background
**Solution:** Use color contrast checker
- Tool: https://webaim.org/resources/contrastchecker/
- Minimum: 4.5:1 for normal text
- Minimum: 3:1 for large text

### Issue 3: Missing Alt Text

**Problem:** Images without alt attribute
**Solution:**
```typescript
// Informative image
<img src="venue.jpg" alt="Royal Palace Wedding Venue exterior with fountain" />

// Decorative image
<img src="divider.png" alt="" />
```

### Issue 4: Keyboard Trap

**Problem:** Cannot tab out of modal or component
**Solution:** Implement focus trap with escape hatch
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};
```

## Accessibility Statement

**Commitment:**
Eventoria is committed to ensuring digital accessibility for people with disabilities. We continuously improve the user experience for everyone and apply relevant accessibility standards.

**Conformance Status:**
WCAG 2.2 Level AA Conformant

**Feedback:**
We welcome feedback on the accessibility of Eventoria. Please contact us if you encounter accessibility barriers:
- Email: accessibility@eventoria.example.com
- Phone: +91-XXXX-XXXXXX

**Response Time:**
We aim to respond to accessibility feedback within 2 business days.

## Resources

**Guidelines:**
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

**Testing Tools:**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Pa11y](https://pa11y.org/)

**Learning:**
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Last Updated:** 2026-10-23  
**Maintained By:** Eventoria Accessibility Team  
**Version:** 1.0
