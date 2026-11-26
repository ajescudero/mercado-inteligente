# Validation record

Review preparation: **26 November 2026 (UTC)**.

## Reproducible checks

`npm run check` passed locally on Linux with Node **24.13.0**, Python **3.14.4**,
Next.js **16.4.6** and React **19.3.1**:

| Check | Result |
| --- | --- |
| ESLint | 0 errors, 3 warnings |
| Next route generation and TypeScript | Passed |
| Filter regression assertions | 12 passed |
| Node test runner | 31 passed |
| Python unittest | 5 passed |
| Next.js production build | Passed |

The 48 checks include temporary-database importer validation, catalog identity,
filtering, local vocabulary, references, image matching, list preservation and
P01 net savings. The P01 suite includes an independent assignment oracle across
54 small cases; those cases are nested within the reported test count.

The three remaining lint warnings concern intentional full navigation used to
reset the catalog in Header/SectionNav, and a plain image element in the legacy
ProductSelector. No lint rule was globally weakened.

Checks create their own temporary empty catalog. They do not update the working
database, call an LLM or download supermarket data. Test fixture prices are
synthetic and are never inserted into the application catalog.

## Empty-catalog startup

A separate temporary catalog passed the initializer tests, including refusal to
overwrite an existing database. The resource-closure fix was checked with Python
ResourceWarning promoted to an error.

The built application started on a temporary loopback port. Home and references
returned HTTP 200. Status reported zero imported products/stores and no source
date; the catalog returned an empty result with online lookup idle. An empty
comparison request returned HTTP 400. The test server was stopped and its catalog
removed. The active application and its price database were not used.

## Clean-clone and packaging checks

A fresh local Git clone installed dependencies with npm ci from the local cache
and passed the complete npm run check command. It did not inherit node_modules,
build artifacts or a catalog from the working directory.

All six reachable commits were checked for excluded database/archive/private
paths and files over 100 MiB: none remained. A targeted credential-pattern scan
of 208 reachable text blobs found no matches. The largest historical blob was
292,383 bytes. This is a limited pattern scan, not a security certification.

The original source snapshot and database checksum were unchanged before the
prepared source/tooling updates were synchronized back to the development
checkout. Its Git history and data files remain separate from this distribution.
The bundled OFL license is retained byte-for-byte, including its original line
endings.

## Limits

The GitHub workflow is configured for Node 24 and Python 3.12. It has not run on
GitHub yet; local success is not a green hosted-CI claim. Python 3.11+ is the
documented baseline, not a claim that every minor version was exercised.

The earlier UI delivery recorded desktop/mobile, keyboard and failure-state
checks. Those historical checks are not a new comprehensive visual or
accessibility audit of this package. See the
[integration record](design/integration-3117-2026-11-25.md).

No live SEPA import, production deployment, external user study, load test or
complete security audit was performed in this preparation. Claude Code was not
installed or run; its shared-instructions import follows the official
documentation.
