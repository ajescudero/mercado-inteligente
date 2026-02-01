import axios from 'axios';
import * as cheerio from 'cheerio';
import AdmZip from 'adm-zip';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const BASE_dataset_URL = 'https://datos.produccion.gob.ar/dataset/sepa-precios';
const DOWNLOAD_DIR = path.join(process.cwd(), 'temp_descargas');
const OUTPUT_FILE = path.join(process.cwd(), 'precios_mendoza.json');
const LOG_FILE = path.join(process.cwd(), 'ingestion_debug.log');

function log(message: string) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

// Constantes de filtrado
const TARGET_PROVINCE_CODE = 'AR-M'; // Mendoza
const TARGET_LOCALITIES = [
    'GUAYMALLÉN', 'GUAYMALLEN',
    'MAIPÚ', 'MAIPU',
    'LAVALLE',
    'MENDOZA', 'CAPITAL', 'CIUDAD',
    'VILLA NUEVA', 'DORREGO', 'LAS CAÑAS', // Barrios de Guaymallen
    'GUTIERREZ', 'LUZURIAGA', // Distritos Maibu
    'LAS HERAS', 'GODOY CRUZ', 'LUJAN DE CUYO', 'SAN MARTIN' // Added common Mendoza areas
];

// Comodines para incluir siempre (supera chequeo de localidad estricto, pero debe ser Mendoza)
const TARGET_RETAILERS_KEYWORDS = ['ATOMO', 'MILLAN', 'MILLÁN'];

// Estructura para guardar resultados
interface Store {
    id: string;
    comercioId: string;
    nombre: string;
    direccion: string;
    localidad: string;
    lat: string;
    lng: string;
}

interface PriceRecord {
    ean: string;
    precio: number;
    descripcion: string;
    storeId: string;
    comercioId: string;
    fecha?: string;
}

// Asegurar que el directorio temporal existe
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

async function getLatestDownloadUrl(): Promise<string | null> {
    log('🔎 Buscando el archivo de precios más reciente en SEPA...');
    try {
        const { data } = await axios.get(BASE_dataset_URL);
        const $ = cheerio.load(data);
        let downloadUrl: string | null = null;

        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href && href.endsWith('.zip') && !downloadUrl) {
                downloadUrl = href;
                return false;
            }
        });

        return downloadUrl;
    } catch (error) {
        console.error('❌ Error al acceder al sitio web SEPA:', error);
        return null;
    }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
    if (fs.existsSync(destPath)) {
        log(`ℹ️  El archivo ya existe. Usando caché local.`);
        return;
    }
    log(`⬇️  Descargando archivo...`);
    const writer = fs.createWriteStream(destPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    await pipeline(response.data, writer);
    log('✅ Descarga completada.');
}

function normalizeText(text: string): string {
    return text.toUpperCase().trim();
}

/**
 * Procesa un ZIP de comercio individual
 */
