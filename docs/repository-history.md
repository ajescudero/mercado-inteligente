# Repository history and provenance

The development checkout contained four genuine commits plus substantial later
uncommitted work. This review distribution preserves the four commits' author and
committer metadata, dates, messages and order, while removing data artifacts
from every historical tree. Filtering changes commit identifiers.

The original checkout, its Git references and its local datasets were retained.
Ignoring a tracked file would not remove it from older commits. A separate
filtered export/import was used; this is not an unrelated replacement application.

## Earlier commits

| Author date | Original commit | Filtered commit |
| --- | --- | --- |
| 2026-01-23 | 95f3bac299c9bf572fe18fcb19aa5df9786ee664 | b9a9cdba5f8bf11db632f674af7533cf7e6f16c2 |
| 2026-01-25 | 2af6dceaa277583a7dcdd16caad85f8aee3cfa8e | f91c5c2d9a94a5f0742107144d28d637f819671f |
| 2026-02-01 | 65749192bbfead77717aed2479c30ac86c626d0f | f8567da80e1d2c0c4075de438581d0bc7779baa9 |
| 2026-02-04 | c461b5309185e7036c4359f4c0a8d82f0c332384 | 6845d38d1be56624a110930b712355d5321c4c33 |

## Exclusions

The historical export excludes the working SQLite database, raw price/store JSON,
downloaded archives and CSVs under temp_descargas, a database-code backup and
the local config.json. Some original archives exceeded GitHub's 100 MiB file
limit. Current packaging also omits local assistant state, logs, interview
rehearsal material, database backups and retailer image binaries whose
redistribution permission has not been established.

The review package retains the application, importer, tests, design attribution,
font license and documented architecture. It does not replace real prices with
a sample shopping catalog.

## Later consolidation

Previously uncommitted catalog, UI, vocabulary, references and P01 work is
recorded as a consolidation at the actual preparation time. A separate
preparation commit adds the portable development harness, clean database setup,
lint/type fixes, missing-logo fallback and review documentation.

These commits are organizational boundaries, not a fabricated timeline of when
each feature was developed. Material AI assistance is disclosed in
[the development workflow](ai-development.md). No claim of independent human
review is implied.

A targeted scan of reachable text blobs checks common credential patterns.
That check is useful packaging evidence, not an exhaustive security audit.
See [validation](validation.md) for its scope and results.
