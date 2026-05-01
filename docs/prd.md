# PRD: Boolean Query Builder for Recruiters

**Author:** Sayantan
**Status:** Draft v1.0
**Last updated:** May 2026

---

## 1. Overview

### 1.1 Problem statement

Recruiters source candidates across multiple platforms — LinkedIn Recruiter, Naukri, Hirist, internal ATS, Google X-Ray — each expecting a boolean string as input. Today, recruiters either hand-write boolean strings (error-prone, inconsistent), reuse stale strings copied from old docs, or depend on the most senior team member to construct queries — creating a bottleneck and quality gap.

### 1.2 Goal

Build a **Boolean Query Builder** — a client-side tool that lets any recruiter visually construct a syntactically correct, semantically coherent boolean query string and copy it into the platform of their choice. The product's only output is a string. It does not execute searches, store candidates, or integrate with any ATS or job board.

### 1.3 What this product is and isn't

| Is                                 | Isn't                          |
| ---------------------------------- | ------------------------------ |
| A query string generator           | A search engine                |
| A copy-paste workflow tool         | A candidate database           |
| A teaching tool for boolean syntax | An ATS integration             |
| Client-side only                   | Server-side or stateful        |
| Platform-agnostic output           | Tied to any specific job board |

### 1.4 Success metrics

| Metric                                 | Target (90 days post-launch) | How measured              |
| -------------------------------------- | ---------------------------- | ------------------------- |
| Weekly active recruiters               | ≥ 80% of recruiting team     | Auth-gated usage          |
| Queries copied per recruiter per week  | ≥ 25                         | Copy button click events  |
| Median time-to-copy (blank → copy)     | < 45 seconds                 | Session timing            |
| Syntax error rate in generated strings | 0%                           | Validation on every copy  |
| Semantic conflict warnings triggered   | Track only (baseline)        | Conflict detection events |
| % of recruiters using saved templates  | ≥ 30%                        | Template apply events     |
| Recruiter CSAT                         | ≥ 4.3 / 5                    | Quarterly survey          |

---

## 2. User personas

**Priya — Recruiter (primary user, ~80% of usage)**
3+ years experience. Sources daily across LinkedIn, Naukri, internal ATS. Confident with structured filters; intimidated by hand-writing boolean. Spends 5–10 minutes per search constructing strings, often with 1–2 failed attempts before getting usable results.

**Arjun — Senior Recruiter / Sourcer (power user, ~15% of usage)**
5+ years experience. Comfortable with boolean syntax. Wants speed and full control. Frequently constructs complex multi-condition strings. Will primarily use the boolean text mode.

**Maya — Recruiting Lead (template author, ~5% of usage)**
Manages a team of recruiters. Cares about query consistency. Owns the team's shared template library and taxonomy governance.

---

## 3. User stories

**Query construction**

- As a recruiter, I want to browse skills organized into subcategories (Language, Framework, Database, Cloud, DevOps, Misc) so I can find relevant skills quickly without scrolling an undifferentiated list.
- As a recruiter, I want to add skills, roles, and locations as visual chips so I don't have to hand-write boolean syntax.
- As a recruiter, I want to flip an "ANY / ALL" toggle within a filter lane so I can switch between OR and AND without thinking in boolean terms.
- As a recruiter, I want to exclude specific terms using a NOT toggle on individual chips.
- As a recruiter, when I select a framework, I want the builder to surface its dependent language so I can consciously decide whether to include it.
- As a recruiter, I want a range slider for experience (0–40 years) with the option to manually enter a specific range so I can express precise experience requirements.
- As a recruiter, I want a persistent noise filter that auto-excludes interns, freshers, and trainees so I don't manually add these every time.
- As a recruiter, I want to combine multiple candidate profiles with OR at the top level (Search Groups) so I can express distinct archetypes in one query.
- As a recruiter, I want to nest one level of conditions inside a skill filter so I can express "A AND (B OR C)".

**Output and copy**

- As a recruiter, I want to see the generated boolean string update live as I build my query.
- As a recruiter, I want a one-click Copy button to copy the string into my clipboard.
- As a recruiter, I want to choose a target platform (LinkedIn / Naukri / Google X-Ray / Generic) so the generated string uses that platform's syntax.

**Power use**

- As a senior recruiter, I want to view and directly edit the boolean string with bidirectional sync to the visual filters.
- As a senior recruiter, I want syntax highlighting, auto-pairing, and real-time validation in the text editor.

**Templates and history**

- As a recruiting lead, I want to save and share query templates so my team uses consistent search patterns.
- As a recruiter, I want a query history of my last 20 queries so I can revisit or tweak recent searches.
- As a recruiter, I want shareable query links so I can send a pre-populated builder state to a teammate.

---

## 4. Skill taxonomy

This is the foundational layer the entire builder depends on. Maintaining it well is the highest-leverage operational task associated with this product.

### 4.1 Skill subcategories

Skills are organized into six subcategories:

| Subcategory   | Description                                            | Examples                                                                                                               |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Language**  | Programming and scripting languages                    | JavaScript, TypeScript, Python, Java, Go, Rust, Swift, Kotlin, Ruby, C++, C#, Dart, Scala, R                           |
| **Framework** | Libraries and frameworks (carries language dependency) | React, Angular, Vue.js, Next.js, Django, Flask, Spring Boot, Rails, Flutter, Express, FastAPI, NestJS, Laravel         |
| **Database**  | Relational, NoSQL, search, and cache stores            | PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB, BigQuery, Snowflake, Neo4j                      |
| **Cloud**     | Cloud platforms and their managed services             | AWS, GCP, Azure, AWS Lambda, EC2, S3, GKE, Cloud Run, Azure DevOps                                                     |
| **DevOps**    | Infrastructure, CI/CD, containers, observability       | Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions, ArgoCD, Prometheus, Grafana, Datadog                  |
| **Misc**      | Cross-cutting skills without a home above              | System Design, HLD, LLD, DSA, Microservices, REST APIs, GraphQL, gRPC, Agile, Scrum, Code Review, Technical Leadership |

