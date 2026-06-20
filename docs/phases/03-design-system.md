# Phase 3 — Design System

## Goal
Build the reusable component library that every later phase will compose from. This is the
single biggest lever for avoiding a "generic admin template" look — invest real design effort
here, per `.claude/rules/design-system.md`.

## Build
Button, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Badge, Dialog, Drawer, Dropdown,
Tooltip, Tabs, Pagination, Table, Toast, Skeleton, EmptyState, ErrorState.

## Requirements
- RTL and LTR correct
- Dark mode (first-class, not auto-inverted)
- Accessible (keyboard, focus, screen reader)
- Fully typed (TypeScript)

## Definition of done
- Every component works correctly mirrored in RTL without per-usage overrides.
- Every component has a visibly designed dark mode.
- EmptyState and ErrorState are genuinely reusable (configurable message + action), not
  one-off implementations duplicated per feature.
