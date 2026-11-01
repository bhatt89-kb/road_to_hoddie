import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Setup jest-axe for accessibility tests
// @ts-ignore - jest-axe types are defined separately
import { toHaveNoViolations } from "jest-axe";
// @ts-ignore - expect is available in vitest context
import { expect } from "vitest";

// Extend Vitest's expect with jest-axe matchers
// @ts-ignore
expect.extend(toHaveNoViolations);
