export const PRIMARY = '#7c3aed';

// Brand violet pour le merchant (distinct du orange client)
export const Colors = {
    light: {
        primary: '#7c3aed',
        primaryLight: '#ede9fe',
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#0f172a',
        textSecondary: '#64748b',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
        tint: '#7c3aed',
        tabIconDefault: '#94a3b8',
        tabIconSelected: '#7c3aed',
    },
    dark: {
        primary: '#a78bfa',
        primaryLight: '#1e1b4b',
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        tint: '#a78bfa',
        tabIconDefault: '#475569',
        tabIconSelected: '#a78bfa',
    },
};

export type ThemeColors = typeof Colors.light;
