# MercadoInteligente development contract

## Start here
- Read README.md, docs/architecture.md and the relevant tests before editing.
- Inspect git status and preserve uncommitted work. Identify which checkout and
  process serve the application before reporting a UI change as delivered.
- Work in small changes with observable acceptance criteria. Record assumptions
  and unresolved decisions in the change description.

## Invariants
- Compare canonical product identities and preserve presentation and quantities.
  A similar name or regional search synonym is not an exact basket equivalence.
- A recommended basket must cover every required SEPA item. Missing prices are
  never zero. Preserve online items when applying a SEPA recommendation.
- P01 supports up to three used branches, uniform user-estimated travel cost and
  fixed online delivery estimates. It does not optimize routes or confirm stock.
- Keep source, channel, date and limitations visible. Keep official INDEC Cuyo
  references separate from catalog-derived Mendoza references.
- Preserve local list persistence, DM Sans, design tokens, keyboard focus and
  licensed asset attribution. Do not invent product data or unimplemented flows.

## Development harness
- Node 24, Python 3.11+ and npm. Install with npm ci.
- npm run check: lint, route/type generation, TypeScript, offline tests and build.
  It creates an isolated temporary catalog and never uses the working database.
- npm run test:all runs deterministic fixtures, including Python import tests.
- npm run data:init creates an empty catalog only if the destination is absent.
- npm run update-data publishes real data: run only when a data update is requested.
- Do not include credentials, databases, downloaded datasets, interview rehearsal,
  transcripts, machine paths, or generated artifacts in a patch.
- No deployment, external messages or access changes without task authorization.

## Review and handoff
- Explain the trigger, resulting behavior, relevant choices, tests and limits.
- State which commands actually ran; don't describe a proposed check as passed.
- Distinguish observed behavior, historical measurements and future work.
- Disclose material AI assistance. Do not invent human review, authorship
  percentages, earlier commits, metrics or time spent.
- For another assistant, hand off objective, current branch/status, changed
  files, acceptance criteria, commands/results and unresolved questions.
- Instructions guide the assistant; checks and ordinary tool permissions enforce
  execution boundaries. These files do not authorize bypassing permissions.

Optional product-side OpenAI suggestions are independent of the development
assistant. Switching to Claude Code does not require changing application APIs.
