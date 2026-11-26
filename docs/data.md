# Data setup, provenance and limits

## Empty setup

`npm run data:init` creates `shopping-list.db` from `data-pipeline/schema.sql`.
It inserts no product prices, mappings or fabricated update date. Existing files
are refused, including a concurrently created file. The schema describes the
current application contract; it is not a production migration.

An alternate path is explicit:

```sh
python3 data-pipeline/init_db.py --database /path/to/catalog.sqlite3
PRICES_DB_PATH=/path/to/catalog.sqlite3 npm run dev -- --port 3117
```

The application can read environment settings from Next.js environment files.
Python commands do not load those files automatically. Pass an alternate database
to the updater explicitly as well.

## Official SEPA import

The importer discovers the dated retail publication linked from
[the official SEPA dataset](https://datos.produccion.gob.ar/dataset/sepa-precios).
The expected archive structure is tested with synthetic fixtures; upstream HTML
or format changes can still require maintenance.

```sh
# Inspect a staged update; does not publish to the working catalog.
python3 data-pipeline/update_prices.py

# Explicitly publish after staging and validation.
npm run update-data

# Select an alternate existing catalog.
python3 data-pipeline/update_prices.py --database /path/to/catalog.sqlite3 --publish
```

Do not run multiple updates concurrently. Archives and staged copies live under
`price-updates/` unless `--work` is supplied. Allow space for the archive,
uncompressed processing, staged catalog and backup. The importer rejects stale
publications, large coverage losses, invalid identifiers and inconsistent data.
It preserves term mappings, clears search cache and stores source metadata when
publishing transactionally.

A dated publication is not a stock feed or a guarantee of the current checkout
price. The conservative price floor can exclude legitimate low prices; it is not
a statistical outlier classifier.

## Other sources

- Átomo online is queried separately; physical directory entries are not proof
  of imported branch prices.
- INDEC Cuyo references are manually maintained, attributed and period-specific.
  Local Mendoza averages use eligible catalog observations, not sales weights.
- Product images can contact external hosts and are matched by validated product
  identity. They do not determine price or stock.

A fresh empty catalog does not disable online integrations. Tests avoid external
providers by using fixtures; a reviewer searching in the UI may contact them.

## Distribution

The review repository contains schema, code, attribution and test fixtures.
It does not redistribute the full SEPA archives, working database, backups or
personal shopping lists. Public availability does not by itself grant blanket
redistribution rights. Review each source's current terms for your intended use.
No database or provider permission is granted by this repository.

Fixtures in tests are labeled examples, never presented as real retailer offers.
