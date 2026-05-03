# Design System — Boolean Query Builder

## Context

`docs/prd.md` describes a feature-rich Boolean Query Builder. The current implementation in `src/components/feat/bsb/index.tsx` is a single-component prototype — the visual primitives (Chip, AutoComplete, FilterLane, LocationPicker, ToggleGroup, AndConnector, ResultsBar, TemplateCard) are inlined in one file and the design tokens live as CSS custom properties on `.root` in `bsb.module.css`.

To build the PRD's full surface area (subcategory picker, search groups, nested skill blocks, range slider, noise filter strip, syntax-highlighted boolean text editor, conflict banners, templates, platform selector, etc.) we need a documented design system in `design/ui.pen` so visual decisions are made once, reused everywhere, and stay in sync with the CSS tokens.

This doc enumerates every design-system primitive, composite, and pattern derived from PRD §5 (Functional requirements), §7 (Data model & grammar), §8 (Conflict detection), §9 (Edge cases), and §11 (Rollout) — and specifies how to add them to `design/ui.pen`. **Goal:** an exhaustive component inventory plus a concrete authoring sequence inside the `.pen` file. **Out of scope:** screen-level compositions (those come after primitives are in place).

---

## Pencil bridge note

`mcp__pencil__*` tools require the Pencil desktop app to be running with `design/ui.pen` open. Before any `batch_design` write, run Step 0 (inventory read) — if it surfaces components that already exist in the .pen, those rows in the table below get downgraded from **Add** → **Update/keep**.

---

## Component inventory

Legend for **State** column:
- **Reuse** — visual already present in `bsb.module.css` (and likely in `.pen`); keep tokens, formalize as `reusable` component in .pen.
- **Extend** — partial implementation exists, needs new variants or states.
- **Add** — net-new component.

### A. Foundations (tokens / variables)

Register the existing `--bsb-*` token set from `src/components/feat/bsb/bsb.module.css:1–112` as Pencil variables via `set_variables`. Group into themes if a light variant is in scope (default: dark only, matching current).

| Token group | Variables | State | PRD ref |
| --- | --- | --- | --- |
| Color — surfaces | `bg-primary`, `bg-surface`, `bg-surface-hover`, `bg-surface-active`, `bg-input`, `bg-dropdown`, `bg-overlay` | Reuse | §6.3 contrast ≥ 4.5:1 |
| Color — text | `text-primary`, `text-heading`, `text-muted`, `text-label`, `text-dim`, `text-accent`, `text-action` | Reuse | §6.3 |
| Color — accent | `accent-blue`, `accent-indigo`, `accent-purple`, `accent-violet`, `accent-blue-light/mid`, `accent-green`, `accent-red`, `accent-red-dark` | Reuse | — |
| Color — borders | `border-default/subtle/medium/strong/hover/focus/active` | Reuse | — |
| Color — semantic (NEW) | `severity-info`, `severity-warning`, `severity-error`, `severity-success` | Add | §8 conflict severities (yellow/red), §5.9 validation |
| Color — subcategory (NEW) | `cat-language`, `cat-framework`, `cat-database`, `cat-cloud`, `cat-devops`, `cat-misc` | Add | §4.1, §5.1 — chip subcategory badge needs visual distinction |
| Color — platform (NEW) | `platform-linkedin`, `platform-naukri`, `platform-xray`, `platform-generic` | Add | §5.10 platform selector |
| Spacing | `space-xs/sm/md/lg/xl/2xl/3xl` | Reuse | — |
| Radii | `radius-sm/md/lg/xl` | Reuse | — |
| Font family | `font-sans` (DM Sans), `font-mono` (JetBrains Mono) | Reuse | — |
| Font size | `font-3xs/2xs/xs/sm/md/lg/xl/2xl` | Reuse | — |
| Shadow | `shadow-dropdown`, `shadow-modal` (NEW) | Extend | §5.13 dialogs |
| Transition | `transition-fast/default/slow` | Reuse | §6.3 prefers-reduced-motion |
| Layout | `max-width` (68rem) | Reuse | — |

### B. Atomic primitives

