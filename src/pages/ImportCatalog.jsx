import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function ImportCatalogPage() {
  const [catalogText, setCatalogText] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  const handleClearCatalog = async () => {
    if (!confirm("Tem certeza que deseja limpar TODOS os chunks do catálogo no Firebase? Esta ação não pode ser desfeita.")) {
      return;
    }

    setStatus("");
    setMessage("Limpando catálogo no Firebase...");
    setLoading(true);

    try {
      const result = await base44.functions.invoke('clearFirebaseCatalog');
      
      if (result.data.status === 'success') {
        setStatus("success");
        setMessage(result.data.message);
      } else {
        throw new Error(result.data.message || "Erro ao limpar catálogo");
      }
    } catch (error) {
      console.error("Erro ao limpar catálogo:", error);
      setStatus("error");
      setMessage(`Erro ao limpar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCatalog = async () => {
    if (!catalogText.trim()) {
      setStatus("error");
      setMessage("Por favor, cole o texto do catálogo abaixo.");
      return;
    }

    setStatus("");
    setMessage("");
    setExtractedData(null);
    setLoading(true);

    try {
      setMessage("Processando e salvando o catálogo no Firebase...");

      const importResult = await base44.functions.invoke('importCatalogToFirebase', {
        catalogText: catalogText
      });

      if (importResult.data.status === 'success') {
        setStatus("success");
        setMessage(importResult.data.message);
        setExtractedData(importResult.data.sample_chunks || []);
      } else {
        throw new Error(importResult.data.message || "Erro ao importar catálogo");
      }

    } catch (error) {
      console.error("Erro no processo de importação:", error);
      setStatus("error");
      setMessage(`Falha na importação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <Card className={`max-w-4xl mx-auto shadow-lg transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader className={`border-b transition-colors duration-300 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <CardTitle className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Upload className="inline-block w-8 h-8 mr-3 text-purple-500" />
            Importar Catálogo de Peças (Admin)
          </CardTitle>
          <CardDescription className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Cole o texto do catálogo abaixo e clique em "Importar" para processar e salvar no Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label htmlFor="catalog-text" className={`mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Texto do Catálogo
            </Label>
            <Textarea
              id="catalog-text"
              value={catalogText}
              onChange={(e) => setCatalogText(e.target.value)}
              placeholder="Cole aqui o texto completo do catálogo de peças..."
              className={`w-full min-h-[300px] transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
              }`}
              disabled={loading}
            />
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              💡 Dica: Abra o PDF do catálogo, selecione todo o texto (Ctrl+A) e cole aqui.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleImportCatalog}
              disabled={loading || !catalogText.trim()}
              className={`flex-1 py-3 text-lg font-semibold flex items-center justify-center gap-2 
                bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700
                disabled:opacity-50 transition-all duration-300 ${loading ? 'cursor-not-allowed' : ''}`}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Processando..." : "Importar Catálogo"}
            </Button>

            <Button
              onClick={handleClearCatalog}
              disabled={loading}
              variant="destructive"
              className="py-3 px-6 flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Catálogo
            </Button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                status === "success"
                  ? `${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`
                  : status === "error"
                  ? `${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`
                  : `${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`
              } transition-colors duration-300`}
            >
              {status === "success" ? <CheckCircle className="w-5 h-5" /> : status === "error" ? <XCircle className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{message}</span>
            </div>
          )}

          {extractedData && extractedData.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Amostra dos Chunks Criados
              </h3>
              <div className={`p-4 rounded-lg border max-h-96 overflow-auto ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
              }`}>
                <pre className={`whitespace-pre-wrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}