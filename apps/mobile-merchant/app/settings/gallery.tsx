import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
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

interface GalleryImage {
    id: string;
    photo_url: string;
    alt_text: string;
    display_order: number;
    is_featured: boolean;
}

export default function GallerySettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadGallery = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiFetch<{ photos: GalleryImage[] }>('/api/restaurant/gallery', session.access_token);
            setImages(data.photos || []);
            setError(null);
        } catch (err) {
            // API n'existe pas encore, afficher l'écran vide
            console.log('Galerie non disponible', err);
            setImages([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadGallery();
    }, [loadGallery]);

    const handleDeleteImage = (id: string) => {
        Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cette image ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (!session) return;
                        await apiFetch(
                            `/api/restaurant/gallery/${id}`,
                            session.access_token,
                            { method: 'DELETE' }
                        );
                        setImages(images.filter((img) => img.id !== id));
                    } catch (err) {
                        Alert.alert('Erreur', getErrorMessage(err, 'Impossible de supprimer'));
                    }
                },
            },
        ]);
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Galerie photos</Text>
                <TouchableOpacity style={s.backButton}>
                    <Ionicons name="add" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {error && (
                    <View style={[s.errorBox, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                        <Text style={{ color: '#991b1b' }}>{error}</Text>
                    </View>
                )}

                {images.length === 0 ? (
                    <View style={s.emptyState}>
                        <Text style={s.emptyIcon}>🖼️</Text>
                        <Text style={[s.emptyText, { color: theme.text }]}>Aucune photo pour le moment</Text>
                        <Text style={[s.emptySubtext, { color: theme.textSecondary }]}>Ajoutez des photos pour montrer votre restaurant</Text>
                    </View>
                ) : (
                    <FlatList
                        scrollEnabled={false}
                        data={images}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={s.columnWrapper}
                        renderItem={({ item }) => (
                            <View style={s.imageContainer}>
                                <Image
                                    source={{ uri: item.photo_url }}
                                    style={s.image}
                                    onError={() => console.error(`Image load error: ${item.photo_url}`)}
                                />
                                <TouchableOpacity
                                    style={[s.deleteButton, { backgroundColor: 'rgba(220, 38, 38, 0.9)' }]}
                                    onPress={() => handleDeleteImage(item.id)}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                {images.length > 0 && (
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>💡 Conseil</Text>
                        <Text style={[s.sectionText, { color: theme.textSecondary }]}>
                            Les meilleures photos sont nettes, bien éclairées et montrent vos meilleurs plats. Vous pouvez réorganiser vos photos en les glissant.
                        </Text>
                    </View>
                )}
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
        content: { padding: 12, paddingBottom: 32 },
        errorBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
        emptyState: { alignItems: 'center', paddingVertical: 60 },
        emptyIcon: { fontSize: 48, marginBottom: 12 },
        emptyText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
        emptySubtext: { fontSize: 13, textAlign: 'center' },
        columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
        imageContainer: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.surface, position: 'relative' },
        image: { width: '100%', height: '100%' },
        deleteButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
        section: { marginTop: 20, padding: 12, borderRadius: 10, backgroundColor: theme.surface },
        sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
        sectionText: { fontSize: 12, lineHeight: 18 },
    });
