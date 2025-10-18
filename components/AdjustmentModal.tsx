import React, { useState, useEffect } from 'react';
import { GeneratedContentBlock } from '../types';
import { CloseIcon } from './icons';

interface AdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (instruction: string) => void;
    blockToAdjust: GeneratedContentBlock | null;
}

const blockNames: Record<GeneratedContentBlock, string> = {
    script: 'Roteiro',
    titles: 'Títulos',
    description: 'Descrição',
    tags: 'Tags',
    thumbnailPrompts: 'Prompts para Thumbnail',
}

const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ isOpen, onClose, onConfirm, blockToAdjust }) => {
    const [instruction, setInstruction] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInstruction(''); // Reset instruction when modal opens
        }
    }, [isOpen]);

    if (!isOpen || !blockToAdjust) return null;

    const handleConfirm = () => {
        onConfirm(instruction);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-parchment-light rounded-xl shadow-2xl w-full max-w-lg p-6 border border-golden-dark transform transition-transform duration-300 ease-in-out scale-95 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif font-bold text-golden-dark">Ajustar {blockNames[blockToAdjust]}</h2>
                    <button onClick={onClose} className="text-ink-light hover:text-golden-dark transition p-1 rounded-full hover:bg-golden/20">
                        <CloseIcon />
                    </button>
                </div>
                <p className="text-ink-light mb-4">
                    Descreva o que você gostaria de alterar. Por exemplo: "Deixe os títulos mais curtos e misteriosos" ou "Adicione uma citação de Agostinho na conclusão do roteiro".
                </p>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Sua instrução aqui..."
                    className="w-full p-3 h-32 rounded-md border border-parchment-dark bg-parchment focus:ring-2 focus:ring-golden focus:border-golden outline-none text-ink-DEFAULT"
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="bg-golden hover:bg-golden-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    >
                        Confirmar Ajuste
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AdjustmentModal;