import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Tone, Structure, FormData, GeneratedContent, GeneratedContentBlock, HistoryItem, ScriptContent } from './types';
import { TONES, STRUCTURES } from './constants';
import { generateFullScript, regenerateBlock } from './services/geminiService';
import { CopyButton } from './components/CopyButton';
import { LoadingSpinner, MenuIcon, SettingsIcon, PencilIcon } from './components/icons';
import { useHistory } from './hooks/useHistory';
import HistorySidebar from './components/HistorySidebar';
import AdjustmentModal from './components/AdjustmentModal';

const API_KEY_STORAGE = 'geminiApiKey';
const SAVE_API_KEY_PREF = 'saveGeminiApiKeyPref';

const initialFormData: FormData = {
    projectName: 'Novo Roteiro',
    story: 'A história de Davi e Golias, com foco na coragem e fé contra todas as probabilidades.',
    tone: Tone.Inspirador,
    structure: Structure.Padrao,
    includeVerses: true,
    includeReflections: true,
    titleIdeas: '',
    descriptionIdeas: '',
    thumbnailIdeas: '',
    targetAudience: 'Público geral',
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => (
  <header className="bg-parchment-dark/50 backdrop-blur-sm shadow-md sticky top-0 z-20 w-full">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
       <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-golden/20 md:hidden">
            <MenuIcon className="h-6 w-6 text-golden-dark" />
       </button>
      <div className='text-center flex-grow'>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-golden-dark">
            Roteirista Bíblico ✍️
        </h1>
        <p className="text-center text-sm text-ink-light mt-1">Crie histórias sagradas com emoção e propósito.</p>
      </div>
       <div className="w-10 md:hidden"></div> {/* Spacer to keep title centered */}
    </div>
  </header>
);

const InputCard: React.FC<{ children: React.ReactNode, title: string, icon: React.ReactNode }> = ({ children, title, icon }) => (
    <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
        <h2 className="text-xl font-bold font-serif text-golden-dark mb-4 flex items-center gap-2">{icon}{title}</h2>
        {children}
    </div>
);

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [appState, setAppState] = useState<'form' | 'confirming' | 'generating' | 'results'>('form');
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloading, setReloading] = useState<Partial<Record<GeneratedContentBlock, boolean>>>({});
    const { history, addHistoryItem, deleteHistoryItem, clearHistory } = useHistory();
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adjustmentState, setAdjustmentState] = useState<{
        isOpen: boolean;
        targetBlock: GeneratedContentBlock | null;
    }>({ isOpen: false, targetBlock: null });

    const [apiKey, setApiKey] = useState<string>('');
    const [saveApiKey, setSaveApiKey] = useState<boolean>(false);

    useEffect(() => {
        try {
            const savedPref = localStorage.getItem(SAVE_API_KEY_PREF);
            const shouldSave = savedPref === 'true';
            setSaveApiKey(shouldSave);
            if (shouldSave) {
                const savedKey = localStorage.getItem(API_KEY_STORAGE);
                if (savedKey) {
                    setApiKey(savedKey);
                }
            }
        } catch (e) {
            console.error("Failed to load API key preference from localStorage", e);
        }
    }, []);

    const handleApiKeyChange = (key: string) => {
        setApiKey(key);
        if (saveApiKey) {
            try {
                localStorage.setItem(API_KEY_STORAGE, key);
            } catch (e) {
                console.error("Failed to save API key to localStorage", e);
            }
        }
    };

    const handleSaveApiKeyChange = (shouldSave: boolean) => {
        setSaveApiKey(shouldSave);
        try {
            localStorage.setItem(SAVE_API_KEY_PREF, String(shouldSave));
            if (shouldSave) {
                localStorage.setItem(API_KEY_STORAGE, apiKey);
            } else {
                localStorage.removeItem(API_KEY_STORAGE);
            }
        } catch (e) {
             console.error("Failed to update API key preference in localStorage", e);
        }
    };
    
    const handleClearApiKey = () => {
        setApiKey('');
        try {
            if(localStorage.getItem(API_KEY_STORAGE)){
                localStorage.removeItem(API_KEY_STORAGE);
            }
        } catch(e) {
            console.error("Failed to clear API key from localStorage", e);
        }
    }


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const preGenerationCheck = () => {
        setError(null);
        if (!apiKey.trim()) {
            setError("Por favor, insira sua chave de API do Gemini na barra lateral para continuar.");
            return false;
        }
        return true;
    }

    const handleGenerate = async () => {
        if (!preGenerationCheck()) {
            setAppState('form');
            return;
        }
        setAppState('generating');
        try {
            const content = await generateFullScript(formData, apiKey);
            const newHistoryItem = addHistoryItem(formData, content);
            setGeneratedContent(content);
            setActiveHistoryId(newHistoryItem.id);
            setAppState('results');
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro desconhecido.');
            setAppState('form');
        }
    };
    
    const handleNewScript = () => {
        setFormData(initialFormData);
        setGeneratedContent(null);
        setActiveHistoryId(null);
        setAppState('form');
        setIsSidebarOpen(false);
    }

    const handleLoadHistory = (id: string) => {
        const item = history.find(h => h.id === id);
        if (item) {
            setFormData(item.formData);
            setGeneratedContent(item.generatedContent);
            setActiveHistoryId(item.id);
            setAppState('results');
            setIsSidebarOpen(false);
        }
    };

    const handleDeleteHistory = (id: string) => {
        const item = history.find(h => h.id === id);
        const projectName = item?.formData.projectName || 'Roteiro Sem Título';
        const confirmDelete = window.confirm(`Tem certeza que deseja apagar o roteiro "${projectName}"? Esta ação não pode ser desfeita.`);
        
        if (confirmDelete) {
            if (activeHistoryId === id) {
                handleNewScript();
            }
            deleteHistoryItem(id);
        }
    };

    const handleClearHistory = () => {
        const confirmClear = window.confirm("Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.");
        if (confirmClear) {
            clearHistory();
            handleNewScript();
        }
    };
    
    const openAdjustmentModal = (block: GeneratedContentBlock) => {
        setAdjustmentState({ isOpen: true, targetBlock: block });
    };

    const handleRegenerate = useCallback(async (block: GeneratedContentBlock, instruction: string) => {
        if (!generatedContent || !preGenerationCheck()) return;
        setReloading(prev => ({ ...prev, [block]: true }));
        setError(null);
        try {
            const newContent = await regenerateBlock(block, formData, generatedContent, instruction, apiKey);
            setGeneratedContent(prev => {
                if (!prev) return null;
                const updatedContent = { ...prev, [block]: newContent };
                if (block === 'tags' && typeof newContent === 'string') {
                    updatedContent.tags = newContent.split(',').map(tag => tag.trim());
                }
                return updatedContent;
            });
        } catch (e: any)
 {
            setError(e.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setReloading(prev => ({ ...prev, [block]: false }));
        }
    }, [formData, generatedContent, apiKey]);

    const fullScriptText = useMemo(() => {
        if (!generatedContent?.script) return '';
        const { introduction, development, conclusion } = generatedContent.script;
        return `INTRODUÇÃO\n\n${introduction}\n\n---\n\nDESENVOLVIMENTO\n\n${development}\n\n---\n\nCONCLUSÃO\n\n${conclusion}`;
    }, [generatedContent]);

    return (
        <div className="min-h-screen bg-parchment-light">
             <div className="flex h-screen">
                <div className="hidden md:block md:w-80 lg:w-96 flex-shrink-0 h-full shadow-lg">
                    <HistorySidebar 
                        history={history}
                        activeId={activeHistoryId}
                        onLoad={handleLoadHistory}
                        onDelete={handleDeleteHistory}
                        onNew={handleNewScript}
                        onClear={handleClearHistory}
                        apiKey={apiKey}
                        onApiKeyChange={handleApiKeyChange}
                        saveApiKey={saveApiKey}
                        onSaveApiKeyChange={handleSaveApiKeyChange}
                        onClearApiKey={handleClearApiKey}
                    />
                </div>
                <div 
                    className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <div 
                        className={`absolute left-0 top-0 h-full w-4/5 max-w-sm bg-parchment-light shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                         <HistorySidebar 
                            history={history}
                            activeId={activeHistoryId}
                            onLoad={handleLoadHistory}
                            onDelete={handleDeleteHistory}
                            onNew={handleNewScript}
                            onClear={handleClearHistory}
                            apiKey={apiKey}
                            onApiKeyChange={handleApiKeyChange}
                            saveApiKey={saveApiKey}
                            onSaveApiKeyChange={handleSaveApiKeyChange}
                            onClearApiKey={handleClearApiKey}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                                <p className="font-bold">Erro</p>
                                <p>{error}</p>
                            </div>
                        )}

                        {appState !== 'results' && (
                            <div className="space-y-6 animate-fade-in">
                                <InputCard title="Configurações do Roteiro" icon={<SettingsIcon className="h-5 w-5"/>}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col md:col-span-2">
                                            <label htmlFor="projectName" className="font-semibold mb-1 text-ink-light">Nome do Projeto</label>
                                            <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleFormChange} className="p-2 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none" />
                                        </div>
                                         <div className="flex flex-col">
                                            <label htmlFor="targetAudience" className="font-semibold mb-1 text-ink-light">Público-alvo</label>
                                            <input type="text" id="targetAudience" name="targetAudience" value={formData.targetAudience} onChange={handleFormChange} className="p-2 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="tone" className="font-semibold mb-1 text-ink-light">Tom Desejado</label>
                                            <select id="tone" name="tone" value={formData.tone} onChange={handleFormChange} className="p-2 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none">
                                                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="structure" className="font-semibold mb-1 text-ink-light">Estrutura Preferida</label>
                                            <select id="structure" name="structure" value={formData.structure} onChange={handleFormChange} className="p-2 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none">
                                                {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center space-x-2 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeVerses" name="includeVerses" checked={formData.includeVerses} onChange={handleFormChange} className="h-4 w-4 rounded text-golden-dark focus:ring-golden" />
                                                <label htmlFor="includeVerses">Incluir versículos/citações?</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="includeReflections" name="includeReflections" checked={formData.includeReflections} onChange={handleFormChange} className="h-4 w-4 rounded text-golden-dark focus:ring-golden" />
                                                <label htmlFor="includeReflections">Adicionar reflexões pessoais?</label>
                                            </div>
                                        </div>
                                    </div>
                                </InputCard>
                                <InputCard title="História e Sugestões" icon={<PencilIcon className="h-5 w-5"/>}>
                                    <div className="flex flex-col space-y-4">
                                        <div>
                                            <label htmlFor="story" className="font-semibold mb-1 text-ink-light">Prompt da História</label>
                                            <p className="text-sm text-ink-light/80 mb-2">Descreva a história que você quer contar. Seja detalhado para um resultado melhor (ex: "A história de José no Egito, focando em sua jornada de perdão e ascensão ao poder").</p>
                                            <textarea name="story" id="story" value={formData.story} onChange={handleFormChange} className="p-2 h-28 w-full rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none"></textarea>
                                        </div>
                                        <div>
                                            <label className="font-semibold mb-1 text-ink-light">Sugestões Manuais (Opcional)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                                <textarea name="titleIdeas" value={formData.titleIdeas} placeholder="Ideias de títulos..." onChange={handleFormChange} className="p-2 h-24 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none"></textarea>
                                                <textarea name="descriptionIdeas" value={formData.descriptionIdeas} placeholder="Ideias de descrição..." onChange={handleFormChange} className="p-2 h-24 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none"></textarea>
                                                <textarea name="thumbnailIdeas" value={formData.thumbnailIdeas} placeholder="Ideias de prompts para thumbnail..." onChange={handleFormChange} className="p-2 h-24 rounded-md border border-parchment-dark bg-parchment-light focus:ring-2 focus:ring-golden focus:border-golden outline-none"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </InputCard>
                                <div className="text-center pt-4">
                                    {appState === 'form' && <button onClick={() => setAppState('confirming')} className="bg-golden hover:bg-golden-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">Gerar Roteiro 🌟</button>}
                                    {appState === 'confirming' && (
                                        <div className="bg-parchment-dark p-4 rounded-lg inline-block">
                                            <p className="font-semibold mb-3">Posso gerar o roteiro completo com base nesses dados?</p>
                                            <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg mr-4">Sim, gerar agora!</button>
                                            <button onClick={() => setAppState('form')} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg">Voltar</button>
                                        </div>
                                    )}
                                    {appState === 'generating' && <LoadingSpinner />}
                                </div>
                            </div>
                        )}
                        
                        {appState === 'results' && generatedContent && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                    <h2 className="text-xl font-bold font-serif text-golden-dark mb-4">📖 Resumo da Geração</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><strong>PROJETO:</strong> {formData.projectName}</div>
                                        <div className="col-span-2"><strong>HISTÓRIA:</strong> {formData.story.substring(0, 50)}...</div>
                                        <div><strong>TOM:</strong> {formData.tone}</div>
                                    </div>
                                </div>

                                {Object.entries(reloading).some(([k, v]) => k === 'script' && v) ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                    <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-bold font-serif text-golden-dark">📜 Roteiro Principal</h2>
                                            <CopyButton textToCopy={fullScriptText}>Copiar Roteiro</CopyButton>
                                        </div>
                                        <div className="space-y-4 text-ink-light max-h-[32rem] overflow-y-auto pr-2 text-justify">
                                            <div>
                                                <h3 className="text-lg font-bold font-serif text-golden-dark mb-2 border-b-2 border-golden/20 pb-1">Introdução</h3>
                                                <p className="whitespace-pre-wrap">{generatedContent.script.introduction}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold font-serif text-golden-dark my-2 border-b-2 border-golden/20 pb-1">Desenvolvimento</h3>
                                                <p className="whitespace-pre-wrap">{generatedContent.script.development}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold font-serif text-golden-dark my-2 border-b-2 border-golden/20 pb-1">Conclusão</h3>
                                                <p className="whitespace-pre-wrap">{generatedContent.script.conclusion}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-golden/10 border-l-4 border-golden rounded-r-lg">
                                            <p className="text-sm text-ink-light">
                                                <strong className="font-semibold text-golden-dark">💡 Dica para Narração (TTS):</strong> Se for usar este roteiro em ferramentas como o CapCut, verifique se o idioma da narração artificial está configurado para <strong>Português (Brasil)</strong> para evitar que a voz saia em inglês.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    {Object.entries(reloading).some(([k, v]) => k === 'titles' && v) ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                        <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                            <h2 className="text-xl font-bold font-serif text-golden-dark mb-4">🎯 Títulos Sugeridos</h2>
                                            <ul className="space-y-3">
                                                {generatedContent.titles.map((title, i) => (
                                                    <li key={i} className="flex justify-between items-center bg-parchment-light p-2 rounded-md">
                                                        <span className="text-ink-light"><strong>{i + 1}️⃣</strong> {title}</span>
                                                        <CopyButton textToCopy={title} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {Object.entries(reloading).some(([k, v]) => k === 'description' && v) ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                        <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-bold font-serif text-golden-dark">📝 Descrição (SEO)</h2>
                                                <CopyButton textToCopy={generatedContent.description}>Copiar Descrição</CopyButton>
                                            </div>
                                            <p className="text-ink-light text-sm whitespace-pre-wrap">{generatedContent.description}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {Object.entries(reloading).some(([k, v]) => k === 'tags' && v) ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                        <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-bold font-serif text-golden-dark">🏷️ Tags</h2>
                                                <CopyButton textToCopy={Array.isArray(generatedContent.tags) ? generatedContent.tags.join(', ') : ''}>Copiar Tags</CopyButton>
                                            </div>
                                            <p className="text-ink-light text-sm">
                                                {Array.isArray(generatedContent.tags) ? generatedContent.tags.join(', ') : 'Tags não disponíveis'}
                                            </p>
                                        </div>
                                    )}

                                    {Object.entries(reloading).some(([k, v]) => k === 'thumbnailPrompts' && v) ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                        <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark">
                                            <h2 className="text-xl font-bold font-serif text-golden-dark mb-4">🖼️ Prompts para Thumbnail</h2>
                                            <ul className="space-y-3">
                                                {generatedContent.thumbnailPrompts.map((prompt, i) => (
                                                    <li key={i} className="flex justify-between items-center bg-parchment-light p-2 rounded-md">
                                                        <span className="text-ink-light text-sm"><strong>{i + 1}️⃣</strong> {prompt}</span>
                                                        <CopyButton textToCopy={prompt}/>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-parchment shadow-lg rounded-xl p-6 border border-parchment-dark text-center">
                                    <h2 className="text-lg font-bold font-serif text-golden-dark mb-3">🔁 Deseja ajustar algum bloco?</h2>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button onClick={() => openAdjustmentModal('script')} className="bg-ink-light hover:bg-ink text-white text-sm font-semibold py-2 px-4 rounded-lg transition">Roteiro</button>
                                        <button onClick={() => openAdjustmentModal('titles')} className="bg-ink-light hover:bg-ink text-white text-sm font-semibold py-2 px-4 rounded-lg transition">Títulos</button>
                                        <button onClick={() => openAdjustmentModal('description')} className="bg-ink-light hover:bg-ink text-white text-sm font-semibold py-2 px-4 rounded-lg transition">Descrição</button>
                                        <button onClick={() => openAdjustmentModal('tags')} className="bg-ink-light hover:bg-ink text-white text-sm font-semibold py-2 px-4 rounded-lg transition">Tags</button>
                                        <button onClick={() => openAdjustmentModal('thumbnailPrompts')} className="bg-ink-light hover:bg-ink text-white text-sm font-semibold py-2 px-4 rounded-lg transition">Thumbnails</button>
                                    </div>
                                </div>

                                <div className="text-center pt-4">
                                    <button onClick={handleNewScript} className="bg-golden hover:bg-golden-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">🕊️ Criar Novo Roteiro</button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            <AdjustmentModal
                isOpen={adjustmentState.isOpen}
                blockToAdjust={adjustmentState.targetBlock}
                onClose={() => setAdjustmentState({ isOpen: false, targetBlock: null })}
                onConfirm={(instruction) => {
                    if (adjustmentState.targetBlock) {
                        handleRegenerate(adjustmentState.targetBlock, instruction);
                    }
                }}
            />
        </div>
    );
};

export default App;