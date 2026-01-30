import React from "react";
import { motion } from "framer-motion";

const JarvisLogo = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-lg">J</span>
  </div>
);

export default function TypingIndicator({ darkMode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <JarvisLogo />
      </div>
      
      <motion.div
        className={`px-6 py-4 rounded-2xl shadow-lg transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Jarvis está digitando
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  darkMode ? 'bg-purple-400' : 'bg-purple-500'
                }`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}