| # | Component | Variants / props | State | PRD ref |
| --- | --- | --- | --- | --- |
| B1 | **Button** | primary, secondary, ghost, destructive, icon-only; sizes sm/md; with leading/trailing icon; disabled; loading | Extend (search/clear exist) | §5.9 Copy button states (blocked on red), §5.13 Clear all |
| B2 | **IconButton** | ghost, subtle; sizes sm/md | Reuse (chip remove/exclude buttons) | §5.1 chip controls |
| B3 | **Input — Text** | default, with leading icon, with clear button; states: default/hover/focus/error/disabled | Extend (autocomplete input exists) | §5.1 search, §5.5 custom range, §5.9 text editor |
| B4 | **Chip** | default; excluded (NOT, strikethrough, red); custom (italic or dotted border); legacy (faded, "legacy" badge); with subcategory badge; with NOT toggle button; removable | Extend (default + excluded exist; need custom/legacy/badge variants) | §4.4 legacy, §5.1 subcategory badge, §5.13 custom entry |
| B5 | **Badge** | subcategory (color-coded per cat-* token), count (numeric), legacy, status (info/warn/error) | Add | §5.1 subcategory badge on chips |
| B6 | **Toggle (binary)** | ANY/ALL switch; Off/On; with label | Reuse (matchModeBtn) | §5.1, §5.2 within-lane match toggle |
| B7 | **SegmentedControl / ToggleGroup** | 2–4 options; multi-select variant; with check-mark | Reuse (toggleBtn) | §5.4 contributor type, §5.5 experience presets |
| B8 | **Checkbox** | default, indeterminate, disabled; with label | Add | §5.6 "Apply to all my queries by default", §5.7 per-group noise override |
| B9 | **Radio / Radio Group** | with label | Add (or substitute Tabs) | §5.10 platform — tabs likely better |
| B10 | **Range Slider (dual handle)** | min/max handles, 0–40, step 1, value labels, ARIA arrow-key support | Add | §5.5 experience slider |
| B11 | **Range Chip Input** | accepts `N-M`, `N+`, `<N`, `N`; normalizes; removable | Add | §5.5 custom range chip |
| B12 | **Tabs / Tab Bar** | horizontal; sticky variant; with active indicator; with platform-color underline | Add | §5.10 platform selector |
| B13 | **Dropdown Menu** | surface; with search input; with grouped sections; with select-all row | Extend (autocomplete dropdown + locationDropdown exist; need grouped/searchable composite) | §5.1, §5.3 |
| B14 | **Tooltip** | top/bottom/left/right; with arrow; max-width | Add | §6.3 keyboard hints |
| B15 | **Popover** | top/bottom; dismissible; with action footer | Add | §5.9 "Did you mean" suggestions |
| B16 | **Toast / Snackbar** | success ("Copied!"), info, warning, error; auto-dismiss; with action | Add | §5.9 copy confirmation |
| B17 | **Progress / Length Indicator** | linear bar, percentage; thresholds at 600/700 chars (warn/danger) | Add | §9 string length warning (LinkedIn ~700) |
| B18 | **Spinner** | sm/md sizes | Add (low priority — app is fully client-side) | §6.1 perf — no real network states |
| B19 | **Divider** | horizontal, vertical; subtle/strong; with label slot (used by AndConnector) | Reuse (andConnector) | — |
| B20 | **Kbd (keyboard hint)** | single key, key combo (`Cmd + Enter`) | Add | §5.13 keyboard shortcuts table |
| B21 | **Avatar / OwnerBadge** | initials only, sm/md | Add (low priority) | §5.11 template owner |

### C. Composite components

| # | Component | Composition | State | PRD ref |
| --- | --- | --- | --- | --- |
| C1 | **AutocompleteInput** | Input (B3) + Dropdown (B13) + result list with highlight | Reuse | §5.2 roles, §5.1 global search |
| C2 | **SubcategoryPicker** | 6 buttons (Language/Framework/Database/Cloud/DevOps/Misc) → opens panel with scoped search + chip list | Add | §5.1 — primary new pattern |
| C3 | **GroupedMultiSelect** | Group buttons (Metro/Tier 2/Global/Remote) → dropdown with select-all + items + custom entry | Reuse (LocationPicker) — formalize as reusable | §5.3 |
| C4 | **GlobalSearchField** | Input with placeholder "Search any skill…", searches across all subcategories | Add | §5.1 flat-search fallback |
| C5 | **OperatorLegend** | Collapsible card listing AND/OR/NOT/" "/( ) with examples in mono font | Add | §5.9 |
| C6 | **CodeBlock (boolean output)** | Mono font, syntax-highlighted (operators blue, quoted green, parens muted), pretty-printed at 80 chars, line-wrap toggle | Extend (queryDisplay exists, no highlighting) | §5.9 |
| C7 | **BooleanTextEditor** | Editable code area with syntax highlight, auto-pair, smart-quote normalize, inline validation, debounced sync, "did you mean" popover | Add | §5.9 — power-user feature |

### D. Patterns (page-level composites)

