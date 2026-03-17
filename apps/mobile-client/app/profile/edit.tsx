import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_USER } from '@/data/mocks';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [fullName, setFullName] = useState(MOCK_USER.fullName);
    const [email, setEmail] = useState(MOCK_USER.email ?? '');
    const [phone, setPhone] = useState(MOCK_USER.phone ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            Alert.alert('Succes', 'Profil mis a jour.', [{ text: 'OK', onPress: () => router.back() }]);
        }, 1000);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        >
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>
                        {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                </View>
                <Pressable style={[styles.changePhotoBtn, { borderColor: theme.primary }]}>
                    <Ionicons name="camera-outline" size={16} color={theme.primary} />
                    <Text style={[styles.changePhotoText, { color: theme.primary }]}>Changer la photo</Text>
                </Pressable>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>Nom complet</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Votre nom"
                        placeholderTextColor={theme.icon}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="votre@email.com"
                        placeholderTextColor={theme.icon}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>Telephone</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+237..."
                        placeholderTextColor={theme.icon}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            {/* Save Button */}
            <View style={styles.buttonContainer}>
                <Pressable
                    style={[styles.saveButton, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
    changePhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    changePhotoText: { ...Typography.caption, fontWeight: '500' },
    form: { paddingHorizontal: Spacing.md, gap: Spacing.md },
    field: { gap: Spacing.xs },
    label: { ...Typography.caption, fontWeight: '600' },
    input: {
        ...Typography.body,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    buttonContainer: { padding: Spacing.md, marginTop: Spacing.lg },
    saveButton: {
        padding: Spacing.md,
        borderRadius: Radii.full,
        alignItems: 'center',
    },
    saveButtonText: { color: '#fff', ...Typography.body, fontWeight: '600' },
});
