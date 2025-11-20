const palette = {
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
};

export const lightColors = {
    ...palette,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: '#000000',
    background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
    },
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF',
    },
    gradients: {
        primary: ['#6366F1', '#8B5CF6'],
        secondary: ['#10B981', '#059669'],
        sunset: ['#F59E0B', '#EF4444'],
        ocean: ['#3B82F6', '#6366F1'],
    },
};

export const darkColors = {
    ...palette,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: '#000000',
    background: {
        primary: '#111827', // gray-900
        secondary: '#000000',
        tertiary: '#1F2937', // gray-800
    },
    text: {
        primary: '#F9FAFB', // gray-50
        secondary: '#D1D5DB', // gray-300
        tertiary: '#9CA3AF', // gray-400
        inverse: '#111827',
    },
    gradients: {
        primary: ['#4F46E5', '#7C3AED'], // Slightly darker
        secondary: ['#059669', '#047857'],
        sunset: ['#D97706', '#DC2626'],
        ocean: ['#2563EB', '#4F46E5'],
    },
};


export const colors = lightColors;
export type Colors = typeof lightColors;