### 4.2 Language → framework dependency map

Every framework entry carries one or more `dependsOn` language references. This powers two features: conflict detection and auto-suggestion.

| Framework                               | Depends on               |
| --------------------------------------- | ------------------------ |
| React, Next.js, Angular, Vue.js, Svelte | JavaScript or TypeScript |
| Express, NestJS                         | JavaScript or TypeScript |
| Django, Flask, FastAPI                  | Python                   |
| Spring Boot                             | Java or Kotlin           |
| Rails                                   | Ruby                     |
| Laravel                                 | PHP                      |
| Flutter                                 | Dart                     |
| React Native                            | JavaScript or TypeScript |
| Gin, Echo                               | Go                       |
| Actix, Axum                             | Rust                     |

This map is maintained as a structured JSON config file, not hardcoded in UI logic, so it can be updated independently of a frontend release.

### 4.3 Conflict detection (semantic validation)

When a recruiter adds skills to their query, the builder checks for semantic conflicts across the taxonomy:

**Type 1 — Cross-language framework conflict:**
The recruiter selects a framework from two incompatible language families. Example: `Django` (Python) + `Spring Boot` (Java) together is almost certainly unintentional for a single role.

Behavior: surface a **yellow warning banner** — _"Django and Spring Boot belong to different language ecosystems. Did you mean to use OR instead of AND?"_ — with a one-click fix. Non-blocking; recruiter can override.

**Type 2 — Framework without parent language:**
The recruiter adds `React` but not `JavaScript` or `TypeScript`.

Behavior: surface a **soft suggestion** — _"React typically requires JavaScript or TypeScript. Add to query?"_ — as a dismissable chip above the Skills lane. Not a warning; just a nudge. Recruiter may have intentionally left the language out if it's implied.

**Type 3 — NOT contradiction:**
The recruiter adds `React` and `NOT React` simultaneously (usually a copy-paste error).

Behavior: **red error** — blocks copy until resolved.

**What conflict detection does NOT do:**

- Block the query. Recruiters may have intentional reasons for unusual combinations.
- Judge cross-subcategory combinations (a DevOps skill + a Language skill is normal).
- Run any external lookup. All conflict logic is derived entirely from the local taxonomy map.

### 4.4 Taxonomy governance

- The taxonomy JSON is version-controlled and owned by Recruiting Ops with Product support.
- Quarterly review: audit the top 20 custom-entry skills added by recruiters. If a skill appears 10+ times as a custom entry, it gets promoted to the hardcoded list in the next release.
- Frameworks: new frameworks are added with their `dependsOn` map populated before merging.
- Deprecated skills (e.g., jQuery) are moved to a `legacy` subcategory rather than deleted, so old templates don't break.

---

## 5. Functional requirements

### 5.1 Skills lane (subcategorized)

The Skills lane opens into a **categorized picker** rather than a flat autocomplete:

```
┌─ Skills ──────────────────────────────────────────────────┐
│  [Language ▾] [Framework ▾] [Database ▾]                  │
│  [Cloud ▾] [DevOps ▾] [Misc ▾]                            │
│                                                           │
│  [React ×]  [TypeScript ×]  [PostgreSQL ×]  [Docker ×]   │
│                                                           │
│  ⚠ React requires JavaScript or TypeScript. [Add TypeScript ×] [Dismiss] │
│                                                           │
│  Match:  ○ ANY (OR)   ● ALL (AND)   [2 condition blocks]  │
└───────────────────────────────────────────────────────────┘
```

**Subcategory dropdowns:** Each subcategory button opens a panel listing skills in that category, with a search input inside. Selecting any skill adds it as a chip.

**Flat search fallback:** A global search input above the subcategory buttons searches across all subcategories simultaneously. For recruiters who already know what they want.

**Custom entry:** Free-text entry accepted in the global search. Multi-word custom entries are auto-quoted in the output. Saved to the recruiter's personal custom list.

**Subcategory label on chips:** Each chip displays a small subcategory badge (faint, not intrusive) so the recruiter can see the composition of their skill set at a glance.

### 5.2 Roles lane

Single flat lane with autocomplete from the hardcoded roles list + custom entry. No subcategorization needed. Within-lane logic toggles between OR and ALL.

Common roles list:

- Software Engineer, Senior Software Engineer, Staff Engineer, Principal Engineer
- Frontend Engineer, Backend Engineer, Full Stack Engineer
- DevOps Engineer, SRE, Platform Engineer
- Data Engineer, Data Scientist, ML Engineer, AI Engineer
- iOS Developer, Android Developer, Mobile Engineer
- Engineering Manager, Director of Engineering, VP Engineering, CTO
- Product Manager, Senior PM, Technical Program Manager
- QA Engineer, SDET, Solutions Architect

### 5.3 Locations lane

Grouped multi-select picker organized by region:

| Group        | Cities                                                             |
| ------------ | ------------------------------------------------------------------ |
| Metro India  | Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune             |
| Tier 2 India | Ahmedabad, Kolkata, Jaipur, Kochi, Chandigarh, Indore, Lucknow     |
| Global       | San Francisco, New York, London, Singapore, Berlin, Toronto, Dubai |
| Remote       | Remote – India, Remote – Global, Hybrid                            |

