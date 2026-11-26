"""Create an empty compatible catalog, atomically, without replacing existing data."""
import argparse
import os
from pathlib import Path
import sqlite3
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = Path(__file__).with_name("schema.sql")


def initialize(database: Path) -> Path:
    database = database.expanduser().resolve()
    if database.exists():
        raise FileExistsError(f"Catalog already exists; left unchanged: {database}")
    database.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".catalog-init-", dir=database.parent)
    os.close(fd)
    temporary = Path(name)
    try:
        connection = sqlite3.connect(temporary)
        try:
            connection.executescript(SCHEMA.read_text(encoding="utf-8"))
            connection.commit()
            if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError("Invalid catalog schema")
        finally:
            connection.close()
        # Same-filesystem link is atomic and refuses to replace a concurrent file.
        os.link(temporary, database)
    finally:
        temporary.unlink(missing_ok=True)
    return database


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path,
                        default=Path(os.environ.get("PRICES_DB_PATH", str(ROOT / "shopping-list.db"))))
    args = parser.parse_args()
    try:
        created = initialize(args.database)
    except (FileExistsError, OSError, ValueError, sqlite3.Error) as error:
        parser.exit(1, str(error) + "\n")
    print(f"Empty catalog created: {created}")
    print("No example prices were inserted. Import an authorized SEPA publication to browse local offers.")


if __name__ == "__main__":
    main()
