"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Resolve the actual theme to apply
    const resolveTheme = useCallback((t: Theme): "light" | "dark" => {
        if (t === "system") return getSystemTheme();
        return t;
    }, []);

    // Apply theme class to <html>
    const applyTheme = useCallback((resolved: "light" | "dark") => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        setResolvedTheme(resolved);
    }, []);

    // Read from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("kbouffe-theme") as Theme | null;
        const initial = stored ?? "system";
        setThemeState(initial);
        applyTheme(resolveTheme(initial));
        setMounted(true);
    }, [applyTheme, resolveTheme]);

    // Listen for system theme changes when using "system"
    useEffect(() => {
        if (!mounted) return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            if (theme === "system") {
                applyTheme(getSystemTheme());
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme, mounted, applyTheme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem("kbouffe-theme", t);
        applyTheme(resolveTheme(t));
    }, [applyTheme, resolveTheme]);

    // Prevent flash of wrong theme
    if (!mounted) {
        return (
            <ThemeContext.Provider value={{ theme: "system", resolvedTheme: "light", setTheme }}>
                {children}
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
