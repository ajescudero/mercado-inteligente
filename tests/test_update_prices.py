import unittest, importlib.util, pathlib, tempfile, sqlite3, datetime, zipfile, io, csv, sys, json, contextlib
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('update_prices', pathlib.Path(__file__).resolve().parents[1] / 'data-pipeline/update_prices.py')
updater = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(updater)

def gtin(number):
    stem = '779' + str(number).zfill(9)
    checksum = sum(int(d) * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(stem)))
    return stem + str((10 - checksum % 10) % 10)

class PriceUpdateTests(unittest.TestCase):
    def test_package_sizes_do_not_confuse_small_refills_with_bottles(self):
        self.assertEqual(updater.presentation({'productos_cantidad_presentacion': '0.027', 'productos_unidad_medida_presentacion': 'L'}), '27 ml')
        self.assertEqual(updater.presentation({'productos_cantidad_presentacion': '1', 'productos_unidad_medida_presentacion': 'UNI', 'productos_descripcion': 'LECHE ENTERA X 1 LT'}), '1 L')
        self.assertEqual(updater.presentation({'productos_cantidad_presentacion': '1', 'productos_unidad_medida_presentacion': 'UNI', 'productos_descripcion': 'LIMP P DILUIR PISO LAVANDA ECOPLANET 27 CC'}), '27 ml')

    def test_barcode_flag_and_scoped_identifiers(self):
        row = {'id_comercio': '10', 'id_bandera': '1', 'id_producto': gtin(42), 'productos_ean': '1'}
        self.assertEqual(updater.product_key(row), gtin(42))
        row['productos_ean'] = '0'
        self.assertEqual(updater.product_key(row), 'local:10:1:' + gtin(42))
        row['id_comercio'] = '12'
        self.assertNotEqual(updater.product_key(row), 'local:10:1:' + gtin(42))
        row['id_producto'] = ''
        with self.assertRaises(ValueError): updater.product_key(row)

    def test_transactional_import_preserves_mappings_and_branch_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            live = root / 'shopping-list.db'
            con = sqlite3.connect(live)
            con.executescript('''CREATE TABLE stores(id TEXT PRIMARY KEY, comercioId TEXT, name TEXT, address TEXT, locality TEXT, lat REAL, lng REAL);
              CREATE TABLE products(ean TEXT, description TEXT, price REAL, storeId TEXT, comercioId TEXT, PRIMARY KEY(ean,description,storeId));
              CREATE TABLE search_cache(term TEXT,results TEXT,updatedAt INTEGER);
              CREATE TABLE term_mappings(user_term TEXT);
              INSERT INTO term_mappings VALUES ('leche');
              INSERT INTO search_cache VALUES ('leche','[]',0);''')
            con.commit();con.close()
            date = datetime.date.today().isoformat()
            archive = root / 'source.zip'
            html = root / 'source.html'
            html.write_text(f'class="pkg-container"><a href="https://datos.produccion.gob.ar/data.zip">Precios SEPA Minoristas {date}</a>')
            store_fields = ['id_comercio','id_bandera','id_sucursal','sucursales_provincia','sucursales_localidad','sucursales_nombre','sucursales_calle','sucursales_numero','sucursales_latitud','sucursales_longitud']
            product_fields = ['id_comercio','id_bandera','id_sucursal','id_producto','productos_ean','productos_descripcion','productos_precio_lista']
            def encode(fields, rows):
                out = io.StringIO();writer = csv.writer(out, delimiter='|');writer.writerow(fields);writer.writerows(rows);return out.getvalue().encode('utf-8-sig')
            with zipfile.ZipFile(archive, 'w') as master:
                for chain in ['10','12']:
                    data = io.BytesIO()
                    stores = [[chain,'1',str(s),'AR-M',['Luján de Cuyo','VILLANUEVA','RODEO DE LA CRUZ','TUPUNGATO','MENDOZA'][s%5],'Sucursal','Calle','1','-32.9','-68.8'] for s in range(10)]
                    products = [[chain,'1',str(s),gtin(i),'1',f'PRODUCTO {i}','100'] for s in range(10) for i in range(501)]
                    with zipfile.ZipFile(data, 'w', zipfile.ZIP_DEFLATED) as retailer:
                        retailer.writestr('comercio.csv', encode(['id_comercio','id_bandera','comercio_bandera_nombre'], [[chain,'1','Carrefour' if chain=='10' else 'Coto']]))
                        retailer.writestr('sucursales.csv',encode(store_fields,stores));retailer.writestr('productos.csv',encode(product_fields,products) + ('\nUltima actualizacion: '+date+'T08:30:00-03:00\n').encode())
                    master.writestr(f'{date}/retailer-{chain}.zip',data.getvalue())
            args = ['update_prices.py','--project',str(root),'--work',str(root/'work'),'--html',str(html),'--archive',str(archive),'--publish']
            with patch.object(sys, 'argv', args), contextlib.redirect_stdout(io.StringIO()): updater.main()
            con = sqlite3.connect(live)
            self.assertEqual(con.execute('select count(*) from stores').fetchone()[0],20)
            self.assertEqual(con.execute('select count(*) from products').fetchone()[0],10020)
            self.assertEqual(con.execute('select count(*) from products where ean in (\'0\',\'1\')').fetchone()[0],0)
            self.assertEqual(con.execute('select count(*) from term_mappings').fetchone()[0],1)
            self.assertEqual(con.execute('select count(*) from search_cache').fetchone()[0],0)
            self.assertEqual(con.execute('select source_date from price_update_metadata').fetchone()[0],date)
            self.assertEqual(con.execute('select count(*) from product_details').fetchone()[0], 10020)
            self.assertEqual(con.execute("select banner_name from store_details where store_id='10-1-0'").fetchone()[0], 'Carrefour')
            self.assertEqual(con.execute("select prices_updated_at from store_details limit 1").fetchone()[0], date+'T08:30:00-03:00')
            con.close()
            self.assertTrue((root/'work/before-update.db').exists())
            self.assertTrue(json.loads((root/'work/report.json').read_text())['published'])
            original = live.read_bytes()
            html.write_text(html.read_text().replace(date, '2000-01-01'))
            args[args.index('--work')+1] = str(root/'rejected')
            with patch.object(sys, 'argv', args), contextlib.redirect_stdout(io.StringIO()), self.assertRaises(ValueError): updater.main()
            self.assertEqual(live.read_bytes(), original)

if __name__ == '__main__': unittest.main()
