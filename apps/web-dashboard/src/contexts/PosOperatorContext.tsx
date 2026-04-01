"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PosOperator {
    memberId: string;
    name: string;
    role: string;
}

interface PosOperatorContextType {
    operator: PosOperator | null;
    setOperator: (op: PosOperator | null) => void;
    showPinEntry: boolean;
    openPinEntry: () => void;
    closePinEntry: () => void;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "pos_operator";

function readFromStorage(): PosOperator | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PosOperator;
    } catch {
        return null;
    }
}

function writeToStorage(op: PosOperator | null): void {
    if (typeof window === "undefined") return;
    if (op === null) {
        sessionStorage.removeItem(STORAGE_KEY);
    } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(op));
    }
}

// ── Context ──────────────────────────────────────────────────────────────────

const PosOperatorContext = createContext<PosOperatorContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function PosOperatorProvider({ children }: { children: ReactNode }) {
    const [operator, setOperatorState] = useState<PosOperator | null>(null);
    const [showPinEntry, setShowPinEntry] = useState(false);

    // Hydrate from sessionStorage on mount (client-only)
    useEffect(() => {
        const stored = readFromStorage();
        if (stored) setOperatorState(stored);
    }, []);

    const setOperator = useCallback((op: PosOperator | null) => {
        setOperatorState(op);
        writeToStorage(op);
    }, []);

    const openPinEntry = useCallback(() => setShowPinEntry(true), []);
    const closePinEntry = useCallback(() => setShowPinEntry(false), []);

    return (
        <PosOperatorContext.Provider
            value={{ operator, setOperator, showPinEntry, openPinEntry, closePinEntry }}
        >
            {children}
        </PosOperatorContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePosOperator(): PosOperatorContextType {
    const ctx = useContext(PosOperatorContext);
    if (!ctx) {
        throw new Error("usePosOperator must be used inside <PosOperatorProvider>");
    }
    return ctx;
}
