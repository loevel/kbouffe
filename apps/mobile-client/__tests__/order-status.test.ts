/**
 * Unit tests — order-status utilities
 */
import { mapApiOrderStatus, getOrderStatusLabel, TERMINAL_ORDER_STATUSES } from '../lib/order-status';

describe('mapApiOrderStatus', () => {
    const cases: [string, string][] = [
        ['pending',           'pending'],
        ['confirmed',         'confirmed'],
        ['accepted',          'accepted'],
        ['preparing',         'preparing'],
        ['ready',             'ready'],
        ['out_for_delivery',  'delivering'],
        ['delivering',        'delivering'],
        ['delivered',         'delivered'],
        ['completed',         'completed'],
        ['cancelled',         'cancelled'],
    ];

    test.each(cases)('"%s" → "%s"', (input, expected) => {
        expect(mapApiOrderStatus(input)).toBe(expected);
    });

    it('retourne "pending" pour un statut inconnu', () => {
        expect(mapApiOrderStatus('unknown_status')).toBe('pending');
        expect(mapApiOrderStatus('')).toBe('pending');
    });
});

describe('getOrderStatusLabel', () => {
    it('retourne le bon libellé français pour "preparing"', () => {
        expect(getOrderStatusLabel('preparing')).toBe('En préparation');
    });

    it('retourne le bon libellé français pour "delivering"', () => {
        expect(getOrderStatusLabel('delivering')).toBe('En livraison');
    });

    it('retourne le bon libellé pour tous les statuts', () => {
        const allStatuses = [
            'pending', 'confirmed', 'accepted', 'preparing',
            'ready', 'delivering', 'delivered', 'completed', 'cancelled',
        ] as const;
        allStatuses.forEach((s) => {
            expect(typeof getOrderStatusLabel(s)).toBe('string');
            expect(getOrderStatusLabel(s).length).toBeGreaterThan(0);
        });
    });
});

describe('TERMINAL_ORDER_STATUSES', () => {
    it('contient completed, delivered et cancelled', () => {
        expect(TERMINAL_ORDER_STATUSES).toContain('completed');
        expect(TERMINAL_ORDER_STATUSES).toContain('delivered');
        expect(TERMINAL_ORDER_STATUSES).toContain('cancelled');
    });

    it('ne contient pas de statuts actifs', () => {
        expect(TERMINAL_ORDER_STATUSES).not.toContain('pending');
        expect(TERMINAL_ORDER_STATUSES).not.toContain('preparing');
        expect(TERMINAL_ORDER_STATUSES).not.toContain('delivering');
    });
});
