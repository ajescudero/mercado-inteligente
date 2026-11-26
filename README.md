# MercadoInteligente

A local grocery price comparison app for Mendoza, Argentina. Search published
branch offers, build a list with quantities, and compare complete baskets using
estimated travel costs and a maximum of one, two or three store visits.

The interface is in Spanish. This repository includes the existing application,
its data importer and deterministic tests. It is under active development; there
is no public production deployment.

## What to review

- **Exact basket identity:** global product identifiers are distinguished from
  retailer-scoped codes. Search synonyms do not authorize product substitutions.
- **Net savings (P01):** complete baskets, quantities, travel estimates and fixed
  online items are evaluated together. See the [algorithm and tradeoffs](docs/p01-ahorro-neto-2026-11-25.md)
  and [independent-oracle tests](tests/net-savings.test.ts).
- **Data reliability:** dated SEPA imports are staged and validated before a
  backed-up, transactional publication. Online Átomo offers remain a separate source.
- **Local language:** regional search rules handle cases such as “carne molida”
  and “carne picada”, with qualifiers and false-positive exclusions.
- **Interface:** responsive catalog, filters, product offers, persistent list,
  comparison and references; light/dark themes and local DM Sans.

For a short introduction, read the [review guide](docs/alignerr-project.md).
The [architecture](docs/architecture.md), [AI development workflow](docs/ai-development.md)
and [validation record](docs/validation.md) explain how to assess the implementation.

## Run the checks from a clean clone

Requirements: **Node.js 24**, npm, **Python 3.11+** and SQLite support in Python.
The Python importer uses the standard library. On systems without a compatible
better-sqlite3 prebuilt binary, npm also needs the usual native build tools.

```sh
npm ci
npm run check
```

The same command is used by humans, coding assistants and the CI workflow. It
runs ESLint, route/type generation, TypeScript, deterministic tests and a Next.js
production build. It creates and removes its own temporary empty catalog, disables
optional AI suggestions and never opens the working price database. Package
installation needs registry access; the checks do not download supermarket data.

## Run the application

```sh
npm run data:init
npm run build
npm start -- --port 3117
```

Open http://127.0.0.1:3117. The server listens on loopback. For development, use
`npm run dev -- --port 3117` instead of build/start.

**A clean clone starts with an empty catalog.** The initializer creates the
schema, refuses to overwrite an existing database, and does not insert invented
prices. Tests use explicitly synthetic fixtures in temporary databases.

To populate the catalog with a current official publication, review
[data acquisition and limits](docs/data.md), then run:

```sh
npm run update-data
```

This explicitly downloads and publishes real SEPA data. It can require substantial
disk space and network access. Do not run it merely to review a code change.
A pre-existing authorized catalog can be selected through `PRICES_DB_PATH`;
see [.env.example](.env.example). An empty catalog still allows reviewing the UI
and running every deterministic check; online searches can contact Átomo.

## Development with AI

This project has used AI assistance for implementation, investigation, tests and
documentation. Product requirements and concrete corrections came from the project
owner. This is disclosed without claiming that every line was manually authored
or independently reviewed by a human.

[AGENTS.md](AGENTS.md) is the shared development contract.
[CLAUDE.md](CLAUDE.md) imports it for Claude Code. Both assistants use the same
`npm run check`, acceptance criteria and handoff notes. No model key is required
for development checks, and no coding assistant is installed by this repository.
See [workflow, examples and evaluation criteria](docs/ai-development.md).

Optional **product-side** OpenAI suggestions are a separate feature, disabled by
default. Core catalog search and comparison do not require an LLM.

## Scope and limitations

Published prices do not confirm stock or the final checkout price. P01 uses
manual estimates, a uniform cost per used branch and up to three branches; it
does not optimize driving routes. Online cart prices are saved observations,
not automatically refreshed quotes. Lists use browser storage, without accounts
or cross-device synchronization.

Official INDEC Cuyo figures are dated regional references. Mendoza catalog
averages are a separate, coverage-limited calculation, not an official provincial
index. See [references](docs/market-references.md).

Automated data scheduling, production operations, broader accessibility testing
and validation with external users remain on the [roadmap](docs/roadmap.md).

## Repository and attribution

Databases, downloaded archives, logs, private interview preparation and local
assistant state are excluded from this review repository and its history.
The four earlier commits retain their real dates and messages after removal of
data artifacts; [history provenance](docs/repository-history.md) explains changed
commit identifiers and the later consolidation.

The interface adapts Grocery App by Omar Yassir with attribution. DM Sans carries
its bundled OFL notice. Retailer logos and product photos have separate rights:
retailer image files are not redistributed in this review package, and missing
logos fall back to the store name. See [third-party notices](THIRD_PARTY_NOTICES.md)
and [license status](LICENSE.md).
