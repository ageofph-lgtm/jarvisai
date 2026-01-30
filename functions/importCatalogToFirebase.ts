import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        console.log("=== Iniciando importCatalogToFirebase ===");
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { catalogText } = await req.json();
        
        if (!catalogText || typeof catalogText !== 'string') {
            return Response.json({ error: 'catalogText é obrigatório' }, { status: 400 });
        }

        console.log(`Texto do catálogo recebido: ${catalogText.length} caracteres`);

        const firebaseConfig = JSON.parse(Deno.env.get("FIREBASE_CONFIG"));
        const projectId = firebaseConfig.projectId;

        // Dividir o texto em chunks de ~2000 caracteres
        const chunkSize = 2000;
        const chunks = [];
        
        for (let i = 0; i < catalogText.length; i += chunkSize) {
            chunks.push(catalogText.substring(i, i + chunkSize));
        }

        console.log(`Texto dividido em ${chunks.length} chunks`);

        // Processar TODOS os chunks
        const processedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Extrair keywords ricas do texto
            const keywords = extractKeywordsFromText(chunk);
            
            if (i % 50 === 0) {
                console.log(`Processados ${i}/${chunks.length} chunks...`);
            }
            
            processedChunks.push({
                content: chunk,
                keywords: keywords
            });
        }

        console.log(`${processedChunks.length} chunks processados. Salvando no Firestore...`);

        // Salvar chunks no Firestore
        let savedCount = 0;
        
        for (let i = 0; i < processedChunks.length; i++) {
            const processedChunk = processedChunks[i];
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_chunks`;
            
            const docData = {
                fields: {
                    content: { stringValue: processedChunk.content },
                    keywords: {
                        arrayValue: {
                            values: processedChunk.keywords.map(kw => ({ stringValue: kw }))
                        }
                    }
                }
            };

            const response = await fetch(firestoreUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(docData)
            });

            if (response.ok) {
                savedCount++;
                if (savedCount % 50 === 0) {
                    console.log(`Salvos ${savedCount}/${processedChunks.length} chunks...`);
                }
            } else {
                const errorText = await response.text();
                console.error(`Erro ao salvar chunk ${i}:`, errorText);
            }
        }

        console.log(`${savedCount}/${processedChunks.length} chunks salvos no Firestore`);

        return Response.json({
            status: 'success',
            message: `Catálogo importado! ${savedCount} chunks salvos no Firebase.`,
            sample_chunks: processedChunks.slice(0, 2).map(c => ({
                keywords: c.keywords.slice(0, 15),
                content_preview: c.content.substring(0, 150) + "..."
            }))
        });

    } catch (error) {
        console.error('=== ERRO ao importar catálogo ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        return Response.json({
            status: 'error',
            message: error.message,
            details: 'Erro ao processar e importar catálogo'
        }, { status: 500 });
    }
});

// Função auxiliar para extrair keywords MUITO RICAS de um texto
function extractKeywordsFromText(text) {
    const keywords = new Set();
    const textLower = text.toLowerCase();
    
    // 1. Extrair TODAS as palavras de 3+ letras (mais agressivo)
    const allWords = text.match(/\b[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]{3,}\b/gi);
    if (allWords) {
        const uniqueWords = [...new Set(allWords.map(w => w.toLowerCase()))];
        
        // Filtrar apenas palavras muito comuns (artigos curtos)
        const stopWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'para', 'com', 'que', 'por', 'und', 'der', 'die', 'das', 'mit', 'von'];
        const filtered = uniqueWords.filter(w => !stopWords.includes(w));
        
        // Adicionar TODAS as palavras (sem limite)
        filtered.forEach(word => keywords.add(word));
    }
    
    // 2. Extrair códigos de peças (padrões variados)
    const codePatterns = [
        /\b\d{3,10}\b/g,                         // 123, 1234, 12345678
        /\b[A-Z]{2,5}[-\s]?\d{2,5}\b/gi,        // RX-20, MSG95, FG-314
        /\b\d{2,3}[.\s]\d{2,3}[.\s]\d{2,5}\b/g, // 12.34.567
        /\b[A-Z]{2,5}\d{2,5}[A-Z]?\b/gi,        // MSG95G, RX20C
        /\b[A-Z]\d{4,8}\b/gi,                    // A1234, B56789
    ];
    
    for (const pattern of codePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => keywords.add(match.toLowerCase().trim()));
        }
    }
    
    // 3. Termos específicos importantes de empilhadoras/peças
    const importantTerms = [
        // Peças principais
        'assento', 'banco', 'seat', 'sitz', 'cushion', 'almofada',
        'grammer', 'msg', 'respaldo', 'backrest', 'rückenlehne',
        
        // Marcas
        'linde', 'still', 'toyota', 'yale', 'jungheinrich', 'hyster',
        'crown', 'caterpillar', 'mitsubishi', 'nissan', 'komatsu',
        
        // Componentes gerais
        'empilhadora', 'empilhador', 'forklift', 'gabelstapler',
        'motor', 'filtro', 'filter', 'óleo', 'oil', 'hydraulic', 'hidráulico',
        'elétrico', 'electric', 'cabina', 'cabine', 'cabin', 'kabine',
        'volante', 'steering', 'lenkung', 'roda', 'wheel', 'rad',
        'pneu', 'tire', 'reifen', 'mastro', 'mast', 'cilindro', 'cylinder',
        'válvula', 'valve', 'ventil', 'corrente', 'chain', 'kette',
        'freio', 'brake', 'bremse', 'travão', 'direcção', 'direção',
        'transmissão', 'transmission', 'getriebe', 'diferencial', 'differential',
        'eixo', 'axle', 'achse', 'rolamento', 'bearing', 'lager',
        'junta', 'gasket', 'dichtung', 'vedação', 'seal', 'mangueira',
        'hose', 'schlauch', 'tubo', 'tube', 'rohr', 'parafuso', 'screw',
        'schraube', 'bolt', 'porca', 'nut', 'mutter', 'arruela', 'washer',
        'bateria', 'battery', 'batterie', 'alternador', 'alternator',
        'farol', 'headlight', 'scheinwerfer', 'lanterna', 'lamp',
        'espelho', 'mirror', 'spiegel', 'cinto', 'belt', 'gurt',
        'segurança', 'safety', 'sicherheit', 'pedal', 'alavanca', 'lever',
        'garfo', 'fork', 'gabel', 'operador', 'operator', 'bediener',
        
        // Peças específicas de assento/banco
        'ergonômico', 'ergonomic', 'ergonomisch', 'apoio', 'support', 'stütze',
        'estofamento', 'padding', 'polster', 'amortecedor', 'shock', 'absorber',
        'braço', 'armrest', 'armlehne', 'ajustável', 'adjustable',
        'confortável', 'comfortable', 'komfortabel', 'encosto', 'reclinável'
    ];
    
    for (const term of importantTerms) {
        if (textLower.includes(term)) {
            keywords.add(term);
        }
    }
    
    // 4. Extrair palavras compostas com hífen (ex: "shock-absorber", "all-terrain")
    const hyphenatedWords = text.match(/\b[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+-[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+\b/gi);
    if (hyphenatedWords) {
        hyphenatedWords.forEach(word => keywords.add(word.toLowerCase()));
    }
    
    return Array.from(keywords).slice(0, 150); // Aumentar limite para 150 keywords por chunk
}