import React, { useState } from 'react';
import {
    TextInput as RNTextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    rightIcon,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {icon && <View style={styles.iconLeft}>{icon}</View>}
                <RNTextInput
                    style={[styles.input, style]}
                    placeholderTextColor={colors.gray[400]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[4],
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.gray[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing[4],
        minHeight: 52,
    },
    inputContainerFocused: {
        borderColor: colors.primary[600],
        backgroundColor: colors.background.primary,
    },
    inputContainerError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        paddingVertical: spacing[3],
    },
    iconLeft: {
        marginRight: spacing[3],
    },
    iconRight: {
        marginLeft: spacing[3],
    },
    error: {
        fontSize: typography.fontSize.sm,
        color: colors.error,
        marginTop: spacing[1],
    },
});
