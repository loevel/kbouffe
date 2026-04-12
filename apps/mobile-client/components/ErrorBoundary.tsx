import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (!this.state.hasError) return this.props.children;
        if (this.props.fallback) return this.props.fallback;

        return <ErrorScreen error={this.state.error} onReset={this.reset} />;
    }
}

interface ErrorScreenProps {
    error?: Error | null;
    onReset?: () => void;
    title?: string;
    message?: string;
}

export function ErrorScreen({ error, onReset, title, message }: ErrorScreenProps) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.iconWrapper}>
                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            </View>
            <Text style={styles.title}>{title ?? 'Quelque chose s\'est mal passé'}</Text>
            <Text style={styles.message}>
                {message ?? 'Une erreur inattendue est survenue. Veuillez réessayer.'}
            </Text>
            {__DEV__ && error?.message ? (
                <View style={styles.devBox}>
                    <Text style={styles.devText}>{error.message}</Text>
                </View>
            ) : null}
            {onReset ? (
                <Pressable
                    style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
                    onPress={onReset}
                >
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Réessayer</Text>
                </Pressable>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#fff',
    },
    iconWrapper: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    devBox: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        width: '100%',
    },
    devText: {
        fontSize: 12,
        color: '#dc2626',
        fontFamily: 'monospace',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#16a34a',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