async function processRetailerZip(
    zipEntry: AdmZip.IZipEntry,
    allProducts: PriceRecord[],
    globalStores: Map<string, Store>,
    stats: { storesFound: number, productsFound: number }
) {
    log(`   > Examinando: ${zipEntry.entryName}`);

    // Leer el buffer del ZIP interno
    let innerZip: AdmZip;
    try {
        innerZip = new AdmZip(zipEntry.getData());
    } catch (e) {
        console.warn(`   ⚠️  Error leyendo ZIP interno ${zipEntry.entryName}:`, e);
        return;
    }

    const innerEntries = innerZip.getEntries();

    // 1. Buscar y analizar sucursales.csv
    const sucursalesEntry = innerEntries.find(e => e.entryName.endsWith('sucursales.csv'));
    if (!sucursalesEntry) return; // Si no hay sucursales, no podemos geolocalizar

    // Extraer en memoria y parsear
    const validStoreIds = new Set<string>();

    // Parseo sincrónico de sucursales (son pocas)
    // Nota: csv-parser es stream, así que lo envolvemos en promesa o usamos lógica simple de split si es pequeño
    // Para robustez usamos stream escribiendo a tmp
    const sucursalesPath = path.join(DOWNLOAD_DIR, `temp_suc_${zipEntry.entryName.replace(/\W/g, '')}.csv`);
    fs.writeFileSync(sucursalesPath, sucursalesEntry.getData());

    await new Promise<void>((resolve) => {
        fs.createReadStream(sucursalesPath)
            .pipe(csv({ separator: '|' }))
            .on('data', (row) => {
                // Filtro Geográfico
                const prov = normalizeText(row.sucursales_provincia || '');
                const loc = normalizeText(row.sucursales_localidad || '');

                // Chequear Provincia
                if (prov === TARGET_PROVINCE_CODE) {
                    // 1. Chequeo por Nombre de Comercio (Prioridad)
                    const retailerName = normalizeText(row.sucursales_nombre || '');
                    const matchesRetailer = TARGET_RETAILERS_KEYWORDS.some(k => retailerName.includes(k));

                    // 2. Chequeo por Localidad
                    const matchesLocality = TARGET_LOCALITIES.some(target => loc.includes(target));

                    if (matchesRetailer || matchesLocality) {
                        const storeId = row.id_sucursal;
                        validStoreIds.add(storeId);
                        globalStores.set(storeId, {
                            id: storeId,
                            comercioId: row.id_comercio,
                            nombre: row.sucursales_nombre,
                            direccion: `${row.sucursales_calle} ${row.sucursales_numero}`,
                            localidad: row.sucursales_localidad,
                            lat: row.sucursales_latitud,
                            lng: row.sucursales_longitud
                        });
                    }
                }
            })
            .on('end', resolve);
    });

    // Limpiar tmp
    try { fs.unlinkSync(sucursalesPath); } catch { }

    if (validStoreIds.size === 0) {
        return; // No hay tiendas relevantes en este ZIP
    }

    stats.storesFound += validStoreIds.size;
    log(`   ✅ Encontradas ${validStoreIds.size} sucursales relevantes en ${zipEntry.entryName}`);

    // 2. Procesar productos.csv solo para las tiendas válidas
    const productosEntry = innerEntries.find(e => e.entryName.endsWith('productos.csv'));
    if (!productosEntry) return;

    const productosPath = path.join(DOWNLOAD_DIR, `temp_prod_${zipEntry.entryName.replace(/\W/g, '')}.csv`);
    fs.writeFileSync(productosPath, productosEntry.getData());

    await new Promise<void>((resolve) => {
        fs.createReadStream(productosPath)
            .pipe(csv({ separator: '|' }))
            .on('data', (row) => {
                if (validStoreIds.has(row.id_sucursal)) {
                    const price = parseFloat(row.productos_precio_lista);
                    if (!isNaN(price)) {
                        allProducts.push({
                            ean: row.productos_ean,
                            descripcion: row.productos_descripcion,
                            precio: price,
                            storeId: row.id_sucursal,
                            comercioId: row.id_comercio
                        });
                    }
                }
            })
            .on('end', resolve);
    });

    stats.productsFound = allProducts.length;

    // Limpiar tmp
    try { fs.unlinkSync(productosPath); } catch { }
}

async function main() {
    log('🚀 Iniciando Pipeline: Filtro Mendoza (Guaymallén, Capital, Maipú, Lavalle)');

    const url = await getLatestDownloadUrl();
    if (!url) return;

    const zipFileName = 'precios_sepa_latest.zip';
    const zipFilePath = path.join(DOWNLOAD_DIR, zipFileName);

    await downloadFile(url, zipFilePath);

    log('📦 Abriendo archivo ZIP maestro...');
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // Filtrar zips internos
    const retailerZips = zipEntries.filter(entry => entry.entryName.endsWith('.zip'));
    log(`📊 Procesando ${retailerZips.length} cadenas de supermercados...`);

    const capturedProducts: PriceRecord[] = [];
    const globalStores = new Map<string, Store>();
    const stats = { storesFound: 0, productsFound: 0 };

    // Procesar en serie para no saturar memoria/disco
    for (const entry of retailerZips) {
        await processRetailerZip(entry, capturedProducts, globalStores, stats);
    }

    log(`\n🎉 Proceso Finalizado!`);
    log(`   📍 Sucursales encontradas: ${globalStores.size}`);
    log(`   🍎 Precios capturados: ${stats.productsFound}`);

    // Guardar resultado
    const OUTPUT_STORES_FILE = path.join(process.cwd(), 'stores_mendoza.json');

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(capturedProducts, null, 2));
    fs.writeFileSync(OUTPUT_STORES_FILE, JSON.stringify(Array.from(globalStores.values()), null, 2));

    log(`💾 Resultados guardados en: `);
    console.log(`   - ${OUTPUT_FILE}`);
    console.log(`   - ${OUTPUT_STORES_FILE}`);
}

if (require.main === module) {
    main();
}
