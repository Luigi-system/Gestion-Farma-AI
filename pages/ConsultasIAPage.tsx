import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuitIcon } from '../components/icons';
import { getAIInsight } from '../services/aiService';
import { AIResponse, TableData } from '../types';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../components/Auth';

interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
}

const SimpleTable: React.FC<{ data: TableData }> = ({ data }) => {
    if (!data || !data.headers || !data.rows) return null;
    return (
        <div className="overflow-auto max-h-72 mt-3 border border-gray-200 dark:border-gray-600 rounded-lg">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-600 sticky top-0 z-10">
                    <tr>
                        {data.headers.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-800 dark:text-gray-100">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {data.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{String(cell)}</td>
                            ))}
                        </tr>
                    ))}
                     {data.rows.length === 0 && (
                        <tr>
                            <td colSpan={data.headers.length} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No se encontraron datos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


const ConsultasIAPage: React.FC = () => {
  const { sede, empresa } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { 
        sender: 'ai', 
        content: { 
            displayText: 'Hola, soy GestionFarma AI. Estoy conectado a toda tu base de datos y puedo responder preguntas complejas. ¿Qué te gustaría saber hoy?',
            suggestions: ["¿Cuál fue el producto más vendido hoy?", "Muéstrame los productos con bajo stock", "¿Cuál fue la última venta?"]
        } 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessageToAI = useCallback(async (prompt: string) => {
    if (prompt.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIInsight(prompt, sede?.id, empresa?.id);
      const aiMessage: Message = { sender: 'ai', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = { 
          sender: 'ai', 
          content: {
              displayText: 'Lo siento, ocurrió un error al procesar tu solicitud. Revisa la consola para más detalles.'
          } 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sede, empresa]);

  const handleSend = () => {
    sendMessageToAI(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessageToAI(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-lg shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-soft-gray-200 dark:border-gray-700">
        <BrainCircuitIcon className="h-6 w-6 text-clinical-blue" />
        <h2 className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-100">Asistente de Consultas IA</h2>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const content = msg.content;

            if (isUser && typeof content === 'string') {
                return (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-xl lg:max-w-4xl px-4 py-3 rounded-xl bg-clinical-blue text-white">
                        {content}
                    </div>
                  </div>
                );
            }
            
            if (!isUser && typeof content === 'object') {
                const aiContent = content as AIResponse;
                return (
                  <div key={index} className="flex justify-start">
                    <div className="max-w-xl lg:max-w-4xl px-4 py-3 rounded-xl bg-soft-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 w-full">
                      <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert">
                        <ReactMarkdown>
                          {aiContent.displayText}
                        </ReactMarkdown>
                      </div>
                      {aiContent.table && <SimpleTable data={aiContent.table} />}
                      {aiContent.suggestions && aiContent.suggestions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {aiContent.suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="px-3 py-1.5 text-xs bg-clinical-blue/10 text-clinical-blue dark:bg-clinical-blue/20 rounded-full hover:bg-clinical-blue/20 dark:hover:bg-clinical-blue/30 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
            }
            return null;
        })}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-lg px-4 py-3 rounded-xl bg-soft-gray-100 text-gray-800 dark:bg-gray-700">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-soft-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej: ¿Cuáles fueron las 5 ventas con mayor total esta semana?"
            className="w-full px-4 py-3 pr-12 text-gray-700 bg-soft-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-blue dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-clinical-blue disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-clinical-blue/10 dark:hover:bg-clinical-blue/20 rounded-r-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultasIAPage;
