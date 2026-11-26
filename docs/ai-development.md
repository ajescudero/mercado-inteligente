# AI-assisted development and portable harness

## What AI contributed

AI assistance has been used to investigate the existing application, propose and
implement changes, prepare tests, run tools and write documentation. The owner
provided requirements, regional vocabulary examples, scope restrictions and
corrections after using the local application.

This record does not assign an invented percentage of human-written code.
AI-executed tests are evidence of those checks, not proof of independent human
review or complete correctness. Historical commits were not backdated or split
into an invented development narrative.

Concrete examples:

- Regional search: a report that “molida especial” failed led to shared vocabulary
  rules, preserved qualifiers and false-positive regressions.
- P01: the requested goal became a constrained basket calculation with complete
  coverage, quantities, travel estimates and a separate assignment oracle in tests.
- Integration correction: the owner observed that the active app lacked the Figma
  changes present in another checkout. The correction verified the serving
  directory, integrated both features and checked preservation of the catalog/list.

## One development contract

`AGENTS.md` contains invariants, commands, boundaries and handoff requirements.
`CLAUDE.md` imports that file through the documented
[Claude Code memory import mechanism](https://code.claude.com/docs/en/memory).
This keeps the repository usable with Codex and Claude Code without maintaining
two conflicting copies of the instructions.

`npm run check` is an ordinary local program. It runs lint, route/types,
deterministic tests and build against a temporary catalog. The GitHub workflow
uses the same command with read-only repository permissions. It does not run
an AI model, upload prompts or deploy the application.

The instructions are context, not a security sandbox. Tool permissions and the
checks remain separate controls. No hooks disable approvals or grant access.
No assistant credentials, provider configuration or conversation transcripts are
committed. Claude Code itself has not been installed or exercised as part of this
preparation; file compatibility is based on the official documented mechanism.

## Switching assistants

Start the chosen coding assistant in the same checkout. Ask it to read
`AGENTS.md` and the relevant task context before editing. In Claude Code,
confirm that the imported instructions loaded using its context/memory view.
Each assistant should see the same current Git state and acceptance criteria.

Use this short handoff:

```text
Goal:
Current branch / commit / uncommitted changes:
Relevant files and domain invariants:
Acceptance criteria:
Decisions and rejected alternatives:
Commands run and actual results:
Open questions / next smallest step:
```

Do not copy secrets or private interview practice into that handoff. A new session
must recheck the serving checkout before claiming that a UI change is delivered.

## Evaluating two proposed changes

Compare them against the same task and inputs. Check correctness, preservation of
data, scope, failure handling and maintainability; measure performance where it
matters. Distinguish stylistic preferences from observable defects. Keep original
outputs separate from later fixes, and state when neither proposal is acceptable.

An optional runtime OpenAI suggestion endpoint is independent of this workflow.
Changing the development assistant does not require adding an Anthropic API
adapter to the product.
