/**
 * Keeps hospital-os on React 18 JSX types when the monorepo also installs @types/react@19 (patient-app).
 * Prefer pnpm overrides; this file is a safety net for duplicate ReactNode definitions.
 */
import type * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<unknown, unknown> {}
    interface ElementClass extends React.Component<unknown> {}
    interface ElementAttributesProperty {
      props: object;
    }
    interface ElementChildrenAttribute {
      children: object;
    }
  }
}

export {};
