/**
 * Augments Vitest's `expect` with the jest-axe `toHaveNoViolations` matcher.
 *
 * This file must be a module (note the `export {}`) so `declare module 'vitest'`
 * *augments* Vitest's types instead of replacing them.
 */
import 'vitest';

declare module 'vitest' {
  // Type parameter and default must match Vitest's own declaration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export {};
