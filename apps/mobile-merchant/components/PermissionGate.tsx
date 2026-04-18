import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePermission } from '@/hooks/use-permission';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import type { Permission } from '@/lib/permissions';

interface Props {
    permission: Permission;
    children: React.ReactNode;
}

export function PermissionGate({ permission, children }: Props) {
    const canAccess = usePermission(permission);
    const { profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    // Still loading profile — don't flash access denied
    if (!profile) return null;

    if (!canAccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.body}>
                    <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
                        <Ionicons name="lock-closed-outline" size={40} color={theme.textSecondary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Accès restreint</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Votre rôle ne permet pas d'accéder à cette section.{'\n'}
                        Contactez le propriétaire du restaurant.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
