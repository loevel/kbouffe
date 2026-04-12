/**
 * Unit tests — normalizePhoneNumber
 * (extracted from auth-context internal function, duplicated here for testability)
 */

const DEFAULT_COUNTRY_CODE = '+237';

function normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith('+')) {
        return `+${trimmed.slice(1).replace(/\D/g, '')}`;
    }

    const countryDigits = DEFAULT_COUNTRY_CODE.replace(/\D/g, '');
    const localDigits = trimmed.replace(/\D/g, '').replace(/^0+/, '');

    if (localDigits.startsWith(countryDigits)) {
        return `+${localDigits}`;
    }

    return `+${countryDigits}${localDigits}`;
}

describe('normalizePhoneNumber', () => {
    it('préfixe un numéro local avec +237', () => {
        expect(normalizePhoneNumber('655123456')).toBe('+237655123456');
    });

    it('conserve un numéro déjà au format international', () => {
        expect(normalizePhoneNumber('+237655123456')).toBe('+237655123456');
    });

    it('supprime les espaces et tirets', () => {
        expect(normalizePhoneNumber('655 12 34 56')).toBe('+237655123456');
        expect(normalizePhoneNumber('+237 655-12-34-56')).toBe('+237655123456');
    });

    it('supprime le zéro initial', () => {
        expect(normalizePhoneNumber('0655123456')).toBe('+237655123456');
    });

    it('retourne une chaîne vide pour une entrée vide', () => {
        expect(normalizePhoneNumber('')).toBe('');
        expect(normalizePhoneNumber('   ')).toBe('');
    });

    it('ne double pas le code pays si déjà présent', () => {
        expect(normalizePhoneNumber('237655123456')).toBe('+237655123456');
    });
});
