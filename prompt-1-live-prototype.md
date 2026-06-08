# Prompt 1 — Screen 1: Live event-driven prototype

> **How to use:** Open Claude Code **inside your existing React repo** (so it can read your design
> system + tailwind config). **REQUIRED: paste your 10 Figma links into the `‹FIGMA LINK …›`
> placeholders below AND attach the 10 reference screenshots (S1–S10) — they are the design this must
> match exactly.** Attach `tier-decision-doc.html` and `event-payloads.md` to the session, and keep
> the Figma MCP connected. Then paste this whole file. Run this **before** Prompt 2. Recommended
> model: Opus.

---

# CONTEXT — Agentic-Test conversational UX

You are building a high-fidelity React prototype for the activity stream of a family of QA AI
agents (TAA, CAA, RAA, TPA-v1/v2, SCA, PR-TAA). The agents stream ~133 websocket/SSE events. The
agents are FIXED — we only build the frontend. A full tier-decision spec is attached as
`tier-decision-doc.html`; **read it first and treat it as the source of truth** (it contains the
complete event ledger, the tier rules, the Murmur arbitration model, the density model, and the
resolved design problems).

## Project & stack — IMPORTANT: this is an EXISTING repo
This drops into my existing React project. **My design system, theme tokens, and Tailwind
variables all come from `ui-atoms`** — import components and tokens from there.
- Do **NOT** scaffold a new app. Do **NOT** create a new Tailwind theme or redefine tokens. Do
  **NOT** install another component/UI library. **Reuse the `ui-atoms` components and the `ui-atoms`
  theme tokens/variables** for every color, spacing, radius, typography, and primitive.
- **FIRST, before writing any code, inventory `ui-atoms`:** list the available components, the theme
  tokens / Tailwind variables it exposes, and how they're imported. Also note the repo's routing
  setup and 2–3 representative existing screens for conventions (folder layout, naming, styling
  approach, TS patterns). **Report back what `ui-atoms` provides and which components/tokens you'll
  reuse, before building.** Only build a new component when `ui-atoms` has no suitable primitive —
  and when you do, build it from `ui-atoms` tokens and flag it to me.
