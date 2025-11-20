import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, shadows, spacing, Colors } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: keyof typeof spacing;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    padding = 4,
    style,
}) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View
            style={[
                styles.card,
                styles[`card_${variant}` as keyof typeof styles] as ViewStyle,
                { padding: spacing[padding] },
                style,
            ]}
        >
            {children}
        </View>
    );
};

const createStyles = (colors: Colors) => StyleSheet.create({
    card: {
        borderRadius: borderRadius.xl,
        backgroundColor: colors.background.primary,
    },
    card_elevated: {
        ...shadows.lg,
        shadowColor: colors.shadow,
    },
    card_outlined: {
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    card_filled: {
        backgroundColor: colors.background.secondary,
    },
});