| # | Component | Composition | State | PRD ref |
| --- | --- | --- | --- | --- |
| D1 | **FilterLane (card)** | Header (icon + title + match-mode toggle) + chip area + input slot | Reuse | §5.1–§5.5 — base of every lane |
| D2 | **SkillBlock** | Match-mode toggle (ANY/ALL) + chip strip + add-input; up to 2 per Skills lane joined by AND | Add | §5.8 nested condition blocks |
| D3 | **SearchGroupCard** | Wraps all lanes for one candidate profile; up to 3, joined by OR | Add | §5.7 |
| D4 | **NoiseFilterStrip** | Persistent strip above lanes; pre-active terms (Intern/Fresher/Trainee) + available terms + "apply by default" toggle | Add | §5.6 |
| D5 | **AndConnector** | Horizontal line + "AND" mono label between lanes | Reuse | §5.1 visual joiner |
| D6 | **OrDivider** | Larger visual divider between SearchGroupCards with "OR" label | Add | §5.7 |
| D7 | **PlatformSelector** | Sticky tab row: Generic / LinkedIn / Naukri / Google X-Ray; remembers last choice | Add | §5.10 |
| D8 | **ResultsBar / OutputBar** | Boolean string preview area + Copy / Copy formatted / Share buttons + length indicator + warnings panel | Extend (resultsBar exists with count + clear/search; needs copy/share/length/warnings) | §5.9, §5.12 |
| D9 | **TemplateCard** | Name, meta, owner badge, usage count, scope chip (private/team), last-used date | Extend (basic templateCard exists) | §5.11 |
| D10 | **TemplateLibraryPanel** | Grid of TemplateCards, filter by scope, save-current button | Extend (templatesGrid exists) | §5.11 |
| D11 | **HistoryListItem** | Compact row: snippet of query, timestamp, restore action | Add | §5.13 history (last 20) |
| D12 | **EmptyState** | Hero + starter template grid when no filters set; copy disabled | Add | §5.13 |
| D13 | **AppHeader / Toolbar** | Brand + Share button + Platform selector + Templates entry + History entry + Settings | Extend (header exists, minimal) | §5.10–§5.13 |
| D14 | **KeyboardShortcutsPanel** | Modal listing all `/`, `Cmd+Enter`, `Cmd+Z/Y`, `Cmd+B`, `Esc` | Add | §5.13 |

### E. Feedback & validation

| # | Component | Variants | State | PRD ref |
| --- | --- | --- | --- | --- |
| E1 | **Banner** | info (blue), warning (yellow), error (red); with title, body, action button(s), dismiss | Add | §5.9, §8 |
| E2 | **ConflictBanner** | Banner with one-click fix action (e.g., "Switch to OR", "Add TypeScript") | Add | §8 type 1 cross-ecosystem, §9 too-complex-to-display |
| E3 | **SuggestionChip** | Dismissible chip with action (e.g., "+ Add TypeScript") + dismiss `×` | Add | §4.3 type 2, §5.6 noise-filter pause |
| E4 | **InlineValidation** | Inline error text under input (red, sm font) + icon | Add | §5.9 unbalanced parens, dangling operators |
| E5 | **ConfirmDialog** | Modal with title, body, confirm (destructive), cancel | Add | §5.13 clear-all confirmation, §9 visual-overwrites-text-edit |
| E6 | **WarningPanel (inline)** | Soft warning at 600 chars, hard warning at 700 chars near boolean output | Add | §9 length |

### F. Overlays

| # | Component | Variants | State | PRD ref |
| --- | --- | --- | --- | --- |
| F1 | **Modal / Dialog** | Sm/Md/Lg; with header, body, footer slots; backdrop dismiss | Add | E5, KeyboardShortcutsPanel, etc. |
| F2 | **Drawer (side panel)** | Right-side; for Templates Library or History | Add (optional) | §5.11, §5.13 |

---

## Reconciliation summary

**Reuse / formalize as `reusable` in .pen** (already drawn in CSS):
Chip (default + excluded), AutocompleteInput, FilterLane, LocationPicker (→ GroupedMultiSelect), ToggleGroup/SegmentedControl, AndConnector, MatchModeToggle, ResultsBar (partial), TemplateCard (basic), Header, Divider, IconButton (chip controls).

**Extend** (variant or state additions): Chip (custom/legacy/badge), Input (error state), Button (loading, disabled, more variants), Dropdown (search-within, grouped + select-all), CodeBlock (syntax highlighting), TemplateCard (owner/scope/usage), Header (Share + Platform + History entries), ResultsBar (Copy/Share/length/warnings).

