import React from "react";
import { motion } from "framer-motion";
import { Camera, Search, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const JarvisLogo = ({ size = "w-16 h-16" }) => (
  <div className={`${size} rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center shadow-2xl`}>
    <span className="text-white font-bold text-2xl">J</span>
  </div>
);

export default function WelcomeScreen({ darkMode, onSendMessage }) {
  const quickActions = [
    {
      icon: Camera,
      title: "Identificar Peça",
      description: "Envie uma foto da peça para identificação automática",
      action: () => onSendMessage("Quero identificar uma peça de empilhadora. Como posso enviar a foto?")
    },
    {
      icon: Search,
      title: "Buscar no Catálogo", 
      description: "Procure peças por código, nome ou modelo",
      action: () => onSendMessage("Preciso buscar uma peça específica no catálogo. Como posso fazer isso?")
    },
    {
      icon: Package,
      title: "Verificar Estoque",
      description: "Consulte disponibilidade e preços das peças",
      action: () => onSendMessage("Quero verificar o estoque e preço de algumas peças. Como faço?")
    },
    {
      icon: Wrench,
      title: "Ajuda Técnica",
      description: "Tire dúvidas sobre manutenção e reparo",
      action: () => onSendMessage("Estou com um problema técnico na minha empilhadora. Você pode me ajudar?")
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <JarvisLogo size="w-24 h-24" />
        </motion.div>

        <motion.h1
          className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Olá! Eu sou o{' '}
          <span className="bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
            Jarvis
          </span>
        </motion.h1>

        <motion.p
          className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Seu assistente especialista em{' '}
          <span className="font-semibold text-purple-600">empilhadeiras</span>. 
          Posso identificar peças por imagem, consultar o catálogo, verificar estoques e ajudar com manutenção.
        </motion.p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              onClick={action.action}
              className={`w-full h-auto p-6 flex flex-col items-start gap-3 transition-all duration-300 ${
                darkMode 
                  ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-purple-500 text-gray-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-purple-400 text-gray-900'
              } shadow-lg hover:shadow-xl`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-3 rounded-lg transition-colors duration-300 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <action.icon className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className={`mt-12 text-center text-sm transition-colors duration-300 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p>📸 <strong>Dica:</strong> Tire uma foto clara da peça que você quer identificar - eu reconheço e encontro o código no catálogo!</p>
      </motion.div>
    </div>
  );
}