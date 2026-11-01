declare module 'jest-axe' {
  import { type AxeResults } from 'axe-core';

  export interface JestAxeConfigureOptions {
    rules?: Record<string, { enabled: boolean }>;
    globalOptions?: {
      [key: string]: unknown;
    };
  }

  export function axe(
    html: Element | Document | string,
    options?: JestAxeConfigureOptions
  ): Promise<AxeResults>;

  export function configureAxe(options: JestAxeConfigureOptions): typeof axe;

  export function toHaveNoViolations(results: AxeResults): {
    message: () => string;
    pass: boolean;
  };
}

// Extend Vitest's Assertion interface to include toHaveNoViolations
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): any;
  }
}
