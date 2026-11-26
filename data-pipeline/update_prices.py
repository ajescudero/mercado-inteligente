"""Refresh Mendoza SEPA prices with validated staging and a transactional publish."""
import argparse, csv, datetime as dt, hashlib, io, json, math, pathlib, re, shutil, sqlite3, tempfile, urllib.request, zipfile

SOURCE = 'https://datos.produccion.gob.ar/dataset/sepa-precios'

def latest(html):
    candidates=[]
    for block in html.split('class="pkg-container"')[1:]:
        url=re.search(r'href="(https://datos\.produccion\.gob\.ar/[^\"]+\.zip)"',block)
        date=re.search(r'Precios SEPA Minoristas[^<]*?(\d{4}-\d{2}-\d{2})',block)
        if url and date: candidates.append((date[1],url[1]))
    if not candidates: raise ValueError('No dated official retail download found')
    return max(candidates)

def rows(z, name):
    entry=next((n for n in z.namelist() if n.endswith(name)),None)
    if entry is None: raise ValueError('Missing '+name)
    return csv.DictReader(io.TextIOWrapper(z.open(entry),encoding='utf-8-sig'),delimiter='|')

def connect_ro(p):
    return sqlite3.connect(p.resolve().as_uri()+'?mode=ro',uri=True)

def presentation(row):
    quantity = (row.get('productos_cantidad_presentacion') or '').strip()
    unit = (row.get('productos_unidad_medida_presentacion') or '').strip().upper()
    units = {'MLT': 'ml', 'ML': 'ml', 'CC': 'ml', 'LTR': 'L', 'LT': 'L', 'L': 'L', 'GRM': 'g', 'GR': 'g', 'KGM': 'kg', 'KG': 'kg'}
    if quantity and unit in units:
        value=float(quantity.replace(',', '.'))
        label=units[unit]
        if label=='L' and value<1: value*=1000;label='ml'
        if label=='kg' and value<1: value*=1000;label='g'
        return f'{value:g} {label}'
    # Some retailers report "1 UNI" but include the actual size in the name.
    matches = re.findall(r'(\d+(?:[.,]\d+)?)\s*(CC|ML|LITROS?|LTS?|LT|L|GRS?|GRM|G|KGS?|KG)(?=\W|$)', row.get('productos_descripcion', ''), re.I)
    if matches:
        amount, measure = matches[-1]
        measure = measure.upper()
        unit_label = 'ml' if measure in ['CC', 'ML'] else 'kg' if measure.startswith('K') else 'g' if measure.startswith('G') else 'L'
        return amount.replace(',', '.') + ' ' + unit_label
    return (quantity + ' unidad' + ('es' if quantity != '1' else '')).strip() if quantity else None

def banner_name(row):
    name = (row.get('comercio_bandera_nombre') or '').strip()
    url = (row.get('comercio_bandera_url') or '').lower()
    if 'carrefour.com.ar' in url and 'carrefour' not in name.lower():
        return 'Carrefour ' + name
    return name

