import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme';

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
    return (
        <View
            style={[
                styles.card,
                styles[`card_${variant}`],
                { padding: spacing[padding] },
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.xl,
        backgroundColor: colors.background.primary,
    },
    card_elevated: {
        ...shadows.lg,
    },
    card_outlined: {
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    card_filled: {
        backgroundColor: colors.background.secondary,
    },
});
