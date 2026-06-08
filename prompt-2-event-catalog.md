# Prompt 2 — Screen 2: Per-event render catalog (frontend dev reference)

> **How to use:** Run this **in the SAME Claude Code session as Prompt 1** (it reuses the tier
> components Prompt 1 created). Keep `tier-decision-doc.html` and `event-payloads.md` attached.
> Paste this whole file after Screen 1 is built and reviewed. Recommended model: Opus.

---

# CONTEXT — same project as Prompt 1

You already built Screen 1 (the live prototype) in this session, reusing my **`ui-atoms` design
system + theme tokens/variables** and creating reusable tier components (`MurmurLine`, `MilestoneSpine`,
`OutcomeCard`, `ScenarioGroup`, `InputGate`, `ChatBubble`, `ShimmerText`, `GradientField`). The full
event spec is in the attached `tier-decision-doc.html` (the complete ledger of ~133 events, their
tiers, lifecycle, severity, CHANGED/CONTESTED/DEV flags, and per-event handling notes). Sample
payloads for every event are in `event-payloads.md` (the build-ready superset).

**Reuse everything from Screen 1** — the same tier components plus the `ui-atoms` primitives and
`ui-atoms` theme tokens/variables. Do NOT scaffold, do NOT redefine tokens, do NOT add a UI library.
The only new dependency already added is `framer-motion`. Follow my repo's existing structure,
routing, and conventions.

(If you need the tier / Murmur / density / gate / motion rules, they are in `tier-decision-doc.html`
and were summarised in the Prompt 1 spec header — apply them identically here.)

---

# BUILD — SCREEN 2: Event render catalog

Add a new page/route (follow my routing — e.g. `/catalog`) that shows EVERY event and exactly how
the frontend should render it, so my dev team can implement each one without ambiguity. Think
"living spec / Storybook page" built from my design system.

## Layout
- **Left — filterable index** of all events grouped by TIER, then by AGENT (Suppress / Murmur /
  Milestone / Outcome / Chat). Search box + filters (tier, agent, CHANGED, CONTESTED, DEV). Source
  the list from the `tier-decision-doc.html` ledger (parse the embedded `const D = [...]` data, all
  ~133 rows).
- **Right — detail panel** for the selected event:
  1. **The LIVE rendered component** — the actual UI this event produces, **reusing the SAME tier
     components from Screen 1** (not mocks), in its real visual state.
  2. **The trigger payload** — a sample JSON envelope (from `event-payloads.md`), syntax-highlighted.
  3. **Metadata chips:** tier (color-coded to `ui-atoms` tokens), `group_type`, `lifecycle`,
     current→final tier, severity, and CHANGED / CONTESTED / DEV flags.
  4. **"Frontend handling" notes** — what the dev must do: which field binds where; lifecycle
     (start opens / progress updates by `group_id` / end closes); and any cross-agent gotcha
     (e.g. `sub_agent` vs `label` key, bare-string vs `{id,label}` options, CAA-nested vs RAA-flat
     viz payloads, missing `skill_description`, RAA `tool_start` has no `tool_call_id`, redact
     tracebacks). Pull these from the ledger's `note`/`rule` fields.
- Each event detail is a **permalinkable** card (anchor by `agent:event`).

## Must cover the hard cases explicitly (each its own catalog entry, rendered with the real component)
- The **Murmur line** in several states (action-only; action + detail + thought; fan-out strip;
  stall pin).
- A **tool card**: open → settled → failed.
- The **input GATE** (`question_asked` AND legacy `question`) in its expanded-composer form.
- **Outcome density:** a single `test_case_saved` card; a scenario group; the summary banner; the
  collapsed "+N more" state; bulk-accept; `acceptance_status_updated` reconciliation.
- **Scenarios-review card (S6/S7):** the "N scenarios generated" gate — numbered scenario list with
  category tag pills (Happy Path / Error handling / Data handling / Edge case) + Proceed.
- **Two-pane test-case review table (S8–S10):** the right work-panel — tabs (All / Pending / Accepted /
  Rejected), collapsible scenario/feature groups with counts, and a row in each state (Pending /
  Accepted / Rejected) showing priority icon, New/Update badge, module, `test_type`, and status pill.
- A **chart** (`visualization`) for BOTH CAA-nested and RAA-flat payload shapes.
- The **generic `event` envelope** routed by inner type — include the fail-visible
  "Unrecognised result" card for an unknown-but-payload-bearing event.
- A **failure/error** card state (traceback hidden, retry shown).
- **session close** briefings + the **SCA composed turn cap**.

## Implementation notes
- **Reuse Screen 1's tier components and my tokens** — this screen just feeds them fixed sample
  payloads instead of a live stream. If a component needs a "static / no-autoplay" mode, add a prop.
- Each entry renders STATICALLY by default, with a **"▶ animate" toggle** to preview motion (shimmer
  / gate expand) on demand.
- Place files following my existing structure; share the component folder with Screen 1.

## Sequence of work
1. Parse the ledger from `tier-decision-doc.html` into catalog data. 2. Build the index + filters.
3. Build the detail panel reusing Screen 1's components. 4. Add the sample payloads + handling notes.
5. Wire the hard-case entries. Then show me the running page and tell me how to view `/catalog`.