def product_key(row):
    """productos_ean is a flag; id_producto contains the product identifier.

    Internal/restricted-range identifiers are scoped to a chain and banner so
    unrelated retailers cannot be treated as selling the same product.
    """
    identifier = (row.get('id_producto') or '').strip()
    if not identifier:
        raise ValueError('Product without id_producto')
    is_gtin = identifier.isdigit() and len(identifier) in (8, 12, 13, 14)
    if is_gtin:
        checksum = sum(int(d) * (3 if i % 2 == 0 else 1)
                       for i, d in enumerate(reversed(identifier[:-1])))
        is_gtin = (10 - checksum % 10) % 10 == int(identifier[-1])
    restricted = identifier.startswith('00000') or (len(identifier) == 13 and identifier[:2] in [str(i) for i in range(20, 30)])
    if row.get('productos_ean') == '1' and is_gtin and not restricted:
        return identifier
    return ':'.join(('local', row['id_comercio'], row['id_bandera'], identifier))

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--project',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);ap.add_argument('--work',type=pathlib.Path);ap.add_argument('--archive',type=pathlib.Path);ap.add_argument('--html',type=pathlib.Path);ap.add_argument('--publish',action='store_true');args=ap.parse_args()
    work=args.work or args.project/'price-updates'/dt.datetime.now().strftime('%Y%m%d-%H%M%S');work.mkdir(parents=True,exist_ok=True)
    html=args.html.read_text() if args.html else urllib.request.urlopen(SOURCE,timeout=60).read().decode()
    date,url=latest(html); print('Source',date,url,flush=True)
    if not 0 <= (dt.date.today()-dt.date.fromisoformat(date)).days <= 7: raise ValueError('Source older than 7 days; refusing stale update')
    archive=args.archive or work/('sepa-'+date+'.zip')
    if not args.archive:
        part=archive.with_suffix('.part')
        with urllib.request.urlopen(url,timeout=120) as src,part.open('wb') as dst:shutil.copyfileobj(src,dst)
        part.replace(archive)
    with archive.open('rb') as archive_file:
        sha=hashlib.file_digest(archive_file,'sha256').hexdigest()
    with zipfile.ZipFile(archive) as check:
        archive_dates=set(re.findall(r'\d{4}-\d{2}-\d{2}', '\n'.join(check.namelist())))
        if date not in archive_dates: raise ValueError('Archive contents do not match published source date')
    live=args.project/'shopping-list.db'; staged=work/'validated.db'
    if staged.exists():raise ValueError('Staging already exists; choose a new work directory')
    old=connect_ro(live); out=sqlite3.connect(staged);old.backup(out)
    previous=old.execute('select count(*) from products').fetchone()[0];old.close()
    out.execute('create index if not exists idx_products_store_price on products(storeId,price)')
    out.execute('delete from products');out.execute('delete from stores');out.execute('delete from search_cache')
    out.execute('create table if not exists store_details (store_id text primary key, banner_id text, banner_name text, prices_updated_at text, source_date text)')
    out.execute('create table if not exists product_details (ean text, description text, store_id text, brand text, presentation text, primary key(ean,description,store_id))')
    out.execute('delete from store_details');out.execute('delete from product_details')
    skipped=0; internal_dates=set(); chains=0; empty_archives=[]; ignored_rows=0
    with zipfile.ZipFile(archive) as master:
        members=[x for x in master.namelist() if x.endswith('.zip')]
        if not members:raise ValueError('No retailer archives')
        for member in members:
            internal_dates.update(re.findall(r'\d{4}-\d{2}-\d{2}',member))
            payload=master.read(member)
            if not payload:
                empty_archives.append(member); continue
            with zipfile.ZipFile(io.BytesIO(payload)) as retailer:
                banners = {(r['id_comercio'], r['id_bandera']): banner_name(r) for r in rows(retailer, 'comercio.csv') if r.get('id_bandera') and r.get('comercio_bandera_nombre')}
                stores={}
                for r in rows(retailer,'sucursales.csv'):
                    if not r.get('sucursales_provincia'):
                        ignored_rows+=1; continue
                    if r['sucursales_provincia'].upper().strip()!='AR-M':continue
                    # Province code covers every department, regardless of accents or locality aliases.
                    cid=r['id_comercio']; sid='-'.join((cid,r.get('id_bandera',''),r['id_sucursal']))
                    prior=out.execute('select comercioId from stores where id=?',(sid,)).fetchone()
                    if prior and prior[0]!=cid:raise ValueError('Store identifier collision: '+sid)
                    stores[sid]=cid
                    label = banners.get((cid, r.get('id_bandera', '')))
                    if not label: raise ValueError('Missing official retailer name for '+sid)
                    out.execute('insert or replace into store_details values(?,?,?,?,?)', (sid, cid+'-'+r['id_bandera'], label, None, date))
                    def coordinate(k):
                        val=r.get(k,'').strip().replace(',','.')
                        return float(val) if val else 0
                    out.execute('insert or replace into stores values(?,?,?,?,?,?,?)',(sid,cid,r['sucursales_nombre'],r['sucursales_calle']+' '+r['sucursales_numero'],r['sucursales_localidad'],coordinate('sucursales_latitud'),coordinate('sucursales_longitud')))
                if not stores:continue
                batch=[]; details=[]; count=0; prices_updated_at=None
                for r in rows(retailer,'productos.csv'):
                    if not all(r.get(k) for k in ['id_comercio','id_bandera','id_sucursal']):
                        stamp=re.search(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z)?', r.get('id_comercio') or '')
                        if stamp: prices_updated_at=stamp[0]
                        ignored_rows+=1; continue
                    sid='-'.join((r['id_comercio'],r.get('id_bandera',''),r['id_sucursal']))
                    if sid not in stores:continue
                    try:price=float(r['productos_precio_lista'].replace(',','.'))
                    except ValueError:skipped+=1;continue
                    if not math.isfinite(price) or price<=0:skipped+=1;continue
                    identifier=product_key(r)
                    description=(r.get('productos_descripcion') or '').strip()
                    if not description:skipped+=1;continue
                    batch.append((identifier,description,price,sid,r['id_comercio']));count+=1
                    details.append((identifier, description, sid, (r.get('productos_marca') or '').strip(), presentation(r)))
                    if len(batch)>=5000:
                        out.executemany('insert or replace into products values(?,?,?,?,?)',batch);batch=[]
                        out.executemany('insert or replace into product_details values(?,?,?,?,?)',details);details=[]
                out.executemany('insert or replace into products values(?,?,?,?,?)',batch)
                out.executemany('insert or replace into product_details values(?,?,?,?,?)',details)
                out.executemany('update store_details set prices_updated_at=? where store_id=?', [(prices_updated_at,sid) for sid in stores])
                chains+=1;print(member,'stores',len(stores),'prices',count,flush=True)
    count=out.execute('select count(*) from products').fetchone()[0];stores=out.execute('select count(*) from stores').fetchone()[0]
    if count<max(10000,previous*0.5) or stores<20:raise ValueError('Unexpectedly small dataset; not publishing')
    if out.execute('select count(*) from products p left join stores s on s.id=p.storeId where s.id is null').fetchone()[0]:raise ValueError('Orphan prices')
    if out.execute('pragma integrity_check').fetchone()[0]!='ok':raise ValueError('Integrity failure')
    if out.execute("select count(*) from products where ean in ('0','1','')").fetchone()[0]:raise ValueError('Invalid product identifiers')
    if out.execute('select count(*) from product_details').fetchone()[0]!=count:raise ValueError('Product details coverage mismatch')
    report={'source_date':date,'source_url':url,'download_sha256':sha,'retailer_dates':sorted(internal_dates),'products':count,'stores':stores,'retailers_with_local_stores':chains,'excluded_nonpositive_or_invalid_prices':skipped,'previous_products':previous,'empty_source_archives':empty_archives,'ignored_footer_or_incomplete_rows':ignored_rows,'published':False}
    out.commit();out.close()
    if args.publish:
        db=sqlite3.connect(live,timeout=30);backup=work/'before-update.db';dest=sqlite3.connect(backup);db.backup(dest);dest.close()
        db.execute('attach database ? as fresh',(str(staged),))
        try:
            db.execute('begin immediate')
            db.execute('delete from products');db.execute('delete from stores')
            db.execute('insert into stores select * from fresh.stores');db.execute('insert into products select * from fresh.products');db.execute('delete from search_cache')
            for table in ['store_details','product_details']:
                schema=sqlite3.connect(staged)
                definition=schema.execute('select sql from sqlite_master where name=?',(table,)).fetchone()[0];schema.close()
                db.execute(definition.replace('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS ', 1))
                db.execute('delete from '+table);db.execute('insert into '+table+' select * from fresh.'+table)
            db.execute('create table if not exists price_update_metadata (id integer primary key check(id=1), source_date text, source_url text, sha256 text, updated_at text)')
            db.execute('insert or replace into price_update_metadata values(1,?,?,?,?)',(date,url,sha,dt.datetime.now(dt.timezone.utc).isoformat()))
            db.commit();report['published']=True
        except BaseException:db.rollback();raise
        finally:db.close()
    (work/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':main()
