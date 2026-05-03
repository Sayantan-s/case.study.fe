# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`bsb` is a **client-side Boolean Query Builder for recruiters** — a tool that lets recruiters visually compose syntactically valid boolean strings to paste into LinkedIn Recruiter, Naukri, Google X-Ray, and other platforms. The product's only output is a string. It does not execute searches or store candidate data. The full product spec lives in `docs/prd.md` and is the source of truth for behavior, taxonomy, conflict-detection rules, edge cases, and the data model. **Read `docs/prd.md` before designing or implementing features** — it is exhaustive (skills taxonomy with 100+ entries, language→framework dependency map, output formatting per platform, etc.).

The current `src/` is an early prototype (single component, hardcoded skills list, dev/AND boolean output) that does not yet match the PRD's scope (subcategorized skills, search groups, nested blocks, experience range slider, noise filter, text-mode editor, templates, conflict detection, multi-platform renderers).

## Toolchain — Vite+

This project uses **Vite+** (`vp`), a unified toolchain wrapping Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. See `AGENTS.md` for the full Vite+ guide.

| Task | Command |
| --- | --- |
| Install deps | `vp install` (runs after pulling) |
| Dev server | `vp dev` |
| Production build | `npm run build` (runs `tsc -b && vp build`) |
| Format + lint + typecheck | `vp check` |
| Lint only | `vp lint` (type-aware enabled in `vite.config.ts`) — note `package.json` script `npm run lint` runs raw `eslint .` instead |
| Tests | `vp test` |
| Single test | `vp test <pattern>` (Vitest filename/test-name match) |
| Preview prod build | `vp preview` |

Key rules:
- **Do not invoke `pnpm`/`npm`/`yarn` directly** — Vite+ wraps the package manager. Use `vp add`, `vp remove`, `vp update`.
- **Do not install `vitest`, `oxlint`, `oxfmt`, or `tsdown`** — Vite+ bundles them. Import test utilities from `vite-plus/test`, not `vitest`.
- `vp <command>` always runs the Vite+ built-in, never a `package.json` script of the same name. Use `vp run <script>` for custom scripts.

## Architecture

**Stack:** React 19 + TypeScript + Vite+ + `@base-ui/react`. React Compiler is enabled via `babel-plugin-react-compiler` in `vite.config.ts` — do not memoize manually unless the compiler can't.

**Entry:** `src/main.tsx` → `src/App.tsx` → `src/components/feat/bsb/index.tsx`. The whole app is the `BooleanSearchBuilder` component.

**State shape (current prototype):** A single `useState` in `BooleanSearchBuilder` holds `{ skills, roles, locations, types, experience }`. `buildQuery()` and `candidateCount()` are pure derived functions over that state, memoized with `useMemo`. Adding new lanes follows the same `addItem` / `removeItem` / `toggleExclude` callback pattern.

**Target state model (per PRD §7.1):** `QueryState → SearchGroup[] → { skills: { blocks[] }, roles, locations, contributorTypes, experience }`. When extending the prototype, migrate toward this shape rather than tacking new fields onto the flat one.

**Styling:** CSS Modules (`*.module.css`) only. The design system lives as CSS custom properties on the `.root` selector in `bsb.module.css` (color, spacing, radius, font-size scales — all prefixed `--bsb-*`). Reuse these tokens; do not introduce hardcoded colors. Fonts (DM Sans, JetBrains Mono) are injected at runtime by appending a `<link>` from inside the component — keep this pattern or move it to `index.html` if changing.

**Components convention:** `src/components/feat/<feature-name>/` for feature components, with `index.tsx` and a co-located `*.module.css`. Shared primitives (when extracted) should live elsewhere — currently `Chip`, `AutoComplete`, `FilterLane`, `LocationPicker`, `ToggleGroup`, `AndConnector` are all defined inside the single `bsb/index.tsx` file and will need to be split out as the design system grows.

## Design files

`design/ui.pen` is a **Pencil** design file. It is **encrypted** — never `Read` or `grep` it. Use the `pencil` MCP tools (`get_editor_state`, `batch_get`, `batch_design`, etc.) for all interaction with `.pen` files. Start with `get_editor_state()` to discover what's open.

## Boolean output rules (from PRD §7.3)

When implementing or modifying query generation: operators always uppercase; multi-word terms always quoted; parens around any group with 2+ items; smart quotes normalized to straight; empty filters omitted; string must be syntactically valid before Copy is enabled (red errors block copy, yellow warnings don't). Platform-specific formatting is a **renderer over a canonical AST** — adding a platform is a new renderer, not a builder change.

## Reviewer checklist before pushing

- `vp install` (after pulling)
- `vp check` passes
- `vp test` passes
