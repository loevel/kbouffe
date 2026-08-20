/**
 * Palette livreur — ambre.
 *
 * Le choix n'est pas décoratif : le tableau de bord admin identifie déjà les
 * livreurs en ambre (cf. admin/users). Une app qui reprend la couleur du rôle
 * évite qu'un compte se croie dans la mauvaise application.
 */
export const PRIMARY = '#d97706';

const tintColorLight = '#d97706';
const tintColorDark = '#fbbf24';

export const Colors = {
    light: {
        text: '#1c1917',
        textSecondary: '#78716c',
        background: '#fafaf9',
        card: '#ffffff',
        border: '#e7e5e4',
        primary: tintColorLight,
        primaryLight: '#fef3c7',
        tint: tintColorLight,
        icon: '#57534e',
        tabIconDefault: '#a8a29e',
        tabIconSelected: tintColorLight,
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    },
    dark: {
        text: '#fef3c7',
        textSecondary: '#a8a29e',
        background: '#1c1207',
        card: '#2a1c0d',
        border: '#44341a',
        primary: tintColorDark,
        primaryLight: '#2a1c0d',
        tint: tintColorDark,
        icon: '#a8a29e',
        tabIconDefault: '#78716c',
        tabIconSelected: tintColorDark,
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa',
    },
};
