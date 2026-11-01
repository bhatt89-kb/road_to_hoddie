import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// Extend Vitest's expect with the jest-axe accessibility matcher
expect.extend(toHaveNoViolations);

// jsdom does not implement scrollIntoView; stub it for components that call it
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}
