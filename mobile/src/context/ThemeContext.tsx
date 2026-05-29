import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, Colors } from '../theme/colors';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
    colors: Colors;
    isDark: boolean;
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    colors: lightColors,
    isDark: false,
    themePreference: 'system',
    setThemePreference: async () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    // Load theme preference on mount
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedPref = await AsyncStorage.getItem('theme_preference');
                if (savedPref) {
                    setThemePreferenceState(savedPref as ThemePreference);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            }
        };
        loadThemePreference();
    }, []);

    // Update active theme state when preference or system color scheme changes
    useEffect(() => {
        if (themePreference === 'system') {
            setIsDark(systemScheme === 'dark');
        } else {
            setIsDark(themePreference === 'dark');
        }
    }, [themePreference, systemScheme]);

    const setThemePreference = async (pref: ThemePreference) => {
        try {
            await AsyncStorage.setItem('theme_preference', pref);
            setThemePreferenceState(pref);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ colors, isDark, themePreference, setThemePreference }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
