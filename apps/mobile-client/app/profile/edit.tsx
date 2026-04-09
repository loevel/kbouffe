import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function EditProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const { user, updateProfile } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFullName(user?.fullName ?? '');
        setEmail(user?.email ?? '');
        setPhone(user?.phone ?? '');
    }, [user]);

    const hasChanges = fullName !== (user?.fullName ?? '') || phone !== (user?.phone ?? '');

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Profil', 'Le nom complet est requis.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSaving(true);
        try {
            await updateProfile({
                fullName: fullName.trim(),
                phone: phone.trim() || null,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Profil mis à jour avec succès.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de mettre à jour le profil.');
        } finally {
            setSaving(false);
        }
    };

    const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const fields = [
        {
            label: 'Nom complet',
            icon: 'person-outline' as const,
            value: fullName,
            onChange: setFullName,
            placeholder: 'Votre nom complet',
            keyboardType: 'default' as const,
            editable: true,
        },
        {
            label: 'Adresse email',
            icon: 'mail-outline' as const,
            value: email,
            onChange: setEmail,
            placeholder: 'votre@email.com',
            keyboardType: 'email-address' as const,
            editable: false,
        },
        {
            label: 'Téléphone',
            icon: 'call-outline' as const,
            value: phone,
            onChange: setPhone,
            placeholder: '+237 6XX XXX XXX',
            keyboardType: 'phone-pad' as const,
            editable: true,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mon profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar section */}
                <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                    style={styles.avatarSection}
                >
                    <View style={[styles.avatarRing, { borderColor: theme.primary + '30' }]}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>{initials || '?'}</Text>
                        </View>
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.changePhotoBtn,
                            { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="camera-outline" size={16} color={theme.primary} />
                        <Text style={[styles.changePhotoText, { color: theme.primary }]}>Changer la photo</Text>
                    </Pressable>
                </Animated.View>

                {/* Form Fields */}
                <View style={styles.form}>
                    {fields.map((field, index) => (
                        <Animated.View
                            key={field.label}
                            entering={FadeInDown.delay(100 + index * 80).duration(400).springify()}
                            style={[styles.fieldCard, { backgroundColor: theme.surface, opacity: field.editable ? 1 : 0.7 }]}
                        >
                            <View style={styles.fieldHeader}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.primary + '12' }]}>
                                    <Ionicons name={field.icon} size={16} color={theme.primary} />
                                </View>
                                <Text style={[styles.fieldLabel, { color: theme.icon }]}>{field.label}</Text>
                                {!field.editable && (
                                    <View style={[styles.lockedBadge, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                                        <Ionicons name="lock-closed" size={10} color={theme.icon} />
                                        <Text style={[styles.lockedText, { color: theme.icon }]}>Verrouillé</Text>
                                    </View>
                                )}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor: isDark ? '#ffffff06' : '#f8fafc',
                                        borderColor: theme.border + '60',
                                    }
                                ]}
                                value={field.value}
                                onChangeText={field.onChange}
                                placeholder={field.placeholder}
                                placeholderTextColor={theme.icon + '80'}
                                keyboardType={field.keyboardType}
                                autoCapitalize={field.keyboardType === 'email-address' ? 'none' : 'words'}
                                editable={field.editable}
                            />
                        </Animated.View>
                    ))}
                </View>

                {/* Save Button */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(400).springify()}
                    style={styles.buttonContainer}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            {
                                backgroundColor: hasChanges ? theme.primary : theme.border,
                                opacity: saving ? 0.7 : 1,
                            },
                            pressed && { transform: [{ scale: 0.98 }] },
                        ]}
                        onPress={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <Text style={styles.saveButtonText}>Enregistrement...</Text>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                            </>
                        )}
                    </Pressable>

                    {!hasChanges && (
                        <Text style={[styles.noChangesHint, { color: theme.icon }]}>
                            Aucune modification détectée
                        </Text>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...Typography.title3 },

    /* Avatar section */
    avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
    avatarRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 1 },
    changePhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    changePhotoText: { ...Typography.caption, fontWeight: '600' },

    /* Form */
    form: { paddingHorizontal: Spacing.md, gap: Spacing.md },
    fieldCard: {
        padding: Spacing.md,
        borderRadius: Radii.xl,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    fieldIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldLabel: { ...Typography.caption, fontWeight: '600', flex: 1 },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    lockedText: { fontSize: 10, fontWeight: '600' },
    input: {
        ...Typography.body,
        padding: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },

    /* Save button */
    buttonContainer: { padding: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
    },
    saveButtonText: { color: '#fff', ...Typography.bodySemibold, fontWeight: '700' },
    noChangesHint: { ...Typography.caption, textAlign: 'center' },
});
