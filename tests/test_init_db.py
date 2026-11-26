from contextlib import closing
import hashlib
import importlib.util
from pathlib import Path
import sqlite3
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("init_db", Path(__file__).resolve().parents[1] / "data-pipeline/init_db.py")
initializer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(initializer)


class InitializeCatalogTests(unittest.TestCase):
    def test_empty_catalog_has_runtime_and_importer_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "catalog.sqlite3"
            initializer.initialize(target)
            with closing(sqlite3.connect(target)) as db:
                self.assertEqual(db.execute("PRAGMA integrity_check").fetchone()[0], "ok")
                for table in ("stores", "products", "store_details", "product_details",
                              "price_update_metadata", "search_cache", "term_mappings"):
                    self.assertEqual(db.execute(f"SELECT count(*) FROM {table}").fetchone()[0], 0)
                db.execute("INSERT INTO stores VALUES ('test','test','Test branch','','',0,0)")
                db.execute("INSERT INTO products VALUES ('test','Test item',100,'test','test')")
                db.execute("INSERT INTO term_mappings(user_term,search_terms) VALUES ('test','[]')")
                self.assertEqual(db.execute("SELECT count(*) FROM products").fetchone()[0], 1)

    def test_existing_database_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "catalog.sqlite3"
            initializer.initialize(target)
            with closing(sqlite3.connect(target)) as db:
                db.execute("INSERT INTO term_mappings(user_term,search_terms) VALUES ('keep','[]')")
                db.commit()
            before = hashlib.sha256(target.read_bytes()).hexdigest()
            with self.assertRaises(FileExistsError):
                initializer.initialize(target)
            self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), before)
            self.assertFalse(list(Path(directory).glob(".catalog-init-*")))


if __name__ == "__main__":
    unittest.main()
