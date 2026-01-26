
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ForgeSettings, DEFAULT_FORGE_SETTINGS } from '../types/forge-settings';

interface ForgeSettingsContextType {
    settings: ForgeSettings;
    isLoaded: boolean;
    saveSettings: (settings: ForgeSettings) => void;
    resetSettings: () => void;
}

const ForgeSettingsContext = createContext<ForgeSettingsContextType | null>(null);

export function ForgeSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ForgeSettings>(DEFAULT_FORGE_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('forge_settings');
            if (stored) {
                setSettings({ ...DEFAULT_FORGE_SETTINGS, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load forge settings', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveSettings = (newSettings: ForgeSettings) => {
        setSettings(newSettings);
        localStorage.setItem('forge_settings', JSON.stringify(newSettings));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_FORGE_SETTINGS);
        localStorage.removeItem('forge_settings');
    };

    return (
        <ForgeSettingsContext.Provider value={{ settings, isLoaded, saveSettings, resetSettings }}>
            {children}
        </ForgeSettingsContext.Provider>
    );
}

export function useForgeSettings() {
    const context = useContext(ForgeSettingsContext);
    if (!context) {
        throw new Error('useForgeSettings must be used within a ForgeSettingsProvider');
    }
    return context;
}
