# Contributing

Read [AGENTS.md](AGENTS.md) and [architecture](docs/architecture.md). Inspect
the current branch and uncommitted work before editing. Use Node 24 and install
the lockfile with `npm ci`.

Define the observable behavior before implementing. Keep a change small enough
to review and run `npm run check`. For data or money logic, add a regression
that would fail for the defect being fixed; avoid tests that merely repeat the
implementation. Keep fixtures isolated from real catalogs and personal lists.

A change description should explain the problem, result, tradeoffs, tests that
actually ran and remaining limits. Disclose substantial AI assistance without
implying human review that did not happen. Use the PR template.

Do not commit downloaded catalogs, databases, credentials, backups, transcripts
or private interview preparation. Source attribution must accompany reused
assets. A working image URL is not proof of a redistribution license.

The repository has no automatic deployment. Data publication, external access
changes and public deployment are separate actions requiring authorization.
