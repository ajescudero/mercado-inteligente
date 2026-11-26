# Diccionario de búsquedas

`lib/search-vocabulary.ts` centraliza correspondencias revisadas. No modifica nombres, códigos, precios ni la equivalencia de la canasta. No lee ni reescribe la tabla histórica term_mappings: allí había asociaciones como bife/varios cortes y pan lactal/pan de miga que no conviene convertir en equivalencias exactas.

- Carne molida / carne picada: vocabulario Mendoza/Buenos Aires confirmado por Aldo y contrastado con las descripciones reales. Admite palabras intermedias, como CARNE NOVILLO EL LIBERTADOR MOLIDA; conserva especial, común, marca y cantidad. Excluye fiambres, especias y alimentos para mascotas.
- Morrón / pimiento: equivalencia de denominación; conserva color y excluye polvo, picante y conservas en búsquedas de fresco. Fuente: https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-809-2025-419213/texto , anexo 3.1.
- Yogur / yogurt: variantes ya registradas en el proyecto; mantiene el resto de los términos.
- Limpiador / desodorante de pisos: conserva la regla contextual previa; no convierte desodorantes personales en productos para pisos.

La primera entrada documenta los nombres regionales indicados por el usuario; las demás son denominaciones o variantes compartidas, sin afirmar que sean exclusivas de una provincia. Es una base inicial revisable, no un diccionario exhaustivo de Argentina. Para ampliar: añadir evidencia y contexto, preservar calificadores y agregar una regresión positiva y otra de falso positivo.

El catálogo SQL y los filtros de referencias consumen las mismas equivalencias revisadas. La solicitud existente de Átomo recibe el término local molida para consultas de carne picada, sin alterar endpoint, autenticación, límites, caché, frecuencia ni parser.
