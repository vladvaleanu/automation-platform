/**
 * useForgeSettings Hook
 * Manages Forge settings with backend API + localStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { ForgeSettings, DEFAULT_FORGE_SETTINGS } from '../types';
import { forgeApi, type ModelInfo } from '../api';

const STORAGE_KEY = 'forge-settings';

export function useForgeSettings() {
    const [settings, setSettings] = useState<ForgeSettings>(DEFAULT_FORGE_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from backend API, fallback to localStorage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Try backend first
                const [healthResponse, settingsResponse] = await Promise.all([
                    forgeApi.getHealth(),
                    forgeApi.getSettings(),
                ]);

                setIsConnected(healthResponse.ollama);

                if (settingsResponse.success && settingsResponse.settings) {
                    // Filter out null values to preserve defaults
                    const filteredSettings = Object.fromEntries(
                        Object.entries(settingsResponse.settings).filter(([_, v]) => v !== null && v !== undefined)
                    );
                    setSettings(prev => ({ ...prev, ...filteredSettings }));
                }

                // Load available models
                if (healthResponse.ollama) {
                    const modelsResponse = await forgeApi.getModels();
                    if (modelsResponse.success) {
                        setAvailableModels(modelsResponse.models);
                    }
                }
            } catch (error) {
                console.warn('Backend not available, using localStorage:', error);
                // Fallback to localStorage
                try {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setSettings({ ...DEFAULT_FORGE_SETTINGS, ...parsed });
                    }
                } catch (e) {
                    console.error('Failed to load Forge settings from localStorage:', e);
                }
            }
            setIsLoaded(true);
        };

        loadSettings();
    }, []);

    // Save settings to backend API and localStorage
    const saveSettings = useCallback(async (newSettings: Partial<ForgeSettings>) => {
        setIsSaving(true);

        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Always save to localStorage as backup
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }

        // Try to save to backend
        try {
            const response = await forgeApi.updateSettings(newSettings);
            if (response.success) {
                // Refresh models if baseUrl or model changed
                if (newSettings.baseUrl || newSettings.model) {
                    const health = await forgeApi.getHealth();
                    setIsConnected(health.ollama);
                    if (health.ollama) {
                        const modelsResponse = await forgeApi.getModels();
                        if (modelsResponse.success) {
                            setAvailableModels(modelsResponse.models);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to save to backend:', error);
        }

        setIsSaving(false);
    }, [settings]);

    // Reset to defaults
    const resetSettings = useCallback(async () => {
        setSettings(DEFAULT_FORGE_SETTINGS);
        try {
            localStorage.removeItem(STORAGE_KEY);
            await forgeApi.updateSettings(DEFAULT_FORGE_SETTINGS);
        } catch (error) {
            console.error('Failed to reset Forge settings:', error);
        }
    }, []);

    // Test connection to Ollama
    const testConnection = useCallback(async (): Promise<boolean> => {
        try {
            const health = await forgeApi.getHealth();
            setIsConnected(health.ollama);
            if (health.ollama) {
                const modelsResponse = await forgeApi.getModels();
                if (modelsResponse.success) {
                    setAvailableModels(modelsResponse.models);
                }
            }
            return health.ollama;
        } catch (error) {
            setIsConnected(false);
            return false;
        }
    }, []);

    return {
        settings,
        isLoaded,
        isConnected,
        availableModels,
        isSaving,
        saveSettings,
        resetSettings,
        testConnection,
    };
}

