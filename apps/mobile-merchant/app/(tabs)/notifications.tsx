import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export default function NotificationsScreen() {
    const theme = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
            </View>
            <View style={styles.empty}>
                <Text style={styles.icon}>🔔</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune notification pour le moment</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 22, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15 },
});
