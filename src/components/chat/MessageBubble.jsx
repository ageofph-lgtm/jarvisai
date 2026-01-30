
import React from "react";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import ForkliftAnalysisResult from "./ForkliftAnalysisResult";

const JarvisLogo = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-lg">J</span>
  </div>
);

export default function MessageBubble({ message, darkMode }) {
  const isUser = message.sender === 'user';
  
  return (
    <motion.div 
      className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, x: isUser ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <JarvisLogo />
        </div>
      )}
      
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <motion.div
          className={`px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 ${
            isUser 
              ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white' 
              : darkMode 
                ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                : 'bg-white text-gray-800 border border-gray-200'
          }`}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          {message.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-3"
            >
              <img 
                src={message.image_url} 
                alt="Peça de empilhadora" 
                className="rounded-xl max-w-full h-auto shadow-md"
              />
            </motion.div>
          )}
          
          <div className="whitespace-pre-wrap leading-relaxed font-medium">
            {message.content}
          </div>
        </motion.div>

        {/* Mostrar análise de peça se disponível */}
        {!isUser && message.analysisData && (
          <div className="mt-4">
            <ForkliftAnalysisResult 
              analysisData={message.analysisData} 
              darkMode={darkMode} 
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
          darkMode 
            ? 'bg-gray-700 border-2 border-red-500' 
            : 'bg-gray-600 border-2 border-red-400'
        }`}>
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </motion.div>
  );
}
