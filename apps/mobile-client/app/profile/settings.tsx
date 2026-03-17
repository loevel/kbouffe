import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { preference, setPreference } = useAppTheme();
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [notifications, setNotifications] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState(true);
    const [promos, setPromos] = useState(false);
    const darkMode = preference === 'dark';
    const themeModeLabel = preference === 'system' ? 'Automatique' : darkMode ? 'Sombre' : 'Clair';

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible. Toutes vos données seront supprimées.',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => {} },
            ],
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        >
            {/* Notifications */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Notifications</Text>
                <View style={[styles.card, { borderColor: theme.border }]}>
                    <View style={[styles.row, { borderBottomColor: theme.border }]}>
                        <View style={styles.rowContent}>
                            <Ionicons name="notifications-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Notifications push</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: theme.border, true: theme.primary + '60' }}
                            thumbColor={notifications ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                    <View style={[styles.row, { borderBottomColor: theme.border }]}>
                        <View style={styles.rowContent}>
                            <Ionicons name="bicycle-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Suivi de commande</Text>
                        </View>
                        <Switch
                            value={orderUpdates}
                            onValueChange={setOrderUpdates}
                            trackColor={{ false: theme.border, true: theme.primary + '60' }}
                            thumbColor={orderUpdates ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={styles.rowContent}>
                            <Ionicons name="pricetag-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Offres et promotions</Text>
                        </View>
                        <Switch
                            value={promos}
                            onValueChange={setPromos}
                            trackColor={{ false: theme.border, true: theme.primary + '60' }}
                            thumbColor={promos ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                </View>
            </View>

            {/* General */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Général</Text>
                <View style={[styles.card, { borderColor: theme.border }]}>
                    <View style={[styles.row, { borderBottomColor: theme.border }]}> 
                        <View style={styles.rowContent}>
                            <Ionicons name="moon-outline" size={20} color={theme.text} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: theme.text }]}>Apparence</Text>
                                <Text style={[styles.rowValue, { color: theme.icon }]}>Mode {themeModeLabel}</Text>
                            </View>
                        </View>
                        <View style={styles.themeActions}>
                            <Pressable
                                style={[styles.autoChip, { borderColor: preference === 'system' ? theme.primary : theme.border }]}
                                onPress={() => setPreference('system')}
                            >
                                <Text style={[styles.autoChipText, { color: preference === 'system' ? theme.primary : theme.icon }]}>Auto</Text>
                            </Pressable>
                            <Switch
                                value={darkMode}
                                onValueChange={(value) => setPreference(value ? 'dark' : 'light')}
                                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                                thumbColor={darkMode ? theme.primary : '#f4f3f4'}
                            />
                        </View>
                    </View>
                    <Pressable style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}>
                        <View style={styles.rowContent}>
                            <Ionicons name="language-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Langue</Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowValue, { color: theme.icon }]}>Français</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                        </View>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                        <View style={styles.rowContent}>
                            <Ionicons name="cash-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Devise</Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowValue, { color: theme.icon }]}>FCFA (XAF)</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Aide */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Aide</Text>
                <View style={[styles.card, { borderColor: theme.border }]}>
                    <Pressable
                        style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/legal/client')}
                    >
                        <View style={styles.rowContent}>
                            <Ionicons name="document-text-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Conditions d'utilisation</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/legal/client')}
                    >
                        <View style={styles.rowContent}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Politique de confidentialité</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/support')}
                    >
                        <View style={styles.rowContent}>
                            <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Contacter le support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                    </Pressable>
                </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
                <Pressable
                    style={[styles.deleteButton, { borderColor: '#ef4444' }]}
                    onPress={handleDeleteAccount}
                >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
                </Pressable>
            </View>

            <Text style={[styles.version, { color: theme.icon }]}>Kbouffe v1.0.0 (build 1)</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: { ...Typography.caption, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.sm, marginLeft: Spacing.xs },
    card: { borderRadius: Radii.lg, borderWidth: 1, overflow: 'hidden' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    themeActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    autoChip: {
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    autoChipText: { ...Typography.small, fontWeight: '600' },
    rowLabel: { ...Typography.body },
    rowValue: { ...Typography.caption },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    deleteButtonText: { color: '#ef4444', ...Typography.body, fontWeight: '500' },
    version: { textAlign: 'center', ...Typography.small, marginTop: Spacing.xl, marginBottom: Spacing.md },
});
