import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        console.log("=== Iniciando clearFirebaseCatalog ===");
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const firebaseConfig = JSON.parse(Deno.env.get("FIREBASE_CONFIG"));
        const projectId = firebaseConfig.projectId;

        // Buscar todos os documentos
        const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_chunks`;
        
        console.log("Listando documentos...");
        const listResponse = await fetch(listUrl);
        
        if (!listResponse.ok) {
            throw new Error(`Erro ao listar documentos: ${listResponse.status}`);
        }

        const data = await listResponse.json();
        const documents = data.documents || [];

        console.log(`Encontrados ${documents.length} documentos para deletar`);

        if (documents.length === 0) {
            return Response.json({
                status: 'success',
                message: 'Nenhum documento encontrado para deletar.'
            });
        }

        // Deletar cada documento
        let deletedCount = 0;
        
        for (const doc of documents) {
            const deleteUrl = `https://firestore.googleapis.com/v1/${doc.name}`;
            
            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                deletedCount++;
            } else {
                console.error(`Erro ao deletar ${doc.name}:`, await deleteResponse.text());
            }
        }

        console.log(`${deletedCount} documentos deletados`);

        return Response.json({
            status: 'success',
            message: `${deletedCount} chunks deletados do Firebase com sucesso.`
        });

    } catch (error) {
        console.error('=== ERRO ao limpar catálogo ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        return Response.json({
            status: 'error',
            message: error.message
        }, { status: 500 });
    }
});