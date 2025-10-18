import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, FormData, GeneratedContent } from '../types';

const HISTORY_STORAGE_KEY = 'roteiristaBiblicoHistory';

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
        }
    }, []);

    const saveHistory = useCallback((newHistory: HistoryItem[]) => {
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, []);
    
    const addHistoryItem = useCallback((formData: FormData, generatedContent: GeneratedContent): HistoryItem => {
        const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            formData,
            generatedContent,
        };

        setHistory(prevHistory => {
            const updatedHistory = [newItem, ...prevHistory];
            saveHistory(updatedHistory);
            return updatedHistory;
        });
        
        return newItem;
    }, [saveHistory]);

    const deleteHistoryItem = useCallback((id: string) => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(item => item.id !== id);
            saveHistory(updatedHistory);
            return updatedHistory;
        });
    }, [saveHistory]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear history from localStorage", error);
        }
    }, []);

    return { history, addHistoryItem, deleteHistoryItem, clearHistory };
};