**Add** (~25 net-new): Severity + Subcategory + Platform tokens; Badge; Checkbox; Range Slider; Range Chip Input; Tabs; Tooltip; Popover; Toast; Progress; Kbd; SubcategoryPicker; GlobalSearchField; OperatorLegend; BooleanTextEditor; SkillBlock; SearchGroupCard; NoiseFilterStrip; OrDivider; PlatformSelector; HistoryListItem; EmptyState; KeyboardShortcutsPanel; Banner; ConflictBanner; SuggestionChip; InlineValidation; ConfirmDialog; Modal; Drawer.

---

## Authoring sequence in `design/ui.pen`

Execute via `mcp__pencil__batch_design`, max 25 ops per call, split into the steps below. Each step is an independent batch — if one fails, only that batch rolls back.

**Step 0 — Inventory (read-only).** `mcp__pencil__get_editor_state` then `mcp__pencil__batch_get` with `{patterns:[{reusable:true}], readDepth:2, searchDepth:3}`. Cross-check the Reuse rows above against what's actually in the file. Downgrade rows accordingly.

**Step 1 — Variables.** `mcp__pencil__set_variables` registering the foundation tokens (Section A) verbatim from `bsb.module.css:1–112`, plus the new severity/subcategory/platform color groups. Use the `--bsb-` names without the leading dashes.

**Step 2 — Design-system frame layout.** Insert a top-level frame `Design System` containing six labeled sections stacked vertically: `Foundations`, `Primitives`, `Composites`, `Patterns`, `Feedback`, `Overlays`. Each section is a horizontal flex frame holding a row of component tiles. Use `find_empty_space_on_canvas` to place beside existing screens.

**Step 3 — Primitives (B1–B10).** Button, IconButton, Input, Chip variants, Badge, Toggle, SegmentedControl, Checkbox, Range Slider, Range Chip Input. One reusable component per node, with all variants laid out.

**Step 4 — Primitives (B11–B21).** Tabs, Dropdown Menu, Tooltip, Popover, Toast, Progress, Spinner, Divider, Kbd, OwnerBadge.

**Step 5 — Composites (C1–C7).** AutocompleteInput, SubcategoryPicker, GroupedMultiSelect, GlobalSearchField, OperatorLegend, CodeBlock, BooleanTextEditor.

**Step 6 — Patterns (D1–D7).** FilterLane, SkillBlock, SearchGroupCard, NoiseFilterStrip, AndConnector, OrDivider, PlatformSelector.

**Step 7 — Patterns (D8–D14).** ResultsBar, TemplateCard, TemplateLibraryPanel, HistoryListItem, EmptyState, AppHeader, KeyboardShortcutsPanel.

**Step 8 — Feedback (E1–E6) + Overlays (F1–F2).** Banner, ConflictBanner, SuggestionChip, InlineValidation, ConfirmDialog, WarningPanel, Modal, Drawer.

After each step, `mcp__pencil__snapshot_layout` with `problemsOnly:true` to catch clipping/overlaps.

---

## Naming conventions

- Component node names: PascalCase, no prefix (e.g., `Chip`, `FilterLane`, `BooleanTextEditor`).
- Variants: dot suffix (e.g., `Chip.excluded`, `Banner.warning`). If Pencil's variant model differs after Step 0 inventory, follow the existing convention in the file.
- Tokens: kebab-case mirroring CSS (`bsb-color-text-primary`).

---

## Critical files

- `docs/prd.md` — source of truth for behavior; cross-reference per row.
- `design/ui.pen` — target file; encrypted, only `pencil` MCP tools.
- `src/components/feat/bsb/bsb.module.css:1–112` — token vocabulary to mirror in Step 1.
- `src/components/feat/bsb/index.tsx` — visual reference for Reuse rows.

---

## Verification

After Step 8:
1. `mcp__pencil__batch_get` with `{patterns:[{reusable:true}]}` and confirm count matches the inventory above (≈45 entries including reused ones).
2. `mcp__pencil__snapshot_layout` `problemsOnly:true` — zero clipped/overlapping nodes in the Design System frame.
3. `mcp__pencil__get_variables` — confirm all foundation + semantic + subcategory + platform tokens are registered.
4. Spot-check three high-leverage components by composing a quick Skills lane mock (FilterLane + SubcategoryPicker + Chip with subcategory badge + MatchModeToggle) and confirm tokens resolve correctly.
5. Open `design/ui.pen` in the desktop app and visually scan every section for legibility and contrast against `var(--bsb-bg-primary)`.

End state: every PRD-required interaction has at least one named, reusable component (or token group) it can be composed from, and the .pen file is ready for screen-level composition work.
