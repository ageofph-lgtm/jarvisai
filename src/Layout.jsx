import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, Sun, Moon, Upload } from "lucide-react"; // Importar o ícone Upload
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const JarvisLogo = () => (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      darkMode ? 'bg-gradient-to-br from-purple-600 to-red-600' : 'bg-gradient-to-br from-purple-500 to-red-500'
    } shadow-lg`}>
      <span className="text-white font-bold text-lg">J</span>
    </div>
  );

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full transition-all duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <style>{`
          :root {
            --jarvis-primary: ${darkMode ? '#8b5cf6' : '#7c3aed'};
            --jarvis-secondary: ${darkMode ? '#ef4444' : '#dc2626'};
            --jarvis-bg: ${darkMode ? '#111827' : '#f9fafb'};
            --jarvis-surface: ${darkMode ? '#1f2937' : '#ffffff'};
            --jarvis-text: ${darkMode ? '#f3f4f6' : '#1f2937'};
            --jarvis-text-muted: ${darkMode ? '#9ca3af' : '#6b7280'};
          }
        `}</style>
        
        <Sidebar className={`border-r transition-colors duration-300 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <SidebarHeader className={`border-b p-6 transition-colors duration-300 ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <JarvisLogo />
              <div>
                <h2 className={`font-bold text-xl ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Jarvis</h2>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Assistente Inteligente</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <div className="space-y-2">
              <Link to={createPageUrl("Chat")}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Nova Conversa</span>
                </Button>
              </Link>
              {/* Novo link para a página de Importação de Catálogo */}
              <Link to={createPageUrl("ImportCatalog")}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Importar Catálogo</span>
                </Button>
              </Link>
            </div>

            <div className={`mt-8 pt-6 border-t space-y-4 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Tema</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`h-10 w-10 transition-colors duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className={`border-b px-6 py-4 md:hidden transition-colors duration-300 ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className={`hover:bg-opacity-10 p-2 rounded-lg transition-colors duration-200 ${
                darkMode ? 'hover:bg-white text-gray-300' : 'hover:bg-gray-900 text-gray-700'
              }`} />
              <div className="flex items-center gap-2">
                <JarvisLogo />
                <h1 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Jarvis</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}