import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        console.log("=== Iniciando searchFirebaseCatalog ===");
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error("Usuário não autenticado");
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { searchTerms } = body;
        
        console.log("=== SearchTerms recebidos ===");
        console.log(JSON.stringify(searchTerms, null, 2));
        
        if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
            console.error("searchTerms inválido");
            return Response.json({ error: 'searchTerms é obrigatório e deve ser um array' }, { status: 400 });
        }

        const firebaseConfigStr = Deno.env.get("FIREBASE_CONFIG");
        
        if (!firebaseConfigStr) {
            throw new Error("FIREBASE_CONFIG não está configurado");
        }

        const firebaseConfig = JSON.parse(firebaseConfigStr);
        const projectId = firebaseConfig.projectId;
        
        console.log("ProjectId:", projectId);
        
        // Buscar apenas os PRIMEIROS 1000 documentos (para evitar timeout)
        let allDocuments = [];
        let pageToken = null;
        let pageCount = 0;
        const maxPages = 10; // 10 páginas * 100 docs = 1000 documentos
        
        do {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_chunks${pageToken ? `?pageToken=${pageToken}` : ''}`;
            
            const response = await fetch(firestoreUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro do Firestore:", errorText);
                throw new Error(`Erro ao buscar documentos do Firestore: ${response.status}`);
            }

            const data = await response.json();
            const documents = data.documents || [];
            
            allDocuments = allDocuments.concat(documents);
            pageToken = data.nextPageToken;
            pageCount++;
            
            console.log(`Página ${pageCount}: ${documents.length} documentos (total: ${allDocuments.length})`);
            
        } while (pageToken && pageCount < maxPages);

        console.log(`Total de documentos carregados: ${allDocuments.length}`);

        // Processar e pontuar os documentos
        const searchResults = new Map();
        let docsWithScore = 0;
        
        console.log("\n=== INICIANDO BUSCA ===");
        console.log(`Buscando por: ${searchTerms.join(', ')}`);
        
        // Termos de alta prioridade
        const highPriorityTerms = ['grammer', 'msg', 'msg95', 'assento', 'banco', 'seat', 'sitz'];
        
        for (const doc of allDocuments) {
            const docId = doc.name.split('/').pop();
            const fields = doc.fields || {};
            
            const content = fields.content?.stringValue || '';
            const keywords = fields.keywords?.arrayValue?.values?.map(v => v.stringValue) || [];
            
            let score = 0;
            const matchDetails = [];
            
            for (const term of searchTerms) {
                const cleanTerm = term.toLowerCase().trim();
                const words = cleanTerm.split(/\s+/);
                
                for (const word of words) {
                    if (word.length < 3) continue;
                    
                    // Buscar palavra completa nas keywords
                    for (const kw of keywords) {
                        const kwLower = kw.toLowerCase();
                        
                        // Match EXATO de palavra completa
                        if (kwLower === word) {
                            const points = highPriorityTerms.includes(word) ? 10 : 5;
                            score += points;
                            matchDetails.push(`Exact: "${word}"`);
                            break;
                        }
                        
                        // Match de substring APENAS se ambos tiverem 4+ caracteres
                        if (word.length >= 4 && kwLower.length >= 4) {
                            if (kwLower.includes(word) || word.includes(kwLower)) {
                                const points = highPriorityTerms.includes(word) ? 3 : 1;
                                score += points;
                                matchDetails.push(`Partial: "${word}"`);
                                break;
                            }
                        }
                    }
                    
                    // Buscar palavra completa no content
                    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
                    if (wordRegex.test(content)) {
                        const points = highPriorityTerms.includes(word) ? 5 : 2;
                        score += points;
                        matchDetails.push(`Content: "${word}"`);
                    }
                }
            }
            
            if (score > 0) {
                searchResults.set(docId, {
                    id: docId,
                    content: content,
                    keywords: keywords,
                    score: score,
                    matchDetails: matchDetails
                });
                docsWithScore++;
            }
        }

        console.log(`\n=== RESUMO DA BUSCA ===`);
        console.log(`Docs com pontuação: ${docsWithScore}/${allDocuments.length}`);

        // Ordenar por score e pegar os top 3 (reduzido para ser mais rápido)
        const sortedResults = Array.from(searchResults.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        console.log(`Top ${sortedResults.length} chunks selecionados`);

        if (sortedResults.length === 0) {
            console.log("⚠️ NENHUM MATCH ENCONTRADO!");
            
            return Response.json({ 
                results: [],
                message: 'Nenhuma peça encontrada no catálogo para os termos fornecidos.',
                debug: {
                    totalDocs: allDocuments.length,
                    searchTerms: searchTerms
                }
            });
        }

        // Usar IA para extrair dados estruturados de cada chunk
        const extractedParts = [];
        
        for (const chunk of sortedResults) {
            try {
                console.log(`Extraindo dados do chunk ${chunk.id} (score: ${chunk.score})...`);
                
                const extractionPrompt = `Analise o seguinte texto de um catálogo de peças e extraia TODAS as peças mencionadas.

Texto do catálogo:
${chunk.content}

Para cada peça encontrada, extraia:
- reference_code: o código/número da peça
- part_name: o nome/descrição da peça
- description: qualquer informação adicional

Retorne um array de objetos, um para cada peça.`;

                const extractedData = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: extractionPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            parts: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        reference_code: { type: "string" },
                                        part_name: { type: "string" },
                                        description: { type: "string" }
                                    },
                                    required: ["reference_code", "part_name"]
                                }
                            }
                        },
                        required: ["parts"]
                    }
                });

                if (extractedData.parts && Array.isArray(extractedData.parts)) {
                    extractedParts.push(...extractedData.parts.map(part => ({
                        ...part,
                        category: "catalog",
                        source_chunk_id: chunk.id,
                        relevance_score: chunk.score
                    })));
                }
            } catch (error) {
                console.error(`Erro ao extrair dados do chunk ${chunk.id}:`, error.message);
            }
        }

        console.log(`Total de peças extraídas: ${extractedParts.length}`);

        return Response.json({ 
            results: extractedParts,
            total_chunks_analyzed: sortedResults.length,
            message: extractedParts.length > 0 
                ? `Encontradas ${extractedParts.length} peça(s) no catálogo.`
                : 'Não foi possível extrair informações estruturadas dos chunks encontrados.'
        });

    } catch (error) {
        console.error('=== ERRO CRÍTICO ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        return Response.json({ 
            error: error.message,
            details: 'Erro ao buscar no catálogo do Firebase'
        }, { status: 500 });
    }
});