/**
 * Ambient type declarations for `jest-axe` (the package ships without types).
 * The matching Vitest matcher augmentation lives in `types/vitest-axe.d.ts`.
 */
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

  /** Matcher map to pass to `expect.extend()` */
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      message: () => string;
      pass: boolean;
    };
  };
}
