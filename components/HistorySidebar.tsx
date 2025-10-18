import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { HistoryIcon, PlusIcon, TrashIcon, KeyIcon, EyeIcon, EyeOffIcon } from './icons';

interface HistorySidebarProps {
  history: HistoryItem[];
  activeId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClear: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  saveApiKey: boolean;
  onSaveApiKeyChange: (save: boolean) => void;
  onClearApiKey: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
    history, activeId, onLoad, onDelete, onNew, onClear,
    apiKey, onApiKeyChange, saveApiKey, onSaveApiKeyChange, onClearApiKey
}) => {
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    return (
        <aside className="bg-parchment-dark/80 backdrop-blur-sm text-ink-light flex flex-col h-full w-full">
            <div className="p-4 border-b border-golden-dark/20 flex justify-between items-center">
                <h2 className="text-xl font-serif text-golden-dark flex items-center gap-2"><HistoryIcon /> Histórico</h2>
                <button 
                    onClick={onNew}
                    className="flex items-center gap-2 bg-golden/20 text-golden-dark hover:bg-golden/30 font-semibold text-sm py-1 px-3 rounded-md transition"
                    title="Criar novo roteiro"
                >
                    <PlusIcon /> Novo
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {history.length === 0 ? (
                    <p className="text-center p-4 text-sm text-ink-light/70">Nenhum roteiro salvo ainda.</p>
                ) : (
                    <ul>
                        {history.map(item => (
                            <li key={item.id} className={`border-b border-golden-dark/10 ${activeId === item.id ? 'bg-golden/20' : ''}`}>
                                <div className="w-full text-left p-3 hover:bg-golden/10 transition group flex justify-between items-center">
                                    <button onClick={() => onLoad(item.id)} className="flex-grow text-left">
                                        <p className="font-semibold truncate text-ink-DEFAULT">{item.formData.projectName || 'Roteiro Sem Título'}</p>
                                        <p className="text-xs text-ink-light truncate">{item.formData.story}</p>
                                        <p className="text-xs text-ink-light/70 mt-1">{new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </button>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-red-100 flex-shrink-0"
                                        title="Excluir item"
                                    >
                                        <TrashIcon />
                                     </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div className="p-4 border-t border-golden-dark/20 space-y-4 bg-parchment-dark/50">
                <h3 className="text-md font-serif text-golden-dark flex items-center gap-2"><KeyIcon className="h-5 w-5"/> Chave de API do Gemini</h3>
                
                <div className="relative">
                    <input 
                        type={isKeyVisible ? "text" : "password"}
                        placeholder="Cole sua chave de API aqui"
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        className="w-full p-2 pr-10 rounded-md border border-parchment-dark bg-parchment-light text-ink-DEFAULT text-sm focus:ring-2 focus:ring-golden focus:border-golden outline-none"
                    />
                    <button 
                        type="button"
                        onClick={() => setIsKeyVisible(!isKeyVisible)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-light/70 hover:text-golden-dark"
                        title={isKeyVisible ? "Ocultar chave" : "Mostrar chave"}
                    >
                        {isKeyVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>

                <div className="flex justify-between items-center">
                    <label htmlFor="saveApiKeyToggle" className="text-sm cursor-pointer">Salvar chave localmente</label>
                    <label htmlFor="saveApiKeyToggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox"
                            id="saveApiKeyToggle"
                            checked={saveApiKey}
                            onChange={(e) => onSaveApiKeyChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-parchment rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-golden-light peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden-dark"></div>
                    </label>
                </div>

                <button
                    onClick={onClearApiKey}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-700 font-semibold py-2 rounded-md transition"
                >
                    <TrashIcon className="h-4 w-4" />
                    Remover Chave
                </button>
            </div>

            {history.length > 0 && (
                 <div className="p-2 border-t border-golden-dark/20">
                    <button 
                        onClick={onClear} 
                        className="w-full text-center text-sm text-red-500 hover:bg-red-100 hover:text-red-700 p-2 rounded-md transition"
                    >
                        Limpar Histórico
                    </button>
                </div>
            )}
        </aside>
    );
};

export default HistorySidebar;