- The only new dependency you may add is `framer-motion` (check if it's already installed first).
- Stack: React + TypeScript + Tailwind + Framer Motion, built on `ui-atoms` tokens and components.

## Design grounding (do this after the repo inventory) — MATCH THESE 5 SCREENS EXACTLY
The product is **"Atto's Generator Agent"** (Testsigma). There are 5 designed states. **Reproduce
them exactly** — do not redesign, restyle, "improve", or approximate. Pull each via the Figma MCP
(`get_design_context`, `get_screenshot`, `get_variable_defs`) and follow the `/figma-use` skill. I
have also attached the 5 reference screenshots — use them as the visual ground truth alongside Figma.
- S1 · Initial chat (prompt box centered): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-48984&t=crqDs2GB0cUzjYc5-11
- S2 · Generating, murmur collapsed (chevron): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-49718&t=crqDs2GB0cUzjYc5-11
- S3 · Murmur expanded (short description): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-52938&t=crqDs2GB0cUzjYc5-11
- S4 · Milestones expanded (timeline): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-52673&t=crqDs2GB0cUzjYc5-11
- S5 · Generation Plan approval: https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-50642&t=crqDs2GB0cUzjYc5-11
- S6 · Generated test scenarios (review): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-51701&t=crqDs2GB0cUzjYc5-11
- S7 · Scenarios review w/ Proceed (scrolled): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-52010&t=crqDs2GB0cUzjYc5-11
- S8 · Two-pane: generating test cases (1%): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-53886&t=crqDs2GB0cUzjYc5-11
- S9 · Two-pane: test-case review table: https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-54249&t=crqDs2GB0cUzjYc5-11
- S10 · Generation complete (42 cases): https://www.figma.com/design/xpA0HXayKLjBNECLki5Clu/Atto-2.0---TMS?node-id=2147-55087&t=crqDs2GB0cUzjYc5-11

Exact-match rules:
- **Pixel-faithful**: layout, spacing, sizing, alignment, type (family/size/weight/line-height/
  letter-spacing), color, radius, borders, shadows, icons, and every visual state.
- These screens are built from my design system, so **match = use `ui-atoms`**: bind each value to the
  corresponding `ui-atoms` token/component (don't hand-pick hex/px when a token exists, don't
  duplicate a component `ui-atoms` already has). Figma/screenshots are the visual target; `ui-atoms`
  is how you implement it.
- If something has **no** matching `ui-atoms` token/component, do NOT invent a look — stop and ask me
  (or flag it and pick the closest token), rather than guessing.
- After building, **compare your render side-by-side against `get_screenshot` + the screenshots** and
  fix any drift before showing me. Report anything you couldn't match 1:1 and why.

### App shell (present on every screen)
- **Left icon nav rail** (~80px, light): Testsigma logo top; stack of section icons with the **Atto
  agent face** icon active (dark-teal rounded square); bottom group = settings gear, kebab, user
  avatar ("H"). Reuse my existing app shell/nav if one exists — don't rebuild it.
- Top-left **"← Atto's Home"** pill (white, rounded, subtle border/shadow).
- **Background:** soft gradient wash — lavender/periwinkle top → warm peach/cream lower-left — with a
  subtle film-grain noise texture. Same across all states.
- **Secure footer** centered: green shield-check + "Your data is secure and never used for AI training".
- **Bottom composer** (S2–S5): rounded-2xl box, pink→purple gradient border, placeholder "Reply…",
  a row "Add Context:" + chips (Jira Requirements, Confluence, Figma, "+"). Right-side action toggles
  by state: a red **Stop** square while generating (S2/S3), a gradient **"Send →"** when idle/awaiting
  (S4/S5).

### Screen-by-screen spec + tier mapping
- **S1 — Initial (CHAT / empty):** centered column. Glossy 3D robot avatar; H1 "What would you like
  to test?"; gray sub-paragraph with bold spans ("additional context", "requirements", "Figma
  designs"); large prompt **textarea** (gradient border) containing a "Don't read test library
  (Faster Generation)" checkbox, the "Add Context:" chips, and a gradient **"Generate with AI"**
  button (bottom-right, looks disabled until there's input).
- **S2 — Murmur collapsed (MURMUR):** the submitted prompt becomes a **user-prompt card pinned
  top-right** (context chips with count badges e.g. "Jira Requirements 3", "Figma 2" + the prompt
  text). Main area shows ONE agent status line: small agent-face icon + bold text ("Analyzing prompt
  and context") + a **chevron ›** (collapsed). Far right of that row: **elapsed timer** (hourglass +
  `00:00:02`, tabular). Apply **ShimmerText** to the status text while it's the live murmur.
- **S3 — Murmur expanded (MURMUR + reasoning):** clicking the chevron rotates it to **⌄** and reveals
  a short reasoning **description** under the title (e.g. "The user wants test cases for account
  creation via Google OAuth. This is a focused request…"). This is the murmur's current
  reasoning/summary, shown on demand.
- **S4 — Milestones expanded (MILESTONE spine):** as steps settle, the murmur statuses roll up into a
  collapsible group headed **"Orchestrated a Generation Plan"** (+ chevron, + elapsed timer). Below it,
  a **vertical timeline**: each step = a small outline icon on a connecting rail + **bold title** +
  gray **description** (Analyzing prompt and context · Checking project memory and test library ·
  Identifying requirements to cover · Building generation plan), ending in a **"Done"** check row.
  This is the Milestone tier: collapsed by default to the header, expandable to the timeline.
- **S5 — Generation Plan approval (OUTCOME gate):** a persistent **"Generation Plan" card** — title,
  "Review the plan below. You can edit the plan via replying in chat or proceed to start generating.",
  a list of plan steps each with a leading icon (search-list / sparkle) connected by short dashes, and
  a gradient **"Proceed →"** button bottom-right. This is a human-in-the-loop GATE: the user either
  replies in the composer to edit, or clicks Proceed to continue. The "Orchestrated a Generation Plan"
  milestone group sits collapsed above it. **Adapts at narrow widths — see the Responsive section.**
- **S6/S7 — Scenarios review (OUTCOME gate #2):** after Proceed on the plan, a persistent card headed
  **"N scenarios generated"** (e.g. "15 scenarios generated") + "Review the scenarios below. Edit, add,
  or remove any scenario by replying in chat before generating detailed test cases." Then a **numbered
  list** of scenarios; each row = number + title + a right-aligned **category tag pill**, color-coded:
  **Happy Path** (green), **Error handling** (orange; security-critical ones red), **Data handling**
  (blue), **Edge case** (purple). Bottom-right **"Proceed →"**; the user can reply to edit/add/remove.
  (S7 is the same card scrolled to the end with Proceed visible.) **At narrow widths this reflows to a
  grouped-by-category layout — see the Responsive section.**
- **S8 — Proceed → the layout SPLITS into two panes + generation progress:** clicking Proceed on the
  scenarios collapses the whole conversation into a **narrow left rail (~32%)** and opens a **right
  work-panel (~68%)**.
  - **Left rail = the settled thread:** the pinned prompt, then each completed phase as a collapsible
    entry with a **chevron + elapsed timer** — "Orchestrated a Generation Plan ›", the Generation Plan
    card with a settled **Proceed** pill, "15 Scenarios generated ›" with a settled **Proceed** pill,
    "Generating Test Cases ›". Composer pinned at the rail bottom (Reply… + "+" + red **Stop**).
  - **Right panel:** a breadcrumb (Atto's Home › Sprints › Sprint #42 › …), the centered robot avatar,
    **"Generating Test Cases"**, and a **progress bar with %** (e.g. 1%).
- **S9 — Right panel: test-case review table (streaming in):** breadcrumb + feature **title**
  ("User authentication") + meta row (⬡ N Figma files · ◆ N Jira Stories). **Tabs:** All Test Cases (n)
  · Pending (n) · Accepted (0) · Rejected (0). **Collapsible groups** (by scenario/feature), each with
  a count badge, first one expanded. **Test-case rows** stream in as Pending: status/priority icon +
  title + **New/Update** badge + steps/template icon + (right) module link + `test_type` + link icon +
  **status pill "● Pending"**. This IS the **Outcome tier at scale** — apply the density rules
  (grouping, collapse-past-N, tabs, bulk accept) from `tier-decision-doc.html`.
- **S10 — Generation complete:** left rail shows **"Generated 42 Test Cases ›"** (timer) with a feedback
  row — 👍 👎 · ↻ Retry · 💬 Give Feedback — and the composer returns to **"Send →"** (idle). Right-panel
  rows now render **priority icons** (P0/P1 → red up-arrows, P2 → amber "=", lower → down) and stay in
  the Pending/Accepted/Rejected accept-reject workflow (tabs update counts as the user triages).

### Two-pane transform (important behaviour)
Up to and including S5–S7 the conversation is **single-column, centered**. The moment the user Proceeds
from the **scenarios** gate (S7→S8), animate the transform to the **two-pane** layout: thread shrinks/docks
to the left rail, right work-panel slides in. From then on (S8–S10) the chat lives in the left rail and
all generated artifacts live in the right panel. Build this as a layout state, not two separate screens.

### Responsive / adaptive layout — Plan & Scenarios cards (REQUIRED, container-query driven)
The Generation Plan and Scenarios cards appear BOTH in the wide centered column (S5–S7) AND in the
~32% left rail after the split (S8–S10) — and the chat window itself can be narrow. The current wide
designs don't fit a narrow width, so make each card respond to its **container width** using CSS
**container queries** (`@container`), NOT the viewport — the squeeze comes from the layout, not the
browser size. One component per card, two layouts, switching at a **~520px** container breakpoint
(treat the rail, ~300–360px, as the narrow end). Build and verify BOTH layouts at ~320px and ~760px.

**Generation Plan card**
- Wide (≥520px): current S5 design — icon + single-line step, vertical connector, "Proceed →" floated
  bottom-right.
- Narrow (<520px): step text **wraps to ≤2 lines** (line-clamp; ellipsis only past 2 lines — never the
  mid-word truncation seen in the rail mock), tighter vertical rhythm + smaller type, and **"Proceed →"
  goes full-width** at the bottom. In the rail the whole card is **collapsible** (header "Generation
  Plan ›" + chevron) and sits collapsed once settled.

**Scenarios review card — reflow to GROUP-BY-CATEGORY when narrow**
- Wide (≥520px): current S6/S7 design — "N scenarios generated" + a flat **numbered list**, each row =
  number + title + a right-aligned **category tag pill**; "Proceed →" bottom-right.
- Narrow (<520px): reflow to grouped-by-category (the per-row right pill has no room):
  - a **summary chip row** at top — "3 Happy · 6 Error · 2 Data · 4 Edge";
  - **collapsible category sections**, each header = category **color + label + count** (e.g. "Error
    handling (6)"), first section expanded, rest collapsed;
  - inside a section: rows = **number + title that wraps** (no right pill — the header carries the
    category);
  - **"Proceed →" full-width** at the bottom.
  ```
  ┌ 15 scenarios generated ───────┐
  │ 3 Happy·6 Error·2 Data·4 Edge │
  │ ▾ Happy Path             (3)  │
  │   1 Successful account        │
  │     creation via Google OAuth │
  │   2 Account creation with …   │
  │ ▸ Error handling         (6)  │
  │ ▸ Data handling          (2)  │
  │ ▸ Edge case              (4)  │
  │ [        Proceed →         ]  │
  └───────────────────────────────┘
  ```
- Both cards keep identical semantics at every width (reply-to-edit + Proceed; nothing is removed, only
  reflowed) and keep category colors consistent (Happy=green · Error=orange, security→red · Data=blue ·
  Edge=purple). Verify against Figma + screenshots at both widths.

### How the states connect (this IS the default scenario for Screen 1)
S1 (type prompt → Generate with AI) → S2 (prompt pins top-right; "Analyzing prompt and context" murmur
streaming, timer) → S3 (expand murmur to read reasoning) → S4 ("Orchestrated a Generation Plan" timeline
settles, ending "Done") → S5 (Generation Plan approval card; Proceed) → S6/S7 ("15 scenarios generated"
review card with category tags; Proceed) → **S8 (layout splits to two panes; right panel "Generating
Test Cases" progress)** → S9 (test cases stream into the grouped, tabbed review table as Pending) → S10
("Generated 42 Test Cases" complete; feedback row; priority icons; accept/reject triage). Build the live
engine so playing the default scenario walks through exactly these states, including the two-pane split.

## The five display tiers
- **SUPPRESS** — hidden / dev-only (token_usage, context_saved, inbound routing).
- **MURMUR** — ONE live breathing line, replaced in place (see arbitration below).
- **MILESTONE** — a glanceable, collapsible step spine; failures are a card STATE, not a new lane.
- **OUTCOME** — persistent, actionable cards + accept/reject gates (saved artifacts, charts, questions).
- **CHAT** — conversation bubbles (message, user_message, dev_context, welcome).

## Murmur arbitration (critical — many feeders, ONE slot)
Render Murmur as ONE line with up to three fixed segments: **`[ACTION] · [DETAIL] · [THOUGHT]`**.
A feeder may only occupy its assigned segment, so a thought can NEVER overwrite a live action.
Priority lattice:
```
0  Stall pin (same key ≥3×)        → banner ABOVE the line; does not compete for the slot
1  Parallel fan-out strip (≥2 open)→ owns ACTION as an "N of M" worker strip
2  Tool-open (tool_started/start)  → ACTION  (hold 8s soft / 20s hard, clear on settle)
3  Determinate sub-progress        → ACTION  (sub_agent_progress w/ step_number → progress bar)
4  Indeterminate progress          → DETAIL  (4s)
5  Validation iteration            → DETAIL  (5s)
6  Legacy/structural ticks         → DETAIL  (legacy phase, *_auto_progress, tier_view_built,
                                              ladder_rung_committed; rate-limit ≤1 / 1.5s)
7  reasoning                       → THOUGHT (6s; dimmed/italic; first dropped on overflow)
```
Each channel decays after its TTL; when none are live, the line clears. The announced node is
`aria-live="polite"`, `aria-atomic`, throttled to ≤1 announcement / 1.5s (most-important segment only).

## Outcome density (cards can flood — a regression run emits 14+)
Summary-first: a pinned summary banner with a triage CTA + reviewed meter ("0 / 14 reviewed").
Nest test_case cards under their scenario group. Collapse groups past **3** (only active/first open),
collapse cards within a group past **5** (a "+N more" chip), hard ceiling **50** → header-only. Stream
live into an accumulating group counter with a rolling window of the last 3 (no scroll-yank; show a
"↓ N new" pill instead). Acceptance = **review-then-bulk-accept** (nothing auto-accepts): Accept all /
Accept all P0-P1 / Review NEW only / per-scenario / per-card override. Reconcile out-of-band
`acceptance_status_updated` by `test_case_id`. Failures = assertive announce, traceback hidden.

## Input gates (agent asks for input) — TWO patterns, both pause the run
1. **Plan / approval gate — MATCH SCREEN S5 exactly.** When the agent presents a plan or asks for
   approval (e.g. the "Generation Plan" card), render the persistent **Outcome card** with the plan
   list + a gradient **"Proceed →"** button, and the line "You can edit the plan via replying in chat
   or proceed to start generating." The user proceeds via the button OR edits by typing in the
   existing bottom composer. Do NOT replace this with the expanding-composer pattern.
2. **Discrete-option question gate — Claude-style (no dedicated screen yet, so build it in this
   product's visual language).** For `question_asked` (`{id,label}` options) and legacy `question`
   (bare-string options): the **bottom composer expands** — the question text appears above it with a
   few **recommended option chips/buttons** (staggered entrance), an **"Other…"** chip that opens an
   inline free-text field, and a ghost **"Skip"** button. Use the same chip / gradient-border styling
   as the composer in S2–S5 so it feels native.
Both: move focus into the gate once, announce the pause assertively, options are real buttons
(label = name, id = submit value); on answer, collapse/resume and emit `question_answered`.

## Motion language (AI-native)
- **ShimmerText:** a soft gradient sheen sweeps across any text that is actively streaming/working
  (~1.6s loop, ease-in-out), stopping the moment that text settles. Use it on the Murmur line and on
  streaming chat tokens. Build the gradient from **`ui-atoms` tokens**, not arbitrary colors.
- **GradientField:** a slow-moving multi-stop background gradient (Gemini-style) that animates ONLY
  while the agent is generating — drifting position / rotating conic, low opacity, behind content. It
  calms to static when the run is idle or complete. Tie its "activity" to whether any agent channel
  is live.
- Plus: card enter/exit (spring, subtle y + opacity), milestone tick check, progress-bar fills, gate
  expand/collapse. Purposeful, never noisy.
- Respect `prefers-reduced-motion` everywhere (gradient + shimmer freeze to a static state).

---

# BUILD — SCREEN 1: Live conversation prototype (event-driven, scenario-based)

Add a new page/route (follow my existing routing — e.g. `/prototype`) that feels like the REAL app
running live: a chat-style conversation window where a stream of agent events drives the UI in real
time, exactly as it would in production.

## What it must do
1. A **scenario picker** with at least these scripted runs, each a realistic ordered event stream
   with timestamps:
   - **Author tests (TAA) — DEFAULT scenario, must reproduce S1→S10 exactly:** user prompt "Generate
     testcases for creating account using Google OAuth" (with Jira×3 + Figma×2 context) → "Analyzing
     prompt and context" murmur (expandable to the reasoning) → milestone timeline "Orchestrated a
     Generation Plan" (Analyzing → Checking project memory and test library → Identifying requirements
     to cover → Building generation plan → Done) → "Generation Plan" approval card (Proceed) →
     "15 scenarios generated" review card with category-tagged scenarios (Proceed) → **layout splits to
     two panes**: right panel "Generating Test Cases" progress → test cases stream into the grouped,
     tabbed review table (Pending) → "Generated 42 Test Cases" complete (feedback row; priority icons;
     accept/reject triage via tabs).
   - **Coverage analysis (CAA):** skill_loaded → gap-detection sub-agent → analysis_saved →
     visualization (donut) → session_complete briefing. Include a generic `event` envelope carrying
     a chart to prove the router surfaces it.
   - **Plan tests (TPA v2):** a PARALLEL fan-out of 3 signal workers → scoring_completed (mini-chart)
     → tier ticks → tms_backfill.
   - **Needs your input (gate):** runs partway, then `question_asked` pauses for the user.
   - **Sprint coverage (SCA):** interleaved TAA + CAA events on one thread (source-tagged) ending in
     two attributed closes + one composed turn cap.
   - **Failure:** a `tool_failed` / `error` mid-run rendered as a card state with retry.
2. **Transport controls:** Play / Pause / Restart / step / speed (0.5×–4×) and a live clock.
3. As events fire, route each through the 5 tiers and render, **using `ui-atoms` components**:
   - **MURMUR:** the single arbitrated line with `[ACTION · DETAIL · THOUGHT]` segments, fan-out
     strip, stall pin, TTL decay — implement the full priority lattice. This is the centrepiece; it
     must visibly NOT thrash.
   - **MILESTONE:** a collapsible step spine; tool-open shows in murmur then SETTLES into a collapsed
     milestone on completion; failures flip to an error card state.
   - **OUTCOME:** persistent cards + gates — the Generation Plan approval (S5), the **scenarios-review
     card** with category tags (S6/S7), and — after the **two-pane split** — the **right-panel test-case
     review table** (tabs All/Pending/Accepted/Rejected, collapsible scenario groups, per-row priority
     icon / module / type / status, bulk accept) following the density rules. Plus the input GATE.
   - **CHAT:** user/assistant bubbles with streaming token shimmer; welcome greeting (deduped).
4. The input GATE must match Claude's UX (composer expands inline with recommended chips + "Other" +
   "Skip", pauses the stream, resumes on answer — emit a `question_answered` to continue the run).
5. Motion: GradientField active while any channel is live and calm when idle; ShimmerText on murmur +
   streaming chat; spring card transitions; reduced-motion fallback.

## Implementation notes
- Define `type AgentEvent` (wire `type`, `group_type`, `lifecycle`, `group_id`, `parent_group_id`,
  `payload`, `source`) and a `useEventEngine(scenario)` hook emitting events on a virtual clock with
  play/pause/seek. Scenarios are data arrays — **pull realistic payloads from `event-payloads.md`**
  (the build-ready superset with a sample for every event; `events-structure.md` is the authoritative
  subset if you need to cross-check a shape).
- A pure `routeEvent(event)` → tier + render-intent; a `MurmurController` holding live channels
  (text, ts, ttl, segment) that recomputes the line each tick.
- Place files following my existing structure/conventions. Reuse `ui-atoms` components and tokens throughout.
- Keep the tier components (`MurmurLine`, `MilestoneSpine`, `OutcomeCard`, `ScenarioGroup`,
  `InputGate`, `ChatBubble`, `ShimmerText`, `GradientField`) **reusable and exported** — Screen 2
  will reuse them.

## Sequence of work
1. Inventory the repo + Figma; report what you'll reuse. 2. Build the event engine + MurmurController
(hardest part). 3. Build the tier renderers from `ui-atoms`. 4. Add motion. 5. Wire the
scenarios + transport controls. Then show me the running page and tell me how to view `/prototype`.
