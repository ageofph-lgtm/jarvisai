import React, { useState, useRef } from "react";
import { Send, Paperclip, Camera, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export default function MessageInput({ onSendMessage, darkMode }) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleSend = () => {
    if (input.trim() || selectedImage) {
      onSendMessage(input.trim() || "Imagem enviada", selectedImage);
      setInput("");
      removeImage();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        setImageError(`Formato não suportado. Use PNG, JPEG, GIF ou WEBP.`);
        setSelectedImage(null);
        setImagePreview(null);
        return;
      }
      setImageError(null);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {imageError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
              darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{imageError}</span>
          </motion.div>
        )}
        {imagePreview && !imageError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-xl p-4 border-2 border-dashed transition-colors duration-300 ${
              darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-lg shadow-md"
              />
              <div className="flex-1">
                <p className={`font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Imagem selecionada
                </p>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {selectedImage?.name || "Imagem da câmera"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeImage}
                className={`transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'
                }`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
        darkMode 
          ? 'border-gray-600 bg-gray-800 focus-within:border-purple-500' 
          : 'border-gray-300 bg-white focus-within:border-purple-400'
      } shadow-lg focus-within:shadow-xl`}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem ou envie uma imagem..."
          className={`min-h-[60px] max-h-[200px] resize-none border-0 rounded-2xl pr-24 transition-colors duration-300 ${
            darkMode 
              ? 'bg-transparent text-gray-100 placeholder:text-gray-400' 
              : 'bg-transparent text-gray-900 placeholder:text-gray-500'
          } focus-visible:ring-0 focus-visible:ring-offset-0`}
        />
        
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className={`h-10 w-10 transition-colors duration-200 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-purple-400' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-purple-500'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => cameraInputRef.current?.click()}
            className={`h-10 w-10 transition-colors duration-200 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-purple-400' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-purple-500'
            }`}
          >
            <Camera className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || !!imageError}
            className="h-10 w-10 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}