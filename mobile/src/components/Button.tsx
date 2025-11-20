import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    gradient?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    gradient = false,
    style,
}) => {
    const buttonStyles: ViewStyle[] = [
        styles.button,
        styles[`button_${size}`],
        styles[`button_${variant}`],
        ...(fullWidth ? [styles.fullWidth] : []),
        ...(disabled ? [styles.disabled] : []),
        ...(style ? [style] : []),
    ];

    const textStyles: TextStyle[] = [
        styles.text,
        styles[`text_${size}`],
        styles[`text_${variant}`],
        ...(disabled ? [styles.textDisabled] : []),
    ];

    const content = (
        <>
            {loading && (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? colors.primary[600] : colors.text.inverse}
                    style={styles.loader}
                    size="small"
                />
            )}
            <Text style={textStyles}>{title}</Text>
        </>
    );

    if (gradient && variant === 'primary' && !disabled) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[fullWidth && styles.fullWidth]}
            >
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, styles[`button_${size}`], style]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={buttonStyles}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
        ...shadows.md,
    },

    // Sizes
    button_sm: {
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
    },
    button_md: {
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
    },
    button_lg: {
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[8],
    },

    // Variants
    button_primary: {
        backgroundColor: colors.primary[600],
    },
    button_secondary: {
        backgroundColor: colors.secondary[600],
    },
    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary[600],
        shadowOpacity: 0,
        elevation: 0,
    },
    button_ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },

    // Text styles
    text: {
        fontWeight: typography.fontWeight.semibold,
        textAlign: 'center',
    },
    text_sm: {
        fontSize: typography.fontSize.sm,
    },
    text_md: {
        fontSize: typography.fontSize.base,
    },
    text_lg: {
        fontSize: typography.fontSize.lg,
    },
    text_primary: {
        color: colors.text.inverse,
    },
    text_secondary: {
        color: colors.text.inverse,
    },
    text_outline: {
        color: colors.primary[600],
    },
    text_ghost: {
        color: colors.primary[600],
    },

    // States
    disabled: {
        backgroundColor: colors.gray[300],
        shadowOpacity: 0,
        elevation: 0,
    },
    textDisabled: {
        color: colors.gray[500],
    },
    fullWidth: {
        width: '100%',
    },
    loader: {
        marginRight: spacing[2],
    },
});
