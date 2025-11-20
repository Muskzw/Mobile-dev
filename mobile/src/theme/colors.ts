export const colors = {
    // Primary Brand Colors
    primary: {
        50: '#EEF2FF',
        100: '#E0E7FF',
        200: '#C7D2FE',
        300: '#A5B4FC',
        400: '#818CF8',
        500: '#6366F1',
        600: '#4F46E5',
        700: '#4338CA',
        800: '#3730A3',
        900: '#312E81',
    },

    // Secondary/Accent Colors
    secondary: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        300: '#86EFAC',
        400: '#4ADE80',
        500: '#22C55E',
        600: '#16A34A',
        700: '#15803D',
        800: '#166534',
        900: '#14532D',
    },

    // Neutrals
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Background
    background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
    },

    // Text
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    // Gradients
    gradients: {
        primary: ['#6366F1', '#8B5CF6'],
        secondary: ['#10B981', '#059669'],
        sunset: ['#F59E0B', '#EF4444'],
        ocean: ['#3B82F6', '#6366F1'],
    },
};

export type Colors = typeof colors;
