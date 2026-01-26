import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Uses AI to understand what products the user is looking for
 * and returns normalized search terms that match database product names.
 * 
 * Example: "leche" → ["LECHE ENTERA", "LECHE DESCREMADA", "LECHE CHOCOLATADA"]
 */
export async function normalizeSearchTerm(userTerm: string): Promise<string[]> {
    if (!userTerm || userTerm.length < 2) return [];

    try {
        console.log(`🤖 [AI] Calling OpenAI for term: "${userTerm}"`);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Sos un asistente de búsqueda para una app de lista de compras de supermercado en Argentina.

Tu tarea es interpretar qué producto quiere el usuario y devolver las categorías de productos más probables.

REGLAS:
1. Devolvé entre 3 y 6 opciones de productos relevantes
2. Usá nombres en MAYÚSCULAS como aparecen en supermercados
3. Priorizá los productos más comunes primero
4. Si el usuario busca algo genérico (ej: "leche"), incluí las variantes principales
5. Excluí productos donde el término sea secundario (ej: para "leche" NO incluir "alfajor dulce de leche")

FORMATO: Devolvé SOLO un JSON array con los términos de búsqueda, sin explicación.

Ejemplo para "leche":
["LECHE ENTERA", "LECHE DESCREMADA", "LECHE CHOCOLATADA", "LECHE EN POLVO", "LECHE DESLACTOSADA"]`
                },
                {
                    role: 'user',
                    content: userTerm
                }
            ],
            temperature: 0.3,
            max_tokens: 150,
        });

        const content = response.choices[0]?.message?.content?.trim();
        console.log(`🤖 [AI] OpenAI response for "${userTerm}": ${content}`);

        if (!content) return [];

        // Parse JSON array from response
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map(s => String(s).toUpperCase());
        }
        return [];
    } catch (error) {
        console.error('🤖 [AI] OpenAI Error:', error);

        return [];
    }
}
