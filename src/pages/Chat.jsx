
import React, { useState, useEffect, useRef, useCallback } from "react";
// This will be replaced by base44.integrations.Core
// This will be replaced by base44.entities.ChatMessage
import { motion, AnimatePresence } from "framer-motion";
// This import will be removed as it's no longer used

import { base44 } from "@/api/base44Client"; // Added import

import MessageBubble from "../components/chat/MessageBubble";
import MessageInput from "../components/chat/MessageInput";
import TypingIndicator from "../components/chat/TypingIndicator";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import ForkliftAnalysisResult from "../components/chat/ForkliftAnalysisResult";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      // Changed from ChatMessage.filter to base44.entities.ChatMessage.filter
      const chatMessages = await base44.entities.ChatMessage.filter({ session_id: sessionId }, "created_date");
      setMessages(chatMessages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }, [sessionId]);

  useEffect(() => {
    loadMessages();
  }, [sessionId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const sendMessage = async (content, imageFile = null) => {
    try {
      let imageUrl = null;
      
      if (imageFile) {
        // Changed from UploadFile to base44.integrations.Core.UploadFile
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      // Changed from ChatMessage.create to base44.entities.ChatMessage.create
      const userMessage = await base44.entities.ChatMessage.create({
        sender: "user",
        content: content,
        image_url: imageUrl,
        session_id: sessionId
      });

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      let aiResponse = "";
      let analysisData = null;

      if (imageUrl) {
        try {
          // Identificação inicial da peça
          // Modified prompt to include search_keywords
          const identificationPrompt = `Analise esta imagem e tente identificar se é uma peça de empilhadora/empilhador.

Se conseguir identificar a peça, responda em JSON com:
- name: nome da peça
- description: descrição detalhada
- category: categoria (motor, transmissao, hidraulico, eletrico, chassi, rodas, cabine, mastro, cilindros, filtros, outros)
- confidence: nível de confiança (0-100)
- characteristics: características visuais
- search_keywords: array de palavras-chave para buscar no catálogo (códigos, nomes técnicos, etc)

Se NÃO conseguir identificar ou NÃO for uma peça de empilhadora, responda:
- name: "Não identificado"
- description: "Não foi possível identificar esta peça ou não parece ser uma peça de empilhadora"
- category: "outros"
- confidence: 0
- characteristics: descrição do que vê na imagem
- search_keywords: []

Mensagem do usuário: ${content}`;

          // Changed from InvokeLLM to base44.integrations.Core.InvokeLLM
          // Modified response_json_schema to include search_keywords
          const identificationResult = await base44.integrations.Core.InvokeLLM({
            prompt: identificationPrompt,
            file_urls: [imageUrl],
            response_json_schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                confidence: { type: "number" },
                characteristics: { type: "string" },
                search_keywords: { 
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["name", "description", "category", "confidence", "characteristics", "search_keywords"]
            },
            add_context_from_internet: false
          });

          // Modified safeResult to include search_keywords
          const safeResult = {
            name: identificationResult?.name || "Peça não identificada",
            description: identificationResult?.description || "Não foi possível identificar esta peça",
            category: identificationResult?.category || "outros",
            confidence: identificationResult?.confidence || 0,
            characteristics: identificationResult?.characteristics || "Imagem analisada mas peça não reconhecida",
            search_keywords: identificationResult?.search_keywords || []
          };

          let matchingParts = [];

          // Se tiver confiança razoável e keywords, buscar no Firebase
          if (safeResult.confidence > 20 && safeResult.search_keywords.length > 0) {
            try {
              // New integration with base44.functions.invoke to search Firebase
              const catalogSearchResult = await base44.functions.invoke('searchFirebaseCatalog', {
                searchTerms: safeResult.search_keywords
              });

              if (catalogSearchResult.data?.results && Array.isArray(catalogSearchResult.data.results)) {
                matchingParts = catalogSearchResult.data.results;
              }
            } catch (catalogError) {
              console.error("Erro ao buscar no catálogo Firebase:", catalogError);
            }
          }

          analysisData = {
            identified_part: safeResult,
            matches: matchingParts, // Use the results from Firebase search
            confidence: safeResult.confidence
          };

          // Gerar resposta baseada no resultado
          if (safeResult.confidence >= 60 && safeResult.name !== "Não identificado") {
            if (matchingParts.length > 0) {
              aiResponse = `🔍 **Análise Concluída**

Identifiquei a peça como: **${safeResult.name}**
Confiança: ${safeResult.confidence}%

✅ Encontrei **${matchingParts.length}** peça(s) correspondente(s) no catálogo do Firebase.

${safeResult.description}

Veja os detalhes das peças encontradas abaixo!`;
            } else {
              aiResponse = `🔍 **Análise Concluída**

Identifiquei a peça como: **${safeResult.name}**
Confiança: ${safeResult.confidence}%

${safeResult.description}

❌ Não encontrei peças correspondentes no catálogo.

💡 **Sugestão**: Esta peça pode não estar no inventário ou pode ser de um modelo específico não catalogado.`;
            }
          } else if (safeResult.confidence >= 20 && safeResult.name !== "Não identificado") {
            aiResponse = `🔍 **Análise Parcial**

Consegui identificar algumas características da peça:
- **Possível identificação**: ${safeResult.name}
- **Confiança**: ${safeResult.confidence}%
- **Características observadas**: ${safeResult.characteristics}

${matchingParts.length > 0 ? 
  `Encontrei ${matchingParts.length} peça(s) que podem ser relacionadas no catálogo.` :
  'Não encontrei correspondências diretas no catálogo.'
}

💡 **Para melhorar a identificação**: Tire uma foto mais próxima, com melhor iluminação, ou de outro ângulo.`;
          } else {
            aiResponse = `🔍 **Análise da Imagem**

Analisei a imagem mas não consegui identificar com certeza se é uma peça de empilhadora.

**O que observei**: ${safeResult.characteristics}

❓ **Possíveis motivos**:
- Pode não ser uma peça de empilhadora
- Imagem pode estar com pouca iluminação ou desfocada
- Ângulo pode estar dificultando a identificação
- Peça pode ser muito específica ou rara

💡 **Sugestões**:
- Tire uma foto mais nítida e com boa iluminação
- Tente um ângulo diferente
- Inclua objetos de referência para escala
- Descreva a peça por texto se souber o que é`;
          }

        } catch (imageError) {
          console.error("Erro na análise da imagem:", imageError);
          aiResponse = `❌ **Erro na Análise da Imagem**

Ocorreu um problema técnico ao analisar a imagem. Isso pode acontecer por:

- Formato de imagem não suportado completamente
- Imagem muito grande ou pequena
- Problema temporário no sistema de análise

💡 **Soluções**:
- Tente novamente com uma imagem em formato PNG ou JPEG
- Reduza o tamanho da imagem se estiver muito grande
- Descreva a peça por texto que eu posso ajudar a encontrar no catálogo`;
        }

      } else {
        // Resposta para mensagens de texto sobre empilhadoras
        const prompt = `Você é Jarvis, especialista em empilhadoras e suas peças.
        
Ajude o usuário com:
- Identificação de peças por descrição
- Busca no catálogo
- Códigos de referência
- Manutenção e reparo
- Especificações técnicas

Seja preciso e útil. Se o usuário descrever uma peça, sugira enviarem uma foto para identificação mais precisa.

Mensagem: ${content}`;

        // Changed from InvokeLLM to base44.integrations.Core.InvokeLLM
        aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: true
        });
      }

      // Changed from ChatMessage.create to base44.entities.ChatMessage.create
      const jarvisMessage = await base44.entities.ChatMessage.create({
        sender: "jarvis",
        content: aiResponse,
        session_id: sessionId
      });

      if (analysisData) {
        jarvisMessage.analysisData = analysisData;
      }

      setMessages(prev => [...prev, jarvisMessage]);
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Changed from ChatMessage.create to base44.entities.ChatMessage.create
      const errorMessage = await base44.entities.ChatMessage.create({
        sender: "jarvis",
        content: `❌ **Erro Inesperado**

Desculpe, ocorreu um erro técnico. Por favor:

1. Verifique se a imagem está em formato PNG, JPEG, GIF ou WEBP
2. Tente novamente em alguns segundos
3. Se o problema persistir, descreva a peça por texto

Estou aqui para ajudar! 🔧`,
        session_id: sessionId
      });
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <WelcomeScreen darkMode={darkMode} onSendMessage={sendMessage} />
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MessageBubble message={message} darkMode={darkMode} />
                    {message.sender === "jarvis" && message.analysisData && (
                      <ForkliftAnalysisResult
                        data={message.analysisData}
                        darkMode={darkMode}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TypingIndicator darkMode={darkMode} />
                </motion.div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={`border-t transition-colors duration-300 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <MessageInput onSendMessage={sendMessage} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
