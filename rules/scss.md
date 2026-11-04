# SCSS & Styling Rules

## SCSS Conventions

- `[SCSS-01]` Use component-scoped styles
- `[SCSS-02]` Do NOT style native HTML elements directly (p, h1, div, etc.) — use classes instead
- `[SCSS-03]` Mobile breakpoint: `max-width: 599.98px`
- `[SCSS-04]` Tablet breakpoint: `max-width: 959.98px`
- `[SCSS-05]` Use flexbox and grid for layouts
- `[SCSS-06]` Standard border-radius: `12px` for cards, `8px` for smaller elements

## CSS Theme Variables

Use CSS variables defined in `app/src/styles.scss` for consistent theming. They mirror the design language of the briefing email (`functions/src/brief/email.constants.ts`, `emailTheme`).

```scss
var(--aw-theme--primary, #1c3a8e)        // Ink: the only interactive color (buttons, links, active nav)
var(--aw-theme--primary-hover, #142c6e)  // Ink, hovered or pressed
var(--aw-theme--accent, #c4343f)         // Rule-red: one 3px top rule per page; otherwise errors only
var(--aw-theme--error, #a12a33)          // Error text and icons
var(--aw-theme--error-bg, #fbeeef)       // Error background
var(--aw-theme--surface, #f1f3f6)        // Recessed surface
var(--aw-theme--border, #6a7c96)         // Control borders (inputs, stroked buttons)
var(--aw-theme--ruling, #c7d5ea)         // Hairlines and card borders
var(--aw-theme--text, #1a1f27)           // Body text
var(--aw-theme--text-muted, #556070)     // Secondary text
var(--aw-theme--pill, #e8ebef)           // Pill background (kind labels, chips, active nav)
var(--aw-theme--on-pill, #3b4451)        // Text on a pill
```

Also defined: `--aw-theme--background` (`#fafbfc`, page), `--aw-font-heading` (Source Serif 4), `--aw-font-body` (system stack).
