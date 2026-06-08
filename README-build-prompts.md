# How to use the two build prompts

Two self-contained prompt files build the conversational-UX prototype into **your existing React
project** (your design system + Tailwind config are reused, not replaced).

- `prompt-1-live-prototype.md` → **Screen 1**: live, event-driven, scenario-based prototype.
- `prompt-2-event-catalog.md` → **Screen 2**: per-event render catalog for the frontend team.

---

## Step 0 — open Claude Code inside your React repo
Launch Claude Code in your project root so it can read your design system, `tailwind.config.*`, and
routing. Recommended model: **Opus**. Let it use the `impeccable` and `animate` skills.

## What to give it (attach to the session)
**Required**
- The **3 Figma links** → paste them into the `‹FIGMA LINK …›` placeholders in Prompt 1.
- **`tier-decision-doc.html`** → the full event spec + ledger + resolved problems (the source of
  truth; Screen 2 parses its embedded ledger).
- **`event-payloads.md`** → build-ready sample-payload JSON for **every** event. Screen 1's
  scenarios and Screen 2's payload examples bind to these.

**Optional extra grounding**
- `events-structure.md` (your authoritative real-system payloads for the documented subset — useful
  to cross-check a shape), `agentic-event-map.md`, `skills-of-agents.md`.

You do **not** need to attach your design-system files — your design system + theme tokens/variables
live in **`ui-atoms`**, and the prompts explicitly tell Claude to inventory `ui-atoms` first and
import components/tokens from there. Just make sure `ui-atoms` is resolvable in the open repo (it's a
workspace package / path Claude can read).

---

## Order — run them one after the other, in the SAME session
1. **Paste `prompt-1-live-prototype.md`.** Fill in the 3 Figma links first.
   - Claude will (a) inventory your repo + Figma and report which components/tokens it will reuse,
     (b) build the event engine + Murmur arbitration, (c) build the tier renderers from your design
     system, (d) add motion, (e) wire scenarios. It adds a `/prototype` route.
   - Review the running screen and iterate until Screen 1 is right.
2. **Then paste `prompt-2-event-catalog.md` in the SAME session.**
   - It **reuses the tier components Screen 1 created** and your tokens, parses the ledger from
     `tier-decision-doc.html`, and builds a `/catalog` route.

### Why this order (don't skip it)
Screen 1 creates the reusable tier components (`MurmurLine`, `MilestoneSpine`, `OutcomeCard`,
`InputGate`, `ShimmerText`, `GradientField`, …). Screen 2 feeds those same components fixed sample
payloads. Running B first — or in a fresh session — means the components don't exist yet, so B would
rebuild them and likely drift from A. **Same session, A then B.**

---

## Tips
- If `framer-motion` isn't installed, that's the one dependency the prompts allow it to add.
- Both screens respect `prefers-reduced-motion`.
- If your repo uses a component catalog already (Storybook, etc.), tell Claude to add Screen 2 there
  instead of a standalone route.
- Keep the Figma MCP connected for both steps so token/spacing fidelity stays high.
