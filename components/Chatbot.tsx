import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPublicAIInsight } from '../services/aiService';
import { AIResponse, TableData } from '../types';
import ReactMarkdown from 'react-markdown';
import { SparklesIcon } from './icons';

interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
}

const SimpleTable: React.FC<{ data: TableData }> = ({ data }) => {
    if (!data || !data.headers || !data.rows) return null;
    return (
        <div className="overflow-auto max-h-60 mt-3 border border-gray-200 dark:border-gray-600 rounded-lg">
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
                </tbody>
            </table>
        </div>
    );
};

interface ChatbotProps {
    onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
        sender: 'ai', 
        content: { 
            displayText: '¡Hola! Soy el asistente virtual de GestionFarma. ¿En qué puedo ayudarte?',
            suggestions: ["¿Qué medicamentos para la gripe tienes?", "Muéstrame los precios de los analgésicos", "¿Cuál es su horario de atención?"]
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
      const aiResponse = await getPublicAIInsight(prompt);
      const aiMessage: Message = { sender: 'ai', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting public AI response:", error);
      const errorMessage: Message = { 
          sender: 'ai', 
          content: {
              displayText: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.'
          } 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSend = () => sendMessageToAI(input);
  const handleSuggestionClick = (suggestion: string) => sendMessageToAI(suggestion);
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4" onClick={onClose}>
        <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md h-[70vh] flex flex-col animate-slide-in-up" 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-soft-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <SparklesIcon className="h-6 w-6 text-clinical-blue" />
                    <h2 className="ml-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Asistente Virtual</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const content = msg.content;
                    if (isUser && typeof content === 'string') {
                        return (
                          <div key={index} className="flex justify-end">
                            <div className="max-w-xs px-4 py-2 rounded-xl bg-clinical-blue text-white">{content}</div>
                          </div>
                        );
                    }
                    if (!isUser && typeof content === 'object') {
                        const aiContent = content as AIResponse;
                        return (
                          <div key={index} className="flex justify-start">
                            <div className="max-w-xs px-4 py-3 rounded-xl bg-soft-gray-100 dark:bg-gray-700 w-full">
                                <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert"><ReactMarkdown>{aiContent.displayText}</ReactMarkdown></div>
                                {aiContent.table && <SimpleTable data={aiContent.table} />}
                                {aiContent.suggestions && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {aiContent.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => handleSuggestionClick(s)} className="px-2.5 py-1 text-xs bg-clinical-blue/10 text-clinical-blue dark:bg-clinical-blue/20 rounded-full hover:bg-clinical-blue/20 dark:hover:bg-clinical-blue/30">
                                            {s}
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
                        <div className="max-w-xs px-4 py-3 rounded-xl bg-soft-gray-100 dark:bg-gray-700">
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
            <div className="p-4 border-t border-soft-gray-200 dark:border-gray-700">
                <div className="relative">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Escribe tu consulta..." className="w-full pl-4 pr-12 py-3 text-gray-700 bg-soft-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-blue dark:bg-gray-700 dark:text-gray-200" disabled={isLoading} />
                    <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-clinical-blue disabled:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
        <style>{`
            @keyframes slide-in-up {
                0% { transform: translateY(100%); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-in-up { animation: slide-in-up 0.3s ease-out; }
        `}</style>
    </div>
  );
};

export default Chatbot;