Each group has a "Select all" option. Custom location entry accepted. Within-lane logic is always OR (a candidate can't be in two locations simultaneously).

### 5.4 Contributor type lane

Toggle group. No subcategorization needed:

`IC` `IC + Manager` `Manager`

Multiple selections are OR'd.

### 5.5 Experience lane (range slider)

**Replace discrete toggles with a continuous range slider:**

- Range: 0 to 40 years.
- Dual-handle slider: left handle = minimum, right handle = maximum.
- Step: 1 year.
- Handles snap to whole numbers. Displaying the range as a chip: `3 – 7 yrs`.

**Custom range chip input:**

- Recruiter can bypass the slider by typing a range directly: e.g., `5-10` or `8+` or `<3`.
- Accepted formats: `N-M` (range), `N+` (at least N), `<N` (less than N), `N` (exact).
- Input is normalized to a range: `8+` → `8–40`, `<3` → `0–3`, `5` → `5–5`.
- Displayed as a chip, removable.

**Multiple ranges:**
Recruiters can add multiple non-overlapping experience ranges. Example: `0–2 yrs` OR `10+ yrs` for a role open to both fresh grads and veterans. Multiple range chips are OR'd in the generated string.

**Output format:**

```
(experience >= 5 AND experience <= 10)
```

Or in plain text for platforms that don't support numeric operators:

```
"5 years" OR "6 years" OR "7 years" OR "8 years" OR "9 years" OR "10 years"
```

Platform renderer decides which format to use.

### 5.6 Noise filter

A persistent strip above the filter lanes.

**Pre-activated defaults:** Intern, Fresher, Trainee
**Available but inactive:** Student, Consultant, Contractor
**Custom additions:** Recruiter-defined, saved per profile.

**"Apply to all my queries by default" toggle:** When enabled, noise filter pre-applies to every new query.

**Smart override:** If Skills or Roles suggest early-career intent (e.g., custom role "Graduate Hire"), the builder surfaces: _"Your query looks like it targets early-career candidates. Pause noise filter?"_

**Output:** Appended as `AND NOT ("Intern" OR "Fresher" OR "Trainee" ...)` at the end of the generated string. Visually distinct in the boolean view.

### 5.7 Search Groups (top-level OR)

Up to 3 groups, each independently configured with its own lanes. Joined by OR at the top level. Wrap each group in parens in the output: `(group1) OR (group2)`.

Each group inherits the global noise filter by default; overridable per-group.

_"+ Add another candidate profile"_ button below the first group. Visual "OR" divider between groups.

### 5.8 Nested condition blocks within Skills lane

Within the Skills lane, recruiters can create up to 2 condition blocks, each with its own AND/OR mode, joined by AND between blocks:

```
Block 1 [ANY]:  React  OR  Vue
          AND
Block 2 [ALL]:  TypeScript  AND  Jest
```

This handles the `(React OR Vue) AND (TypeScript AND Jest)` class of queries without exposing a generic tree builder. Maximum nesting depth: 1 level inside a lane (blocks contain chips, not further blocks). If a recruiter needs deeper nesting, the boolean text mode handles it.

### 5.9 Boolean text view

**Always visible** — this is the product's primary output. Positioned prominently below the filter lanes.

**Display:**

- Live update on every filter change (pure client-side, no debounce needed).
- Syntax highlighting: operators in blue, quoted strings in green, parens in muted gray.
- Operators always uppercase.
- Pretty-printed with line breaks when string exceeds ~80 chars; copied as single line by default (toggleable).

**Copy mechanism:**

- Prominent **Copy** button adjacent to the boolean string output.
- Clicking copies to clipboard, shows a "Copied!" toast.
- Copy is **blocked** if the string has an active red error. Unblocked for yellow warnings (recruiter can override).
- Secondary option: "Copy formatted" (with line breaks and indentation, for pasting into docs).

**Editing (bidirectional sync):**

- The text view is directly editable.
- Text → visual sync runs on 500ms debounce to avoid flicker while typing.
- Visual → text sync is instantaneous.
- If the parsed AST exceeds visual builder representable depth, a banner shows: _"This query is too complex to display visually — editing in text mode only."_ Text remains the source of truth.

**Smart input assists:**

- Auto-pair brackets and quotes.
- Real-time validation: unbalanced parens, dangling operators → inline warning.
- Smart-quote normalization: `"` and `"` and `"` all accepted, normalized to `"` in output.
- Implicit AND: `React TypeScript` parsed as `React AND TypeScript`.
- "Did you mean" suggestions on parse failure.
- Operator auto-uppercase: typing `and` converts to `AND`.

**Operator legend:** Collapsible reference panel above the text input:

```
AND   narrow      React AND TypeScript
OR    expand      React OR Vue
NOT   exclude     NOT "Intern"
" "   exact       "Product Manager"
( )   group       (React OR Vue) AND TypeScript
```

### 5.10 Target platform selector

A sticky selector (remembers last choice) that determines output formatting:

| Platform         | Behavior                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Generic**      | Standard boolean: `AND`, `OR`, `NOT`, `"..."`, `(...)`                                                         |
| **LinkedIn**     | Same as generic. LinkedIn supports standard boolean natively.                                                  |
| **Naukri**       | Adjusted for Naukri's keyword field conventions.                                                               |
| **Google X-Ray** | Prepends `site:linkedin.com/in/ intitle:` or equivalent; uses Google operator syntax (`-` for NOT, no parens). |

Platform formatting is a renderer layer over the canonical AST. Adding new platforms requires only a new renderer, not changes to the builder.

### 5.11 Templates

**Pre-built templates (~10, shipped with product):**

- Senior React Engineer – Metro India
- Backend Lead – Remote India
- ML Engineer – Global
- Mobile Developer – India
- Full Stack Engineer – Tier 2
- DevOps / Platform Engineer
- Data Engineer – Metro
- Engineering Manager – Startup
- Senior Product Manager
- QA / SDET – India

**Custom templates:**

- Save current full query state (all lanes, groups, noise filter, platform selection) as a template.
- Scope: private or shared with team.
- Recruiting leads can publish team-wide templates.
- Templates store query state, not the generated string — so they remain editable.

**Template metadata:** Name, description, owner, scope, created at, last used at, usage count.

**Auto-archive:** Templates unused for 90 days are archived (not deleted) with a restore option.

### 5.12 Shareable query links

The full query state can be URL-encoded as a query parameter. Sharing the URL opens the builder pre-populated with that state. This requires no server — the state is entirely in the URL.

Example: `https://yourapp.com/builder?q=eyJncm91cHMiOi...` (base64-encoded JSON).

_"Share"_ button next to Copy generates and copies the URL to clipboard.

### 5.13 Quality-of-life features

- **Clear all** (with confirmation for 5+ filters).
- **Undo / redo** — last 20 actions.
- **Query history** — last 20 generated query states, stored in browser local storage. One-click restore.
- **Keyboard shortcuts:**

| Shortcut           | Action                   |
| ------------------ | ------------------------ |
| `/`                | Focus skills search      |
| `Cmd/Ctrl + Enter` | Copy to clipboard        |
| `Cmd/Ctrl + Z / Y` | Undo / redo              |
| `Cmd/Ctrl + B`     | Toggle boolean text mode |
| `Esc`              | Close any open dropdown  |

- **Empty state:** When no filters set, show curated starter templates rather than an empty builder.
- **Mobile-responsive:** Lanes stack vertically; chip targets sized for touch (min 44px).

---

## 6. Non-functional requirements

### 6.1 Performance

All computation is client-side. Targets are tight:

| Operation                            | Target                 |
| ------------------------------------ | ---------------------- |
| Chip add/remove                      | < 30ms                 |
| Boolean string regeneration          | < 50ms                 |
| Bidirectional sync (text → visual)   | < 100ms after debounce |
| Initial page load                    | < 1.5s on 4G           |
| Boolean parse + validate             | < 50ms                 |
| URL encode / decode full query state | < 20ms                 |

### 6.2 Reliability

- 100% of generated strings must be syntactically valid (validated before display; Copy blocked on red errors).
- Graceful degradation if local storage is unavailable (history and templates disabled; core builder fully functional).
- Taxonomy JSON loaded at build time, not fetched at runtime — no network dependency for core functionality.

### 6.3 Accessibility

- WCAG 2.1 AA compliance.
- Full keyboard navigation; no mouse-only flows.
- Screen reader support for chips, toggles, range slider, boolean text view, and copy action.
- Sufficient color contrast (4.5:1 body, 3:1 UI elements).
- Range slider accessible via arrow keys with ARIA labels.
- `prefers-reduced-motion` respected.

### 6.4 Browser support

Chrome, Safari, Firefox, Edge — current and previous major versions. Clipboard API for copy; `document.execCommand('copy')` fallback.

### 6.5 Data and privacy

- All query state lives in browser local storage by default.
- Optional account-level sync for templates only (across devices). Opt-in.
- No candidate data stored, fetched, or logged anywhere.
- Analytics events (copy clicks, feature usage) are anonymized and aggregated. Query strings are never logged.

---

## 7. Information architecture

### 7.1 Data model

```
QueryState {
  groups: [SearchGroup]         // 1–3 groups, joined by OR
  noiseFilter: NoiseFilter
  targetPlatform: enum          // generic | linkedin | naukri | xray
}

SearchGroup {
  skills: SkillsLane
  roles: Lane
  locations: Lane
  contributorTypes: [enum]      // IC | IC+Manager | Manager
  experience: [ExperienceRange] // 1+ ranges, OR'd
}

SkillsLane {
  blocks: [SkillBlock]          // 1–2 blocks, AND'd
}

SkillBlock {
  matchMode: any | all          // OR | AND within block
  items: [SkillItem]
}

SkillItem {
  label: string
  subcategory: enum             // language | framework | database | cloud | devops | misc
  excluded: boolean             // NOT flag
  isCustom: boolean
}

Lane {
  matchMode: any | all
  items: [Item]
}

Item {
  label: string
  excluded: boolean
  isCustom: boolean
}

ExperienceRange {
  min: number                   // 0–40
  max: number                   // 0–40, >= min
}

NoiseFilter {
  active: boolean
  terms: [string]
  applyByDefault: boolean
}

SkillTaxonomy {
  skills: [{
    label: string
    subcategory: enum
    dependsOn: [string]         // labels of parent language skills (for frameworks)
    status: active | legacy
  }]
}

Template {
  id, name, description
  ownerId, scope: private | team
  queryState: QueryState
  createdAt, updatedAt, usageCount
}
```

### 7.2 Boolean query grammar

```
Query    = Group (OR Group)*
Group    = Clause (AND Clause)*
Clause   = "(" Term (AND|OR Term)* ")"  |  Term
Term     = NOT? QuotedString
         | NOT? UnquotedWord
```

**Visual builder depth:** 2 levels (groups → lanes → items, with up to 2 skill blocks within the skills lane).

**Text mode depth:** Unlimited. If parsed AST exceeds visual depth, text becomes the source of truth.

### 7.3 String generation rules

- Multi-word terms always wrapped in quotes: `Product Manager` → `"Product Manager"`.
- Single-word terms quoted by default (configurable per platform).
- Operators always uppercase.
- Parens added around any group with 2+ items.
- Smart quotes normalized to straight quotes.
- Trailing whitespace stripped.
- Empty filters omitted (no empty parens, no dangling AND).
- Experience range rendered as per platform: numeric expression for platforms that support it, enumerated year strings for those that don't.

---

## 8. Conflict detection rules

| Conflict type                         | Trigger                                                  | Severity | UI treatment                                            |
| ------------------------------------- | -------------------------------------------------------- | -------- | ------------------------------------------------------- |
| Cross-ecosystem frameworks (AND mode) | Django + Spring Boot in same block with ALL mode         | Yellow   | Warning banner, suggest switching to OR or removing one |
| Framework missing parent language     | React selected, no JS/TS in query                        | Yellow   | Suggestion chip to add language                         |
| NOT contradiction                     | Skill X and NOT Skill X both present                     | Red      | Error, Copy blocked                                     |
| Same skill added twice                | React chip added when React already exists               | Silent   | Deduplicate silently                                    |
| Mutually exclusive contributor types  | None — IC, IC+Manager, Manager can all be valid together | N/A      | No conflict                                             |

Conflict detection runs entirely client-side from the taxonomy JSON. No external API calls.

---

## 9. Edge cases

| Case                                                                   | Handling                                                                                                          |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Experience range: min > max                                            | Swap values silently                                                                                              |
| Experience range: min = max                                            | Treat as exact year; render as `"N years"`                                                                        |
| Overlapping experience ranges (e.g., 2–5 and 4–8)                      | Merge to union range (2–8); notify recruiter                                                                      |
| Generated string exceeds platform max length (LinkedIn ~700 chars)     | Soft warning at 600 chars, hard warning at 700; copy still allowed                                                |
| Recruiter edits text into a state the visual builder can't represent   | Text is source of truth; visual shows informational banner                                                        |
| Recruiter manually edits text, then changes a visual filter            | Visual change regenerates text and overwrites manual edits; first occurrence shows a one-time confirmation dialog |
| All filters cleared                                                    | Show empty state with starter templates; Copy button disabled                                                     |
| Custom entry contains boolean operators (e.g., "React AND TypeScript") | Treat as a literal string, quote it, surface a warning: "Did you mean two separate skills?"                       |
| Browser local storage full                                             | Auto-prune oldest history; templates always preserved                                                             |
| Shareable URL decoded on a different browser/device                    | Full state restored; no login required                                                                            |
| Legacy taxonomy skill in old template                                  | Load without error; show a subtle "legacy skill" badge on the chip                                                |

---

## 10. Open questions

1. **Taxonomy ownership:** Who owns the skills/roles/locations taxonomy JSON? Recruiting Ops, or a shared Recruiting Ops + Product responsibility? What is the SLA for adding a new skill?
2. **Account auth and template sync:** Does the tool require login to enable cross-device template sync, or is everything local-only? If login required, which auth provider?
3. **Template moderation:** Do team-shared templates need approval from a recruiting lead, or self-publish with a report/remove mechanism?
4. **Platform support priority:** Which platforms beyond Generic and LinkedIn ship at launch? Confirm Naukri and Google X-Ray are needed with recruiting team.
5. **Chrome extension:** A browser extension that injects the generated string directly into LinkedIn / Naukri's search bar would eliminate the copy-paste step entirely. Worth scoping now or after launch?
6. **Experience output for platforms without numeric operators:** The enumerated-years approach (`"5 years" OR "6 years" OR...`) gets very long for wide ranges (e.g., 3–12 years = 9 OR clauses). Confirm with recruiters whether this is acceptable or whether they prefer to manually specify years when using those platforms.
7. **Analytics granularity:** What is the privacy stance on logging anonymized query structure (not content) for usage analysis?

---

## 11. Rollout plan

### 11.1 Development sequencing (within single release)

All features ship together. Internal sequencing for the engineering team:

| Sequence | Track         | Deliverable                                                                                       |
| -------- | ------------- | ------------------------------------------------------------------------------------------------- |
| 1        | Foundation    | Taxonomy JSON, language-framework dependency map, conflict detection engine                       |
| 2        | Core UI       | Skills lane with subcategory picker, Roles, Locations, Contributor Type                           |
| 3        | Experience    | Range slider + custom range chip input, multiple range support                                    |
| 4        | Query gen     | Boolean string generation, string rules, platform renderer (Generic + LinkedIn first)             |
| 5        | Noise filter  | Persistent exclusion strip, defaults, custom terms, "apply by default" toggle                     |
| 6        | Search Groups | Multi-group UI, top-level OR, per-group noise override                                            |
| 7        | Nested blocks | Condition blocks within Skills lane                                                               |
| 8        | Text mode     | Boolean text view, syntax highlighting, bidirectional sync, validation, "did you mean"            |
| 9        | Templates     | Pre-built templates, save/share/team templates, auto-archive                                      |
| 10       | Polish        | Query history, undo/redo, shareable links, keyboard shortcuts, platform renderers (Naukri, X-Ray) |

### 11.2 Pre-launch milestones

| Milestone          | Criteria                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Internal alpha** | All core UI complete; 5 pilot recruiters testing daily for 2 weeks.                                                 |
| **Beta**           | All features complete; full recruiting team (30 users) for 3 weeks. Track all success metrics from day one of beta. |
| **GA**             | CSAT ≥ 4.0 in beta, zero critical bugs, taxonomy reviewed and signed off by Recruiting Ops.                         |

### 11.3 Post-launch operations

- Monthly taxonomy review: audit custom entries, promote frequent ones to hardcoded list.
- Quarterly CSAT survey.
- Bug triage SLA: syntax-correctness bugs (highest severity) fixed within 48 hours; UX bugs within 2 weeks.

---

## 12. Appendix

**A. Skill taxonomy JSON — full list**

Skills are grouped below by subcategory for readability. Each entry follows the schema:
`{ label, subcategory, dependsOn[], status }`.

`dependsOn` is non-empty only for frameworks; all other subcategories have `[]`.

---

#### Languages (35)

```json
[
  { "label": "JavaScript", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "TypeScript", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Python", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Java", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Go", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Rust", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Swift", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Kotlin", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Ruby", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "PHP", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "C", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "C++", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "C#", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Dart", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Scala", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "R", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Elixir", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Erlang", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Haskell", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Clojure", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "F#", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Groovy", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Lua", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Julia", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Perl", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Bash", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "PowerShell", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Solidity", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Zig", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "OCaml", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "MATLAB", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "Assembly", "subcategory": "language", "dependsOn": [], "status": "active" },
  { "label": "COBOL", "subcategory": "language", "dependsOn": [], "status": "legacy" },
  { "label": "Fortran", "subcategory": "language", "dependsOn": [], "status": "legacy" },
  { "label": "SQL", "subcategory": "language", "dependsOn": [], "status": "active" }
]
```

---

#### Frameworks (70)

Grouped by language family below; all share the same JSON schema.

**Frontend — JavaScript / TypeScript**

```json
[
  {
    "label": "React",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Next.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Angular",
    "subcategory": "framework",
    "dependsOn": ["TypeScript"],
    "status": "active"
  },
  {
    "label": "Vue.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Nuxt.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Svelte",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "SvelteKit",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Remix",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Gatsby",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Astro",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Ember.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript"],
    "status": "active"
  },
  {
    "label": "Alpine.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript"],
    "status": "active"
  },
  {
    "label": "Lit",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Qwik",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Solid.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Preact",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "React Native",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Expo",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Ionic",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  }
]
```

**Backend — JavaScript / TypeScript**

```json
[
  {
    "label": "Node.js",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Express",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "NestJS",
    "subcategory": "framework",
    "dependsOn": ["TypeScript"],
    "status": "active"
  },
  {
    "label": "Fastify",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Koa",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Hapi",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "AdonisJS",
    "subcategory": "framework",
    "dependsOn": ["TypeScript"],
    "status": "active"
  }
]
```

**Python**

```json
[
  { "label": "Django", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Flask", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "FastAPI", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Starlette", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Tornado", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Pyramid", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Litestar", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Celery", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" }
]
```

**Java / Kotlin**

```json
[
  {
    "label": "Spring Boot",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  },
  {
    "label": "Spring MVC",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  },
  {
    "label": "Quarkus",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  },
  {
    "label": "Micronaut",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  },
  {
    "label": "Vert.x",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  },
  {
    "label": "Play Framework",
    "subcategory": "framework",
    "dependsOn": ["Java", "Scala"],
    "status": "active"
  },
  {
    "label": "Hibernate",
    "subcategory": "framework",
    "dependsOn": ["Java", "Kotlin"],
    "status": "active"
  }
]
```

**C# / .NET**

```json
[
  { "label": "ASP.NET Core", "subcategory": "framework", "dependsOn": ["C#"], "status": "active" },
  { "label": "Blazor", "subcategory": "framework", "dependsOn": ["C#"], "status": "active" },
  { "label": ".NET MAUI", "subcategory": "framework", "dependsOn": ["C#"], "status": "active" },
  {
    "label": "Entity Framework",
    "subcategory": "framework",
    "dependsOn": ["C#"],
    "status": "active"
  },
  { "label": "SignalR", "subcategory": "framework", "dependsOn": ["C#"], "status": "active" }
]
```

**Ruby**

```json
[
  {
    "label": "Ruby on Rails",
    "subcategory": "framework",
    "dependsOn": ["Ruby"],
    "status": "active"
  },
  { "label": "Sinatra", "subcategory": "framework", "dependsOn": ["Ruby"], "status": "active" },
  { "label": "Hanami", "subcategory": "framework", "dependsOn": ["Ruby"], "status": "active" }
]
```

**PHP**

```json
[
  { "label": "Laravel", "subcategory": "framework", "dependsOn": ["PHP"], "status": "active" },
  { "label": "Symfony", "subcategory": "framework", "dependsOn": ["PHP"], "status": "active" },
  { "label": "CodeIgniter", "subcategory": "framework", "dependsOn": ["PHP"], "status": "active" },
  { "label": "Yii", "subcategory": "framework", "dependsOn": ["PHP"], "status": "active" }
]
```

**Go**

```json
[
  { "label": "Gin", "subcategory": "framework", "dependsOn": ["Go"], "status": "active" },
  { "label": "Echo", "subcategory": "framework", "dependsOn": ["Go"], "status": "active" },
  { "label": "Fiber", "subcategory": "framework", "dependsOn": ["Go"], "status": "active" },
  { "label": "Chi", "subcategory": "framework", "dependsOn": ["Go"], "status": "active" },
  { "label": "Beego", "subcategory": "framework", "dependsOn": ["Go"], "status": "active" }
]
```

**Rust**

```json
[
  { "label": "Actix-web", "subcategory": "framework", "dependsOn": ["Rust"], "status": "active" },
  { "label": "Axum", "subcategory": "framework", "dependsOn": ["Rust"], "status": "active" },
  { "label": "Rocket", "subcategory": "framework", "dependsOn": ["Rust"], "status": "active" }
]
```

**Mobile — Native**

```json
[
  { "label": "SwiftUI", "subcategory": "framework", "dependsOn": ["Swift"], "status": "active" },
  { "label": "UIKit", "subcategory": "framework", "dependsOn": ["Swift"], "status": "active" },
  {
    "label": "Jetpack Compose",
    "subcategory": "framework",
    "dependsOn": ["Kotlin"],
    "status": "active"
  },
  { "label": "Flutter", "subcategory": "framework", "dependsOn": ["Dart"], "status": "active" },
  { "label": "Xamarin", "subcategory": "framework", "dependsOn": ["C#"], "status": "legacy" }
]
```

**ML / Data — Python**

```json
[
  {
    "label": "TensorFlow",
    "subcategory": "framework",
    "dependsOn": ["Python"],
    "status": "active"
  },
  { "label": "PyTorch", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "Keras", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  {
    "label": "scikit-learn",
    "subcategory": "framework",
    "dependsOn": ["Python"],
    "status": "active"
  },
  { "label": "Pandas", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "NumPy", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "SciPy", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "JAX", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  {
    "label": "Hugging Face",
    "subcategory": "framework",
    "dependsOn": ["Python"],
    "status": "active"
  },
  { "label": "LangChain", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  {
    "label": "LlamaIndex",
    "subcategory": "framework",
    "dependsOn": ["Python"],
    "status": "active"
  },
  { "label": "XGBoost", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "LightGBM", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  {
    "label": "Apache Spark",
    "subcategory": "framework",
    "dependsOn": ["Python", "Java", "Scala"],
    "status": "active"
  },
  {
    "label": "Apache Flink",
    "subcategory": "framework",
    "dependsOn": ["Java", "Scala", "Python"],
    "status": "active"
  },
  { "label": "dbt", "subcategory": "framework", "dependsOn": ["SQL", "Python"], "status": "active" }
]
```

**Testing**

```json
[
  {
    "label": "Jest",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Vitest",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Cypress",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript"],
    "status": "active"
  },
  {
    "label": "Playwright",
    "subcategory": "framework",
    "dependsOn": ["JavaScript", "TypeScript", "Python"],
    "status": "active"
  },
  {
    "label": "Selenium",
    "subcategory": "framework",
    "dependsOn": ["Java", "Python", "C#", "JavaScript"],
    "status": "active"
  },
  { "label": "JUnit", "subcategory": "framework", "dependsOn": ["Java"], "status": "active" },
  { "label": "TestNG", "subcategory": "framework", "dependsOn": ["Java"], "status": "active" },
  { "label": "pytest", "subcategory": "framework", "dependsOn": ["Python"], "status": "active" },
  { "label": "RSpec", "subcategory": "framework", "dependsOn": ["Ruby"], "status": "active" },
  { "label": "Mockito", "subcategory": "framework", "dependsOn": ["Java"], "status": "active" }
]
```

---

#### Databases (52)

```json
[
  // ── Relational ──────────────────────────────────────────────────────────
  { "label": "PostgreSQL", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "MySQL", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "MariaDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "SQLite", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Oracle DB", "subcategory": "database", "dependsOn": [], "status": "active" },
  {
    "label": "Microsoft SQL Server",
    "subcategory": "database",
    "dependsOn": [],
    "status": "active"
  },
  { "label": "CockroachDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "PlanetScale", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "YugabyteDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "TiDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Cloud Spanner", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── NoSQL — Document ─────────────────────────────────────────────────────
  { "label": "MongoDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Firestore", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "CouchDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "RavenDB", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── NoSQL — Key-Value ────────────────────────────────────────────────────
  { "label": "Redis", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Memcached", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "DynamoDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "etcd", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── NoSQL — Wide Column ──────────────────────────────────────────────────
  { "label": "Cassandra", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "HBase", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "ScyllaDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Bigtable", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── Search ───────────────────────────────────────────────────────────────
  { "label": "Elasticsearch", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "OpenSearch", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Solr", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Algolia", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Typesense", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Meilisearch", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── Time Series ──────────────────────────────────────────────────────────
  { "label": "InfluxDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "TimescaleDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "VictoriaMetrics", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "QuestDB", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── Graph ────────────────────────────────────────────────────────────────
  { "label": "Neo4j", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Amazon Neptune", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "ArangoDB", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "TigerGraph", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── Data Warehouse ───────────────────────────────────────────────────────
  { "label": "Snowflake", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "BigQuery", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Amazon Redshift", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Azure Synapse", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "ClickHouse", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Databricks", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Apache Hive", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Apache Iceberg", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Delta Lake", "subcategory": "database", "dependsOn": [], "status": "active" },

  // ── Vector ───────────────────────────────────────────────────────────────
  { "label": "Pinecone", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Weaviate", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Qdrant", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Chroma", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "pgvector", "subcategory": "database", "dependsOn": [], "status": "active" },
  { "label": "Milvus", "subcategory": "database", "dependsOn": [], "status": "active" }
]
```

---

#### Cloud (48)

```json
[
  // ── Platform ─────────────────────────────────────────────────────────────
  { "label": "AWS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "GCP", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Cloudflare", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "DigitalOcean", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Vercel", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Netlify", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Fly.io", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Railway", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Heroku", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Linode", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "OVHcloud", "subcategory": "cloud", "dependsOn": [], "status": "active" },

  // ── AWS Services ─────────────────────────────────────────────────────────
  { "label": "AWS Lambda", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "EC2", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "S3", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "ECS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "EKS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "CloudFormation", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "AWS CDK", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "API Gateway", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "CloudFront", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "SQS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "SNS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Kinesis", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "SageMaker", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "AWS Bedrock", "subcategory": "cloud", "dependsOn": [], "status": "active" },

  // ── GCP Services ─────────────────────────────────────────────────────────
  { "label": "Cloud Run", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "GKE", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Cloud Functions", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Pub/Sub", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Vertex AI", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Firebase", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Dataflow", "subcategory": "cloud", "dependsOn": [], "status": "active" },

  // ── Azure Services ───────────────────────────────────────────────────────
  { "label": "Azure Functions", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "AKS", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure DevOps", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure Blob", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure Service Bus", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure OpenAI", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Azure AD", "subcategory": "cloud", "dependsOn": [], "status": "active" },

  // ── Networking / Edge ────────────────────────────────────────────────────
  { "label": "Cloudflare Workers", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Cloudflare R2", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Route 53", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "AWS WAF", "subcategory": "cloud", "dependsOn": [], "status": "active" },

  // ── FinOps / Cost ────────────────────────────────────────────────────────
  { "label": "AWS Cost Explorer", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "Spot Instances", "subcategory": "cloud", "dependsOn": [], "status": "active" },
  { "label": "FinOps", "subcategory": "cloud", "dependsOn": [], "status": "active" }
]
```

---

#### DevOps (55)

```json
[
  // ── Containers & Orchestration ───────────────────────────────────────────
  { "label": "Docker", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Kubernetes", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Helm", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Kustomize", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Podman", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Docker Compose", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "containerd", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Rancher", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "OpenShift", "subcategory": "devops", "dependsOn": [], "status": "active" },

  // ── CI/CD ────────────────────────────────────────────────────────────────
  { "label": "GitHub Actions", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "GitLab CI", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Jenkins", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "CircleCI", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "ArgoCD", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Flux", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Tekton", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Buildkite", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Travis CI", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "TeamCity", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Drone CI", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Spinnaker", "subcategory": "devops", "dependsOn": [], "status": "active" },

  // ── Infrastructure as Code ───────────────────────────────────────────────
  { "label": "Terraform", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "OpenTofu", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Pulumi", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Ansible", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Chef", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Puppet", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Crossplane", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Packer", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Vagrant", "subcategory": "devops", "dependsOn": [], "status": "legacy" },

  // ── Observability & Monitoring ───────────────────────────────────────────
  { "label": "Prometheus", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Grafana", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Datadog", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "New Relic", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Dynatrace", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Jaeger", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Zipkin", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "OpenTelemetry", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Loki", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "ELK Stack", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Splunk", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "PagerDuty", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "VictoriaMetrics", "subcategory": "devops", "dependsOn": [], "status": "active" },

  // ── Service Mesh & Networking ────────────────────────────────────────────
  { "label": "Istio", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Envoy", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Linkerd", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Consul", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Traefik", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Nginx", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "HAProxy", "subcategory": "devops", "dependsOn": [], "status": "active" },

  // ── Security / DevSecOps ─────────────────────────────────────────────────
  { "label": "HashiCorp Vault", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Snyk", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "SonarQube", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Trivy", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Falco", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "OPA", "subcategory": "devops", "dependsOn": [], "status": "active" },
  { "label": "Checkov", "subcategory": "devops", "dependsOn": [], "status": "active" }
]
```

---

#### Misc (50)

```json
[
  // ── Architecture & Design ─────────────────────────────────────────────────
  { "label": "System Design", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "HLD", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "LLD", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "DSA", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Microservices", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Distributed Systems", "subcategory": "misc", "dependsOn": [], "status": "active" },
  {
    "label": "Event-Driven Architecture",
    "subcategory": "misc",
    "dependsOn": [],
    "status": "active"
  },
  { "label": "Domain-Driven Design", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "CQRS", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Event Sourcing", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Clean Architecture", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Hexagonal Architecture", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Monorepo", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Design Patterns", "subcategory": "misc", "dependsOn": [], "status": "active" },

  // ── APIs & Protocols ──────────────────────────────────────────────────────
  { "label": "REST APIs", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "GraphQL", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "gRPC", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "WebSockets", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "WebRTC", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "OpenAPI / Swagger", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Webhooks", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Message Queues", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Apache Kafka", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "RabbitMQ", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "NATS", "subcategory": "misc", "dependsOn": [], "status": "active" },

  // ── Security ─────────────────────────────────────────────────────────────
  { "label": "OAuth 2.0", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "JWT", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "SAML", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Zero Trust Security", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "OWASP", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Penetration Testing", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "PKI / TLS", "subcategory": "misc", "dependsOn": [], "status": "active" },

  // ── AI / ML Concepts ─────────────────────────────────────────────────────
  { "label": "Machine Learning", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Deep Learning", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "NLP", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Computer Vision", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Generative AI", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "LLM Fine-tuning", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Prompt Engineering", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "RAG", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "MLOps", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "DataOps", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Reinforcement Learning", "subcategory": "misc", "dependsOn": [], "status": "active" },

  // ── Engineering Practices ─────────────────────────────────────────────────
  { "label": "TDD", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "BDD", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Code Review", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Pair Programming", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Agile", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Scrum", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Kanban", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Technical Leadership", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "OOP", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Functional Programming", "subcategory": "misc", "dependsOn": [], "status": "active" },

  // ── Emerging / Specialised ────────────────────────────────────────────────
  { "label": "Blockchain", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Smart Contracts", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Web3", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Embedded Systems", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "FPGA", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "Game Development", "subcategory": "misc", "dependsOn": [], "status": "active" },
  { "label": "AR / VR", "subcategory": "misc", "dependsOn": [], "status": "active" }
]
```

---

**Taxonomy summary**

| Subcategory | Count   | Notes                                                                   |
| ----------- | ------- | ----------------------------------------------------------------------- |
| Language    | 35      | Includes 2 legacy (COBOL, Fortran)                                      |
| Framework   | 70      | All carry `dependsOn`; includes 2 legacy (Xamarin, Backbone)            |
| Database    | 52      | Covers relational, NoSQL, search, time-series, graph, warehouse, vector |
| Cloud       | 48      | Platform-level + major managed services for AWS, GCP, Azure             |
| DevOps      | 55      | Containers, CI/CD, IaC, observability, service mesh, DevSecOps          |
| Misc        | 50      | Architecture, APIs, security, AI/ML concepts, engineering practices     |
| **Total**   | **310** |                                                                         |

**B. Stakeholders**

- Recruiting Ops: taxonomy ownership, template governance, rollout sign-off.
- Engineering: build, parser, platform renderers.
- Design: UX, component library.
- Recruiting Leadership: success metric targets, pilot recruiter selection.

---
