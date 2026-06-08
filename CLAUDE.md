# Atto Generation — project handoff / context

A live, **event-driven prototype** of Testsigma's **"Atto"** agentic test-generation UX. It replays
scripted agent event streams through a tiered rendering pipeline so the whole "generate test cases from
a prompt" flow (analysis → plan → scenarios → test cases) feels like a real AI-native product
(Claude / ChatGPT / v0 / Lovable style). It also ships a second screen — a **/catalog** living-spec
page documenting how every wire event renders.

This file is the single source of truth for a new session. Read it before changing anything.

---

## Run it
```bash
npm run dev        # http://localhost:5173/  (prototype)  ·  http://localhost:5173/catalog (catalog)
npm run build      # tsc -b && vite build   — keep this green
npx tsc -b         # typecheck only
```
- Stack: **Vite 8 + React 19 + TypeScript**, design system **`@testsigmainc/ui-atoms` 0.3.3**, motion
  via **framer-motion** (the ONLY app dependency added beyond ui-atoms/react/lottie). No router lib.
- **Do NOT** add a UI library, redefine design tokens, or scaffold a new app. Reuse `ui-atoms` +
  the theme tokens in `src/prototype/theme.ts` and the existing components.

## Verifying visually (important — there are no unit tests)
The repo has **no test suite**; we verify by driving the running app with **puppeteer-core + the
installed Google Chrome** and screenshotting. `puppeteer-core` is installed `--no-save` (present in
`node_modules`, NOT in `package.json` — don't "fix" that). Pattern used all session:
```bash
npm install --no-save puppeteer-core@23      # only if missing
# write a script to /tmp/*.mjs that imports puppeteer-core by absolute path,
# launches executablePath '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
# clicks through the flow, and screenshots to /tmp/atto-shots/*.png, then Read the PNGs.
```
Always `tsc -b` + `npm run build` after changes; both must pass.

---

## Architecture — the core idea (don't break this)
The UI is **event-driven, not free-text**. Four pieces, in `src/prototype/`:

1. **Typed event model** — `events/types.ts` (`AgentEvent`, `Tier`, `RenderIntent`, `MurmurSegment`).
2. **Pure router** — `events/router.ts` `routeEvent(e): RenderIntent`. Maps EVERY event to exactly one
   of 5 tiers: **Suppress / Murmur / Milestone / Outcome / Chat** (+ Conditional cases). Encodes the
   Murmur priority lattice (0 stall-pin → 7 reasoning). `events/normalize.ts` backfills legacy frames
   and holds `SUPPRESS_TYPES`.
3. **Virtual-clock engine** — `events/engine.ts` `useEventEngine(scenario, onEmit)` — play / pause /
   restart / step / speed. Emits normalized events on a rAF clock. `__pause__` events pause the run at
   gates; `__layout__` flips to two-pane.
4. **Murmur controller** — `murmur/controller.ts` — the ONE arbitrated status line. Holds channels
   `[ACTION · DETAIL · THOUGHT]`, decays by TTL, handles fan-out strip + stall pin, throttled
   `aria-live`. Rendered by `murmur/MurmurLine.tsx`.

**Scenarios** are scripted `AgentEvent[]` in `events/scenarios.ts`. The default `taa-default` reproduces
the whole flow; others (CAA coverage, TPA fan-out, SCA, gate-question, failure) are demo variants.

### The 5 tiers → components (`src/prototype/tiers/` + `components/`)
- **Suppress** — hidden (dev-only): token_usage, context_saved, inbound tickets, replay_complete, etc.
- **Murmur** — `MurmurLine` — single transparent line: Atto avatar + **shimmering** primary text +
  supporting segments + elapsed timer + a chevron (far right) that expands to reasoning.
- **Milestone** — `tiers/MilestoneSpine.tsx` (`MilestoneGroupView`) + `components/TimelineRail.tsx` —
  collapsible accordion groups, each a vertical timeline of **settled** steps with a **lucide icon**
  (icon map shared from `catalog/icons.ts`). Failures render as an error step.
- **Outcome** — `OutcomeCard` (collapsible), `PlanApprovalCard`, `ScenarioReviewCard`, `TestCaseTable`,
  `Visualization` (DonutChart), gaps/close cards.
- **Chat** — `tiers/ChatBubble.tsx` — `user` = right-aligned white bubble; `assistant`/`system` =
  left, primary-color agent text.

---

## The app shell + state (`PrototypeApp.tsx`)
`App.tsx` is a tiny dependency-free router: `pathname` starts with `/catalog` → `<CatalogPage/>`,
else `<PrototypeApp/>`. `AppShell` (left nav rail, topbar, secure footer, `GradientField` background).

`PrototypeApp` holds a `useReducer` `UiState`. Key fields:
- `groups: MilestoneGroup[]` + `activeGroupId` — phase groups keyed `g_plan` / `g_scn` / `g_tc` (see
  `GID`, `GROUP_META`). Running work lives on the murmur line and **settles** into the active group's
  timeline on completion (tool_completed / sub_agent_completed / validation_completed). `addStep`,
  `ensureGroup`, `patchGroup` helpers.
- `timeline: TimelineEntry[]` — **unified chronological log** of chat bubbles + groups in the order they
  appeared. The thread renders by walking this, so it reads as a real back-and-forth (agent message →
  user reply bubble → events → …), NOT chat-on-top + activity-below.
- `plan` / `planShown` / `planProceeded`, `scenarios` / `scenariosProceeded`, `testCases`,
  `generating {active,percent}`, `validating`, `runComplete`, `twoPane`, `gate`, `chat`, `viz`, `failed`.

### Flow the default scenario produces
1. **Hero** (`HeroState`) — centered prompt + ui-atoms `Button variant="ai"` "Generate with AI".
2. **Disambiguation upfront** — agent asks a scope question (logged as a left chat message **with its
   options listed** as an audit trail) → run pauses → user picks an option in the composer gate → the
   pick logs as a **right-aligned bubble** → ack message → analysis begins.
3. **Analysis** — murmur line (shimmer) + tools/skills settle into the **"Orchestrated a Generation
   Plan"** group ending in a Done step.
4. **Plan gate** — `PlanApprovalCard` (persistent, with a per-step **loader**: ✓ done / ⟳ active /
   idle, driven by `planStatuses` from `validating`/`generating`/proceed flags) + a Proceed/Modify
   gate. User Proceeds (logged as a bubble).
5. **Scenario generation** — `g_scn` phase (App Explorer sub-agent, validation), 15 `scenario_saved`
   stream into `ScenarioReviewCard` (numbered list + category pills). Scenarios gate → Proceed.
6. **Two-pane** (`__layout__`) — `TwoPaneShell` docks the chat to a **~32% left rail** and opens the
   **~68% right work panel** (`RightWorkPanel`). Cards collapse in the rail.
7. **Test-case generation** — **names-first**: a `test_cases_planned` event seeds ALL ~42 rows in a
   **loading state** (spinner in the priority slot); each `test_case_saved` flips one row to its final
   priority icon. `TestCaseTable` = tabs (All/Pending/Accepted/Rejected) + collapsible scenario groups
   + accept/reject + density rules.
8. **Complete** — `summary_generated`/`session_completed` → all groups collapse, feedback row.

### Skills
`skill_loaded` events render as 🪄 (Wand2) milestone steps. The skills catalog is in
`catalog/skills.ts` (from `skills-of-agents.md`); TAA sends only `skill_name` on the wire so the UI
enriches the step with the skill's purpose via `skillDescription()`.

---

## Demo harness
Not a top bar — a floating **"⚙ Demo"** button (bottom-right) opens a panel with the scenario switcher
+ playback transport (`ScenarioPicker`, `TransportBar`). Next to it is an **"Event catalog"** pill
(same ui-atoms `Button variant="ai"` gradient) linking to `/catalog`. See `components/DemoControls.tsx`.

## Screen 2 — `/catalog` (event render catalog)
A Storybook-style living spec showing all **133 events** from `tier-decision-doc.html`'s ledger,
each rendered with the REAL tier component. Files in `src/prototype/catalog/`:
- `ledger.ts` — auto-generated from the `const D=[…]` block of `tier-decision-doc.html`.
- `catalogData.ts` — derives `CatalogEntry[]` (tier, group_type, lifecycle, flags).
- `icons.ts` — single source of truth for lucide icons (shared with `TimelineRail`).
- `payloads.ts` — sample envelopes (generic + hand-authored hard cases).
- `EventPreview.tsx` — renders the real component per event (Suppress chip, Murmur line + canonical
  states, Milestone w/ icon, Outcome via InputGate/ScenarioReviewCard/TestCaseTable/DonutChart/etc.,
  Chat bubble, Conditional = both branches, skill_loaded = loaded skill + agent's skill list).
- `CatalogPage.tsx` + `catalog.css` — left filterable index (tier→agent, search, flags), right detail
  (live preview + Full/Rail width toggle + animate toggle + payload JSON + metadata chips + handling
  notes). Permalink via hash `#agent:event`.

---

## Gotchas / decisions made (read before "fixing" these)
- **ui-atoms `Button variant="ai"`**: the gradient relies on Tailwind utilities
  (`from-ai-gradient-from`/`to-ai-gradient-to`) that are **NOT shipped in ui-atoms' CSS**, and this app
  does **not run Tailwind**. So we paint the gradient ourselves in `styles.css` via
  `.from-ai-gradient-from { background-image: linear-gradient(135deg, hsl(var(--ai-gradient-from)), hsl(var(--ai-gradient-to))) !important }`.
  Any ai button (Generate, Send, Event catalog) gets its color from THIS rule, not a custom gradient.
- **Shimmer**: we do NOT use ui-atoms `ShimmerText` (it overlays a rectangular sheen box). The murmur
  uses a CSS text-clipped shimmer `.proto-shimmer` (`background-clip:text` + a tiling gradient so no
  glyphs are left transparent / cut).
- **GradientField** (`components/GradientField.tsx`): subtle conic of the **ai colors**, low opacity,
  heavy blur. Animates (rotate + pulse) ONLY while `runState === 'playing'`; calms to static when Atto
  needs input, is complete, or under reduced motion. Driven by `AppShell gradientActive={runState==='playing'}`.
- **Two-pane**: chat collapses to a ~32% rail (NOT fully hidden) and the test-case panel is prominent.
  (An earlier full-collapse + breadcrumb back-icon was reverted per feedback.)
- **Accordion milestones**: the last/most-recent group is expanded; finished groups collapse; all
  collapse on `runComplete`. Persistent plan/scenarios cards collapse in the rail / after approval.
- **Auto-scroll**: on gate open / new content the thread scrolls to bottom (immediate + 200ms + 420ms)
  so the input card lands just above the (expanding) composer. Composer/gate expand via animated height.
- **Reduced motion**: global CSS rule freezes animations; framer respects `<MotionConfig reducedMotion="user">`.
- **Reference docs** in repo root: `tier-decision-doc.html` (authoritative event→tier ledger + lattice),
  `event-payloads.md` (payload shapes), `skills-of-agents.md` (skills), `prompt-1-live-prototype.md` /
  `prompt-2-event-catalog.md` (original build briefs), `events-structure.md`, `agentic-event-map.md`.

## Where things live (quick map)
```
src/App.tsx                      path router (/catalog vs prototype)
src/prototype/PrototypeApp.tsx   reducer + state + ThreadView + RightWorkPanel + flow wiring
src/prototype/events/*           types, normalize, router, engine, scenarios (default = taa-default)
src/prototype/murmur/*           controller (arbitration) + MurmurLine
src/prototype/tiers/*            ChatBubble, MilestoneSpine, OutcomeCard, PlanApprovalCard,
                                 ScenarioReviewCard, TestCaseTable, InputGate, Visualization, FeedbackRow
src/prototype/components/*       AppShell, Composer, DemoControls, GradientField, TimelineRail,
                                 AvatarRobot, Breadcrumb, PriorityIcon, CategoryPill, ...
src/prototype/layout/TwoPaneShell.tsx   single ↔ two-pane (32/68) layout
src/prototype/catalog/*          Screen 2 (/catalog)
src/prototype/theme.ts           palette / gradient / radius / type tokens (mirrors ui-atoms vars)
src/prototype/styles.css         all prototype CSS (proto-* classes)
```
