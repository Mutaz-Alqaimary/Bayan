// Type augmentation so the `vitest-axe` matcher registered in `test/setup.ts`
// type-checks under `tsc` / `next build`. (`@testing-library/jest-dom/vitest`
// ships its own augmentation, imported in the setup file.)
import "vitest";

declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
