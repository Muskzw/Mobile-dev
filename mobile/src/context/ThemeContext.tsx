import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, Colors } from '../theme/colors';

interface ThemeContextType {
    colors: Colors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    colors: lightColors,
    isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    // Automatically follow system color scheme changes
    useEffect(() => {
        setIsDark(systemScheme === 'dark');
    }, [systemScheme]);

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
