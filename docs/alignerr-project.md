# Technical review guide — MercadoInteligente

MercadoInteligente helps shoppers in Mendoza search published supermarket offers,
build a list and compare complete baskets. The project is a working local app
under active development, with AI-assisted engineering disclosed in
[the development record](ai-development.md).

## Suggested reading path

1. [README](../README.md): scope, clean setup and limits.
2. [Architecture](architecture.md): active routes, data boundaries and legacy code.
3. [P01](p01-ahorro-neto-2026-11-25.md) and
   [tests](../tests/net-savings.test.ts): a concrete optimization problem, costs,
   exact identity, complete coverage and an independent small-case oracle.
4. [Importer](../data-pipeline/update_prices.py) and
   [its tests](../tests/test_update_prices.py): staged validation, identifier
   handling, dates, preservation and transactional publication.
5. [Regional search](search-vocabulary.md) and
   [regressions](../tests/search-vocabulary.test.ts): regional vocabulary is
   separated from product equivalence.
6. [Validation](validation.md) and [roadmap](roadmap.md): observed results and
   remaining work.

## What is substantial

The challenge is preserving a comparable purchase across imperfect sources.
Equal-looking descriptions may have different contents; internal codes can
collide across retailers; a low partial total can omit required products; and
extra store visits can consume the product-price saving. The code and tests
make those distinctions explicit.

P01 includes manually estimated travel and fixed online delivery costs. Earlier
descriptions excluding those costs are obsolete. Its search is exact within the
bounded model (up to three branches), not a claim to solve arbitrary routing,
stock, promotions or product substitution.

The UI adapts an attributed design reference. Its data model, search rules,
importer and basket logic are separate engineering work. Attribution is not
presented as sole authorship of the design.

## Reproduction and review boundaries

Run `npm ci` then `npm run check`. No LLM credentials or full price database
are required for the deterministic checks. For the interactive app, create an
empty catalog and import a permitted official publication as documented.

The review package excludes full datasets, personal preparation and retailer
image binaries. It preserves filtered historical commits and transparently
consolidates previously uncommitted work. It does not claim production usage,
measured real-world savings, universal accessibility or independent human review
of every AI-assisted line.

No material has been submitted to Alignerr merely by preparing this repository.
