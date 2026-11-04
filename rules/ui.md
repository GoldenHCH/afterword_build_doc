# UI/UX Patterns

Global classes and component selectors use the `aw-` prefix (Afterword). Keep it consistent.

## Loading States

- `[UI-01]` Use global `LoadingService` for page/data loading
- `[UI-02]` Use inline spinners for button actions (spinner only, no text while loading)
- `[UI-03]` Minimum loading time for iframes: 2 seconds

## Global Card Styles (`styles.scss`)

Use the global `aw-card` classes for consistent clickable card lists:

```html
<div class="aw-card-grid">
  <mat-card class="aw-card aw-card--clickable" appearance="outlined" routerLink="/path">
    <mat-card-content>
      <div class="aw-card-header">
        <div class="aw-card-icon">
          <mat-icon>icon_name</mat-icon>
        </div>
        <div class="aw-card-content">
          <h4>Card Title</h4>
          <p>Card description text</p>
        </div>
        <mat-icon class="aw-card-arrow">chevron_right</mat-icon>
      </div>
    </mat-card-content>
  </mat-card>
</div>
```

Note: Always use `appearance="outlined"` on mat-card for flat white cards with borders (the global `.aw-card` class sets the border and removes the shadow).

Classes:
- `.aw-card` - Base card with a `--aw-theme--ruling` hairline border, 12px radius, white background, no shadow
- `.aw-card--clickable` - Adds a hover effect: the border turns ink (`--aw-theme--primary`). No shadow, no movement — the design is flat
- `.aw-card-header` - Flexbox row layout with centered items
- `.aw-card-icon` - 48x48 circular icon container with primary background and white icon
- `.aw-card-content` - Flex content area with h4 title and p description
- `.aw-card-arrow` - Chevron arrow (gray, 24px)
- `.aw-card-grid` - Container with flex column, 12px gap, max-width `--aw-column` (720px). Use it on a `<ul>`/`<ol>` with each card in an `<li>`; list styles are reset

## Global Page Header Styles (`styles.scss`)

Use the global `aw-page-header` classes for page headers with actions:

```html
<div class="aw-page-header">
  <div class="aw-page-header-left">
    <h1 class="aw-page-title">Page Title</h1>
    <p class="aw-page-subtitle">Page description or subtitle</p>
  </div>
  <button mat-flat-button class="aw-page-action">
    <mat-icon>add</mat-icon>
    <span>Action</span>
  </button>
</div>
```

Classes:
- `.aw-page-header` - Flexbox row with space-between, 24px bottom margin
- `.aw-page-header-left` - Flex container for title/subtitle
- `.aw-page-title` - Serif title (Source Serif 4, 600 weight), no margins
- `.aw-page-subtitle` - Gray subtitle text
- `.aw-page-action` - Button container with icon styling

## Empty States, Kickers and Tags (`styles.scss`)

- `[UI-16]` One primary action per screen: the `mat-flat-button` in the screen toolbar (Describe, Build) or the single CTA of an empty state. Per-card actions are `mat-button` (Resolve, Remove) or `mat-stroked-button` (Save); never a second flat button.
- `[UI-17]` Empty states use `.aw-empty` (hairlines above and below, no dashed box) with `.aw-kicker` (small caps label), `.aw-empty-title` (serif), `.aw-empty-text`, and optionally `.aw-empty-example` (an example of what to tell the assistant) and `.aw-empty-action`. Do not repeat the toolbar's primary button inside the empty state.
- `[UI-18]` Loading shows `aw-skeleton-list` in place of the content, plus the global progress bar.
- Keywords are `.aw-tags` / `.aw-tag` (small recessed labels), not Material chips. Material chips are for filters only.

## Shared Components (`app/src/app/shared/`, barrel `shared/index.ts`)

- `aw-alert-banner` (`AlertBannerComponent`): inputs `message`, `kind: 'error' | 'info' = 'error'`; output `dismissed` (the X shows only when something listens).
- `aw-screen-toolbar` (`ScreenToolbarComponent`): inputs `title`, `subtitle?`, `backLink?`; `<ng-content>` for right-side actions.
- `aw-side-panel` (`SidePanelComponent`): inputs `open`, `title`, `closable = true`; output `closed`.
- `aw-kind-label` (`KindLabelComponent`): input `kind: Afterword.Firestore.Note.NoteKind`.
- `aw-skeleton-list` (`SkeletonListComponent`): inputs `count = 3`, `label` (announced to screen readers).
- `LoadingService`: `show()`, `hide()`, `isLoading$`; the shell shows a thin progress bar under the top bar.
- `formatShortDate(timestamp)` in `shared/helpers/date.helper.ts`.

## Look

- Flat: no shadows, no gradients, no sparkle or robot iconography, no "AI-powered" copy.
- The red rule (`--aw-theme--accent`, 3px) appears once per page as the top rule; elsewhere red means an error.
- Ink left rules (3px) mark the product's own voice: the briefing's "Why this" block and example prompts. The reading-order note is serif italic in ink, above the title.
- The logo mark is an ink rounded square with three white lines of falling length (a reading list), in the shell, on sign-in and as `public/favicon.svg`.
- Links are underlined; ink (`--aw-theme--primary`) is the only interactive color.
- Headings in Source Serif 4 (600), body in the system font stack.

## Forms

- `[UI-04]` Max width `600px` for form containers on large screens
- `[UI-05]` Use `mat-hint` for field guidance
- `[UI-06]` Show validation errors inline with `mat-error`

## Side Panels / Bottom Sheets

- `[UI-07]` Use `SidePanelComponent` instead of dialogs for contextual content
- `[UI-08]` **Default behavior**: Bottom sheet (slides from bottom) — works on all screen sizes
- `[UI-09]` On desktop (>768px): Slides from right side
- `[UI-10]` On mobile (≤768px): Slides from bottom as a bottom sheet
- `[UI-11]` Max height on mobile: 85vh with border-radius on top corners

### Async Submit Pattern (form side panels)

- `[UI-12]` **Child owns the async call.** The component containing the form is responsible for calling the service and must only emit `closed` on success — never before. The parent reloads data in response to the success event; it does not do the async work itself.

- `[UI-13]` **Submit button state during save.** While saving: show a `<mat-spinner diameter="20">` in place of the button label, disable the button with `[disabled]="form.invalid || isSubmitting"`, and disable Cancel with `[disabled]="isSubmitting"`. Pass `[closable]="!isSubmitting"` to `SidePanelComponent` to prevent backdrop/X dismissal mid-save.

  ```html
  <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isSubmitting">
    @if (isSubmitting) {
      <mat-spinner diameter="20"></mat-spinner>
    } @else {
      {{ submitLabel }}
    }
  </button>
  <button mat-button type="button" [disabled]="isSubmitting" (click)="onClose()">Cancel</button>
  ```

- `[UI-14]` **Inline error on failure.** On submit error, set a `saveError` string and display it with `<aw-alert-banner>` inside the panel (above the action buttons). Do not close the panel. Clear it on the next submit attempt or on close.

  ```html
  @if (saveError) {
    <aw-alert-banner [message]="saveError" (dismissed)="saveError = ''"></aw-alert-banner>
  }
  ```

- `[UI-15]` **isSubmitting flag pattern.** Use a boolean flag (`isSubmitting = false`) on the component. Set it to `true` before the async call and reset it in `finally`.

  ```typescript
  public async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting) { return; }
    this.isSubmitting = true;
    try {
      await this._service.doWork(...);
      this.closed.emit();
    } catch {
      this.saveError = 'Failed to save. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
  ```
