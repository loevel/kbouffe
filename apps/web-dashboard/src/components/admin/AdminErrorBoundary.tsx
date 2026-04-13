"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class AdminErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[AdminErrorBoundary]", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                    <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
                </div>

                <h1 className="text-2xl font-black text-surface-900 dark:text-white mb-3">
                    Une erreur est survenue
                </h1>

                <p className="text-surface-500 dark:text-surface-400 max-w-md mb-2">
                    Une erreur inattendue s&apos;est produite lors du rendu de cette page. Nos équipes ont été
                    notifiées.
                </p>

                {this.state.error?.message && (
                    <p className="text-xs font-mono text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-2 max-w-lg mb-8 break-all">
                        {this.state.error.message}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
                    >
                        <RefreshCw size={16} />
                        Réessayer
                    </button>

                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 font-semibold text-sm transition-colors"
                    >
                        <LayoutDashboard size={16} />
                        Retour au tableau de bord
                    </Link>
                </div>
            </div>
        );
    }
}
