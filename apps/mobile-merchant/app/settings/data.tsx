import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

export default function DataSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = async (exportType: 'all' | 'products' | 'orders' | 'reviews' | 'team') => {
        if (!session) return;

        setExporting(exportType);
        try {
            const data = await apiFetch<{ data: any; filename: string }>(
                `/api/restaurant/export/${exportType}`,
                session.access_token
            );

            const jsonString = JSON.stringify(data.data, null, 2);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `kbouffe_${exportType}_${timestamp}.json`;

            // Tentative de partage
            try {
                await Share.share({
                    message: jsonString,
                    title: filename,
                    url: `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`,
                });
            } catch (shareErr) {
                // Si le partage échoue, afficher un message de succès
                Alert.alert('Export réussi', `Les données ont été exportées en JSON (${Math.round(jsonString.length / 1024)} KB)`);
            }
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'exporter les données'));
        } finally {
            setExporting(null);
        }
    };

    const s = styles(theme);

    const exports = [
        {
            type: 'all' as const,
            label: 'Toutes les données',
            icon: 'server-outline' as const,
            description: 'Produits, commandes, avis, équipe',
            color: theme.primary,
        },
        {
            type: 'products' as const,
            label: 'Produits',
            icon: 'restaurant-outline' as const,
            description: 'Menu et catégories',
            color: '#06b6d4',
        },
        {
            type: 'orders' as const,
            label: 'Commandes',
            icon: 'receipt-outline' as const,
            description: 'Historique des commandes',
            color: '#f59e0b',
        },
        {
            type: 'reviews' as const,
            label: 'Avis clients',
            icon: 'star-outline' as const,
            description: 'Commentaires et notes',
            color: '#ef4444',
        },
        {
            type: 'team' as const,
            label: 'Équipe',
            icon: 'people-outline' as const,
            description: 'Membres de l\'équipe',
            color: '#22c55e',
        },
    ];

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Données & Export</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                <View style={s.section}>
                    <View style={s.infoCard}>
                        <Ionicons name="information-circle" size={24} color={theme.primary} />
                        <View style={s.infoText}>
                            <Text style={[s.infoTitle, { color: theme.text }]}>Vos données en format JSON</Text>
                            <Text style={[s.infoDescription, { color: theme.textSecondary }]}>
                                Téléchargez vos données sous format JSON pour une sauvegarde ou une portabilité
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Exports disponibles</Text>

                    {exports.map((exp) => (
                        <TouchableOpacity
                            key={exp.type}
                            style={[s.exportCard, { backgroundColor: theme.surface }]}
                            onPress={() => handleExport(exp.type)}
                            disabled={exporting !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[s.exportIcon, { backgroundColor: `${exp.color}20` }]}>
                                <Ionicons name={exp.icon} size={20} color={exp.color} />
                            </View>

                            <View style={s.exportContent}>
                                <Text style={[s.exportLabel, { color: theme.text }]}>{exp.label}</Text>
                                <Text style={[s.exportDescription, { color: theme.textSecondary }]}>{exp.description}</Text>
                            </View>

                            {exporting === exp.type ? (
                                <ActivityIndicator color={exp.color} size={18} />
                            ) : (
                                <Ionicons name="download-outline" size={18} color={exp.color} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Suppression de données</Text>

                    <View style={[s.dangerCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                        <View style={s.dangerContent}>
                            <Ionicons name="warning-outline" size={20} color="#dc2626" />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.dangerTitle, { color: '#991b1b' }]}>Zone dangereuse</Text>
                                <Text style={[s.dangerDescription, { color: '#7f1d1d' }]}>
                                    Supprimer toutes les données du restaurant (irréversible)
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[s.deleteButton, { backgroundColor: '#dc2626' }]}
                            onPress={() =>
                                Alert.alert(
                                    'Supprimer toutes les données ?',
                                    'Cette action est irréversible. Toutes les données seront supprimées.',
                                    [
                                        { text: 'Annuler', style: 'cancel' },
                                        {
                                            text: 'Supprimer tout',
                                            style: 'destructive',
                                            onPress: () => {
                                                // Implémenter la suppression
                                                Alert.alert('À venir', 'Suppression non encore implémentée');
                                            },
                                        },
                                    ]
                                )
                            }
                        >
                            <Text style={s.deleteButtonText}>Supprimer toutes les données</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[s.tipsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[s.tipTitle, { color: theme.text }]}>Droit à la portabilité</Text>
                    <Text style={[s.tipItem, { color: theme.textSecondary }]}>
                        Vous avez le droit de télécharger et de récupérer vos données à tout moment, conformément au RGPD.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 16, gap: 16, paddingBottom: 32 },
        section: { gap: 12 },
        infoCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 14 },
        infoText: { flex: 1 },
        infoTitle: { fontSize: 14, fontWeight: '700' },
        infoDescription: { fontSize: 12, marginTop: 4, lineHeight: 18 },
        sectionTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },
        exportCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
        },
        exportIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        exportContent: { flex: 1 },
        exportLabel: { fontSize: 14, fontWeight: '600' },
        exportDescription: { fontSize: 12, marginTop: 2 },
        dangerCard: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
        dangerContent: { flexDirection: 'row', gap: 12 },
        dangerTitle: { fontSize: 14, fontWeight: '700' },
        dangerDescription: { fontSize: 12, marginTop: 2, lineHeight: 18 },
        deleteButton: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
        deleteButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
        tipsCard: { borderRadius: 12, padding: 14 },
        tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
        tipItem: { fontSize: 12, lineHeight: 18 },
    });
