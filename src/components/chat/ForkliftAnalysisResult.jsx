import React from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ForkliftAnalysisResult({ analysisData, darkMode }) {
  // Verificação de segurança
  if (!analysisData) {
    return null;
  }

  const { identified_part, matches, confidence } = analysisData;

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return darkMode ? 'text-green-400' : 'text-green-600';
    if (conf >= 60) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getStockStatus = (quantity) => {
    if (quantity > 10) return { icon: CheckCircle, text: 'Em estoque', color: 'text-green-500' };
    if (quantity > 0) return { icon: AlertCircle, text: 'Baixo estoque', color: 'text-yellow-500' };
    return { icon: AlertCircle, text: 'Sem estoque', color: 'text-red-500' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Análise da Peça */}
      {identified_part && (
        <Card className={`transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
                Peça Identificada
              </span>
              {confidence !== undefined && (
                <Badge 
                  variant="outline" 
                  className={`ml-auto ${getConfidenceColor(confidence)} border-current`}
                >
                  {confidence}% confiança
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {identified_part?.name || 'Peça não identificada'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {identified_part?.description}
                </p>
              </div>
              {identified_part?.category && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {identified_part.category}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peças Correspondentes no Catálogo */}
      {matches && matches.length > 0 && (
        <div className="space-y-3">
          <h3 className={`font-semibold text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Peças Encontradas no Catálogo ({matches.length})
          </h3>
          
          {matches.map((match, index) => (
            <Card key={index} className={`transition-colors duration-300 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className={`px-2 py-1 rounded text-sm font-mono ${
                        darkMode ? 'bg-gray-700 text-purple-300' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {match.reference_code}
                      </code>
                      {match.relevance_score && (
                        <Badge variant="outline" className="text-xs">
                          Relevância: {match.relevance_score}
                        </Badge>
                      )}
                    </div>
                    <h4 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {match.part_name}
                    </h4>
                    {match.description && (
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {match.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {match.category && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {match.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {matches && matches.length === 0 && (
        <Card className={`border-dashed transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          <CardContent className="p-6 text-center">
            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhuma peça correspondente foi encontrada no catálogo.
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Tente uma imagem mais clara ou entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}