/**
 * app/restaurant/[id]/reserve.tsx
 *
 * Reservation screen — lets the customer book a table at the restaurant.
 *
 * Features:
 *  • Horizontal date-chip carousel (next 60 days)
 *  • Real-time time slots from GET /api/store/:slug/availability
 *  • Zone selector (when restaurant has multiple zones)
 *  • Occasion selector (birthday, anniversary, etc.)
 *  • Party-size stepper (1–20 guests)
 *  • Customer name & phone pre-filled from auth context
 *  • Calls POST /api/store/[slug]/reservations on submit
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { createReservation, getAvailability, type AvailabilityResponse, type AvailabilitySlot } from '@/lib/api';

// ── Constants ────────────────────────────────────────────────────────────────

const MIN_PARTY = 1;
const MAX_PARTY = 20;
const DAYS_AHEAD = 60;

/** Fallback time slots used if API is unavailable: 11:00 → 22:00, every 30 min */
const FALLBACK_SLOTS: string[] = (() => {
    const slots: string[] = [];
    for (let h = 11; h <= 22; h++) {
        for (const m of [0, 30]) {
            if (h === 22 && m === 30) break;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }
    return slots;
})();

// ── Occasions ─────────────────────────────────────────────────────────────────

const OCCASIONS = [
    { key: 'birthday',    label: 'Anniversaire', emoji: '🎂' },
    { key: 'anniversary', label: 'Anniversaire de mariage', emoji: '💍' },
    { key: 'dinner',      label: 'Dîner',         emoji: '🍽️' },
    { key: 'date',        label: 'Rendez-vous',   emoji: '💕' },
    { key: 'business',    label: 'Affaires',      emoji: '💼' },
    { key: 'family',      label: 'Famille',       emoji: '👨‍👩‍👧' },
    { key: 'surprise',    label: 'Surprise',      emoji: '🎉' },
    { key: 'other',       label: 'Autre',         emoji: '✨' },
] as const;

// ── Helper: generate upcoming dates ─────────────────────────────────────────

interface DayItem {
    date: Date;
    /** YYYY-MM-DD */
    isoDate: string;
    /** Short weekday label, e.g. "Lun" */
    weekday: string;
    /** Day number, e.g. "12" */
    day: string;
    /** Short month, e.g. "Jan" */
    month: string;
}

function generateUpcomingDays(count: number): DayItem[] {
    const days: DayItem[] = [];
    const today = new Date();
    // Normalise to start-of-day to avoid DST edge cases
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const isoDate = d.toISOString().split('T')[0];

        const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        const day = String(d.getDate());
        const month = d.toLocaleDateString('fr-FR', { month: 'short' });

        days.push({ date: d, isoDate, weekday, day, month });
    }
    return days;
}

const UPCOMING_DAYS = generateUpcomingDays(DAYS_AHEAD);

// ── Sub-components ───────────────────────────────────────────────────────────

interface SectionLabelProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    theme: typeof Colors.light;
    required?: boolean;
}

function SectionLabel({ icon, label, theme, required = false }: SectionLabelProps) {
    return (
        <View style={sectionLabelStyles.row}>
            <Ionicons name={icon} size={18} color={theme.primary} />
            <Text style={[sectionLabelStyles.text, { color: theme.text }]}>
                {label}
                {required && <Text style={{ color: theme.error }}> *</Text>}
            </Text>
        </View>
    );
}

const sectionLabelStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    text: {
        ...Typography.captionSemibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function ReserveScreen() {
    const { id: slug } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // ── Form state ──────────────────────────────────────────────────────────
    const [selectedDay, setSelectedDay] = useState<DayItem>(UPCOMING_DAYS[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [partySize, setPartySize] = useState(2);
    const [customerName, setCustomerName] = useState(user?.fullName ?? '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '');
    const [specialRequests, setSpecialRequests] = useState('');
    const [occasion, setOccasion] = useState<string | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Availability (real-time from API) ───────────────────────────────────
    const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    // Auto-fill user info when auth data loads (user may arrive after mount)
    React.useEffect(() => {
        if (user?.fullName && !customerName) {
            setCustomerName(user.fullName);
        }
        if (user?.phone && !customerPhone) {
            setCustomerPhone(user.phone);
        }
    }, [user]);

    // Fetch real-time availability when date or party size changes
    useEffect(() => {
        if (!slug) return;
        setAvailabilityLoading(true);
        setSelectedTime(null);
        getAvailability(slug, selectedDay.isoDate, partySize)
            .then((res) => {
                setAvailability(res);
                // Auto-select zone if only one is available
                if (res.zones.length === 1) setSelectedZoneId(res.zones[0].zone.id);
                else setSelectedZoneId(null);
            })
            .catch(() => setAvailability(null))
            .finally(() => setAvailabilityLoading(false));
    }, [slug, selectedDay.isoDate, partySize]);

    // Derive time slots: from selected zone or all zones merged
    const timeSlots: (AvailabilitySlot | { time: string; available: boolean; available_count: number; reserved_until: null })[] =
        React.useMemo(() => {
            if (!availability) {
                return FALLBACK_SLOTS.map((t) => ({ time: t, available: true, available_count: 1, reserved_until: null }));
            }
            const zone = availability.zones.find((z) => z.zone.id === selectedZoneId);
            if (zone) return zone.slots;
            // Merge all zones: a slot is available if ANY zone has it
            const mergedMap = new Map<string, AvailabilitySlot>();
            for (const z of availability.zones) {
                for (const slot of z.slots) {
                    const existing = mergedMap.get(slot.time);
                    if (!existing || slot.available_count > existing.available_count) {
                        mergedMap.set(slot.time, slot);
                    }
                }
            }
            // Fall back to unzoned slots if no zones
            const source = mergedMap.size > 0 ? Array.from(mergedMap.values()) : (availability.unzoned_slots ?? []);
            return source.length > 0 ? source : FALLBACK_SLOTS.map((t) => ({ time: t, available: true, available_count: 1, reserved_until: null }));
        }, [availability, selectedZoneId]);

    // Keep the date list ref for scroll-to-selected
    const dateListRef = useRef<FlatList<DayItem>>(null);

    // ── Handlers ────────────────────────────────────────────────────────────

    const decreaseParty = useCallback(() => {
        setPartySize((prev) => Math.max(MIN_PARTY, prev - 1));
    }, []);

    const increaseParty = useCallback(() => {
        setPartySize((prev) => Math.min(MAX_PARTY, prev + 1));
    }, []);

    const handleSubmit = useCallback(async () => {
        // ── Client-side validation ──────────────────────────────────────────
        if (!customerName.trim()) {
            Alert.alert('Champ requis', 'Veuillez saisir votre nom.');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Heure manquante', 'Veuillez sélectionner une heure.');
            return;
        }

        setSubmitting(true);
        try {
            await createReservation(slug!, {
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim() || undefined,
                customerId: user?.id,
                partySize,
                date: selectedDay.isoDate,
                time: selectedTime,
                specialRequests: specialRequests.trim() || undefined,
                occasion: occasion ?? undefined,
            });

            Alert.alert(
                '✅ Réservation confirmée !',
                `Votre table pour ${partySize} personne${partySize > 1 ? 's' : ''} le ${selectedDay.weekday} ${selectedDay.day} ${selectedDay.month} à ${selectedTime} a bien été enregistrée.\n\nLe restaurant vous contactera pour confirmer.`,
                [{ text: 'OK', onPress: () => router.back() }],
            );
        } catch (err: any) {
            Alert.alert(
                'Erreur de réservation',
                err?.message ?? 'Impossible de créer la réservation. Veuillez réessayer.',
            );
        } finally {
            setSubmitting(false);
        }
    }, [slug, customerName, customerPhone, partySize, selectedDay, selectedTime, specialRequests, user, router]);

    // ── Render helpers ──────────────────────────────────────────────────────

    const renderDayChip = useCallback(({ item }: { item: DayItem }) => {
        const isSelected = item.isoDate === selectedDay.isoDate;
        return (
            <Pressable
                onPress={() => setSelectedDay(item)}
                style={[
                    styles.dayChip,
                    {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.dayChipWeekday,
                        { color: isSelected ? '#fff' : theme.icon },
                    ]}
                >
                    {item.weekday.charAt(0).toUpperCase() + item.weekday.slice(1, 3)}
                </Text>
                <Text
                    style={[
                        styles.dayChipDay,
                        { color: isSelected ? '#fff' : theme.text },
                    ]}
                >
                    {item.day}
                </Text>
                <Text
                    style={[
                        styles.dayChipMonth,
                        { color: isSelected ? 'rgba(255,255,255,0.75)' : theme.icon },
                    ]}
                >
                    {item.month.charAt(0).toUpperCase() + item.month.slice(1, 4)}
                </Text>
            </Pressable>
        );
    }, [selectedDay.isoDate, theme]);

    // ── JSX ─────────────────────────────────────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.background,
                        paddingTop: insets.top + Spacing.sm,
                        borderBottomColor: theme.border,
                    },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: theme.surface }]}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>

                <View style={styles.headerTitleBlock}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Réserver une table
                    </Text>
                    <Text style={[styles.headerSub, { color: theme.icon }]}>
                        Remplissez le formulaire ci-dessous
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + Spacing.xxl },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                {/* ── Date ─────────────────────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="calendar-outline" label="Date" theme={theme} required />
                    <FlatList
                        ref={dateListRef}
                        data={UPCOMING_DAYS}
                        renderItem={renderDayChip}
                        keyExtractor={(item) => item.isoDate}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: Spacing.sm }}
                        style={styles.dayList}
                    />
                    <Text style={[styles.selectedDateLabel, { color: theme.icon }]}>
                        {selectedDay.date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </Text>
                </View>

                {/* ── Heure ────────────────────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="time-outline" label="Heure" theme={theme} required />
                    {availabilityLoading ? (
                        <View style={styles.availabilityLoader}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.hintText, { color: theme.icon }]}>Vérification des disponibilités…</Text>
                        </View>
                    ) : (
                        <View style={styles.timeGrid}>
                            {timeSlots.map((slot) => {
                                const isSelected = slot.time === selectedTime;
                                const isUnavailable = !slot.available;
                                return (
                                    <TouchableOpacity
                                        key={slot.time}
                                        onPress={() => !isUnavailable && setSelectedTime(slot.time)}
                                        activeOpacity={isUnavailable ? 1 : 0.7}
                                        style={[
                                            styles.timeChip,
                                            {
                                                backgroundColor: isSelected
                                                    ? theme.primary
                                                    : isUnavailable
                                                    ? theme.border + '60'
                                                    : theme.background,
                                                borderColor: isSelected
                                                    ? theme.primary
                                                    : isUnavailable
                                                    ? theme.border
                                                    : theme.border,
                                                opacity: isUnavailable ? 0.5 : 1,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.timeChipText,
                                                { color: isSelected ? '#fff' : isUnavailable ? theme.icon : theme.text },
                                            ]}
                                        >
                                            {slot.time}
                                        </Text>
                                        {isUnavailable && (
                                            <Ionicons name="close" size={10} color={theme.icon} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                    {!selectedTime && !availabilityLoading && (
                        <Text style={[styles.hintText, { color: theme.icon }]}>
                            Sélectionnez un créneau disponible
                        </Text>
                    )}
                </View>

                {/* ── Zone ─────────────────────────────────────────────── */}
                {availability && availability.zones.length > 1 && (
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <SectionLabel icon="map-outline" label="Choisissez votre espace" theme={theme} />
                        <Text style={[styles.hintText, { color: theme.icon, marginTop: 0, marginBottom: Spacing.sm, textAlign: 'left' }]}>
                            Sélectionnez l'espace qui vous convient le mieux
                        </Text>
                        <View style={styles.zoneCardList}>
                            {/* "No preference" option */}
                            <Pressable
                                onPress={() => setSelectedZoneId(null)}
                                style={[
                                    styles.zoneCard,
                                    {
                                        borderColor: !selectedZoneId ? theme.primary : theme.border,
                                        backgroundColor: !selectedZoneId ? theme.primary + '08' : theme.background,
                                    },
                                ]}
                            >
                                <View style={[styles.zoneCardNoPreferenceIcon, { backgroundColor: theme.border }]}>
                                    <Ionicons name="help-outline" size={22} color={theme.icon} />
                                </View>
                                <View style={styles.zoneCardInfo}>
                                    <Text style={[styles.zoneCardName, { color: !selectedZoneId ? theme.primary : theme.text }]}>
                                        Pas de préférence
                                    </Text>
                                    <Text style={[styles.zoneCardDesc, { color: theme.icon }]}>
                                        Le restaurant choisira la meilleure table pour vous
                                    </Text>
                                </View>
                                {!selectedZoneId && (
                                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                                )}
                            </Pressable>

                            {availability.zones.map(({ zone, slots, tables_count, total_capacity }) => {
                                const isSelected = selectedZoneId === zone.id;
                                const hasAvailability = slots.some((s) => s.available);
                                const coverImage = zone.image_urls?.[0] ?? zone.image_url;
                                const availableSlotCount = slots.filter((s) => s.available).length;

                                return (
                                    <Pressable
                                        key={zone.id}
                                        onPress={() => hasAvailability && setSelectedZoneId(zone.id)}
                                        style={[
                                            styles.zoneCard,
                                            {
                                                borderColor: isSelected ? theme.primary : theme.border,
                                                backgroundColor: isSelected ? theme.primary + '08' : theme.background,
                                                opacity: hasAvailability ? 1 : 0.5,
                                            },
                                        ]}
                                    >
                                        {/* Photo or color strip */}
                                        {coverImage ? (
                                            <Image
                                                source={{ uri: coverImage }}
                                                style={styles.zoneCardImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View
                                                style={[
                                                    styles.zoneCardColorStrip,
                                                    { backgroundColor: zone.color ?? theme.border },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={
                                                        zone.type === 'terrace' ? 'sunny-outline' :
                                                        zone.type === 'private' ? 'lock-closed-outline' :
                                                        zone.type === 'bar' ? 'wine-outline' :
                                                        'restaurant-outline'
                                                    }
                                                    size={28}
                                                    color="#fff"
                                                />
                                            </View>
                                        )}

                                        <View style={styles.zoneCardBody}>
                                            <View style={styles.zoneCardHeader}>
                                                <Text style={[styles.zoneCardName, { color: isSelected ? theme.primary : theme.text }]}>
                                                    {zone.name}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                                )}
                                                {!hasAvailability && (
                                                    <View style={[styles.zoneFullBadge, { backgroundColor: theme.error + '20' }]}>
                                                        <Text style={[styles.zoneFullBadgeText, { color: theme.error }]}>Complet</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {zone.description ? (
                                                <Text style={[styles.zoneCardDesc, { color: theme.icon }]} numberOfLines={2}>
                                                    {zone.description}
                                                </Text>
                                            ) : null}

                                            {/* Meta chips */}
                                            <View style={styles.zoneCardMeta}>
                                                {(zone.capacity > 0 || total_capacity > 0) && (
                                                    <View style={[styles.zoneMetaChip, { backgroundColor: theme.border + '60' }]}>
                                                        <Ionicons name="people-outline" size={12} color={theme.icon} />
                                                        <Text style={[styles.zoneMetaText, { color: theme.icon }]}>
                                                            {total_capacity > 0 ? total_capacity : zone.capacity} pers. max
                                                        </Text>
                                                    </View>
                                                )}
                                                {hasAvailability && (
                                                    <View style={[styles.zoneMetaChip, { backgroundColor: theme.success + '20' }]}>
                                                        <Ionicons name="time-outline" size={12} color={theme.success} />
                                                        <Text style={[styles.zoneMetaText, { color: theme.success }]}>
                                                            {availableSlotCount} créneau{availableSlotCount > 1 ? 'x' : ''}
                                                        </Text>
                                                    </View>
                                                )}
                                                {zone.pricing_note ? (
                                                    <View style={[styles.zoneMetaChip, { backgroundColor: theme.border + '60' }]}>
                                                        <Ionicons name="pricetag-outline" size={12} color={theme.icon} />
                                                        <Text style={[styles.zoneMetaText, { color: theme.icon }]}>
                                                            {zone.pricing_note}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>

                                            {/* Amenities */}
                                            {zone.amenities?.length > 0 && (
                                                <View style={styles.zoneAmenities}>
                                                    {zone.amenities.slice(0, 4).map((a, i) => (
                                                        <Text key={i} style={[styles.zoneAmenityTag, { color: theme.icon, borderColor: theme.border }]}>
                                                            {a}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Photo gallery thumbnails */}
                                            {zone.image_urls?.length > 1 && (
                                                <ScrollView
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    style={styles.zoneThumbScroll}
                                                    contentContainerStyle={{ gap: 6 }}
                                                >
                                                    {zone.image_urls.map((uri, i) => (
                                                        <Image
                                                            key={i}
                                                            source={{ uri }}
                                                            style={styles.zoneThumb}
                                                            resizeMode="cover"
                                                        />
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Occasion ─────────────────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="sparkles-outline" label="Occasion (optionnel)" theme={theme} />
                    <View style={styles.occasionGrid}>
                        {OCCASIONS.map((occ) => {
                            const isSelected = occasion === occ.key;
                            return (
                                <Pressable
                                    key={occ.key}
                                    onPress={() => setOccasion((prev) => (prev === occ.key ? null : occ.key))}
                                    style={[
                                        styles.occasionChip,
                                        {
                                            backgroundColor: isSelected ? theme.primary + '18' : theme.background,
                                            borderColor: isSelected ? theme.primary : theme.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.occasionEmoji}>{occ.emoji}</Text>
                                    <Text style={[styles.occasionLabel, { color: isSelected ? theme.primary : theme.text }]}>
                                        {occ.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* ── Nombre de personnes ───────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="people-outline" label="Nombre de personnes" theme={theme} required />
                    <View style={styles.stepperRow}>
                        <Pressable
                            onPress={decreaseParty}
                            disabled={partySize <= MIN_PARTY}
                            style={[
                                styles.stepperBtn,
                                {
                                    backgroundColor: partySize <= MIN_PARTY
                                        ? theme.border
                                        : theme.primary + '18',
                                    borderColor: partySize <= MIN_PARTY
                                        ? theme.border
                                        : theme.primary + '50',
                                },
                            ]}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="remove"
                                size={20}
                                color={partySize <= MIN_PARTY ? theme.icon : theme.primary}
                            />
                        </Pressable>

                        <View style={[styles.stepperDisplay, { borderColor: theme.border }]}>
                            <Text style={[styles.stepperValue, { color: theme.text }]}>
                                {partySize}
                            </Text>
                            <Text style={[styles.stepperUnit, { color: theme.icon }]}>
                                {partySize === 1 ? 'personne' : 'personnes'}
                            </Text>
                        </View>

                        <Pressable
                            onPress={increaseParty}
                            disabled={partySize >= MAX_PARTY}
                            style={[
                                styles.stepperBtn,
                                {
                                    backgroundColor: partySize >= MAX_PARTY
                                        ? theme.border
                                        : theme.primary + '18',
                                    borderColor: partySize >= MAX_PARTY
                                        ? theme.border
                                        : theme.primary + '50',
                                },
                            ]}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color={partySize >= MAX_PARTY ? theme.icon : theme.primary}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* ── Informations client ───────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="person-outline" label="Vos informations" theme={theme} />

                    <Text style={[styles.inputLabel, { color: theme.icon }]}>
                        Nom complet <Text style={{ color: theme.error }}>*</Text>
                    </Text>
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Votre nom"
                        placeholderTextColor={theme.icon + '80'}
                        style={[
                            styles.textInput,
                            {
                                color: theme.text,
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                            },
                        ]}
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <Text style={[styles.inputLabel, { color: theme.icon, marginTop: Spacing.md }]}>
                        Numéro de téléphone
                    </Text>
                    <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="+237 6XX XXX XXX"
                        placeholderTextColor={theme.icon + '80'}
                        style={[
                            styles.textInput,
                            {
                                color: theme.text,
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                            },
                        ]}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                    />
                </View>

                {/* ── Demandes spéciales ────────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SectionLabel icon="chatbubble-ellipses-outline" label="Demandes spéciales" theme={theme} />
                    <TextInput
                        value={specialRequests}
                        onChangeText={setSpecialRequests}
                        placeholder="Allergie, anniversaire, chaise haute, siège fenêtre… (optionnel)"
                        placeholderTextColor={theme.icon + '80'}
                        style={[
                            styles.textInput,
                            styles.textInputMultiline,
                            {
                                color: theme.text,
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                            },
                        ]}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit
                    />
                </View>

                {/* ── Récapitulatif ─────────────────────────────────────── */}
                {selectedTime && (
                    <View
                        style={[
                            styles.summaryCard,
                            {
                                backgroundColor: theme.primary + '10',
                                borderColor: theme.primary + '30',
                            },
                        ]}
                    >
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.summaryTitle, { color: theme.text }]}>
                                Récapitulatif
                            </Text>
                            <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                📅&nbsp; {selectedDay.date.toLocaleDateString('fr-FR', {
                                    weekday: 'long', day: 'numeric', month: 'long',
                                })} à {selectedTime}
                            </Text>
                            <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                👥&nbsp; {partySize} personne{partySize > 1 ? 's' : ''}
                            </Text>
                            {customerName.trim() ? (
                                <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                    👤&nbsp; {customerName.trim()}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                )}

                {/* ── Submit button ─────────────────────────────────────── */}
                <Pressable
                    onPress={handleSubmit}
                    disabled={submitting || !selectedTime || !customerName.trim()}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor:
                                submitting || !selectedTime || !customerName.trim()
                                    ? theme.border
                                    : theme.primary,
                            opacity: pressed ? 0.88 : 1,
                            ...Shadows.md,
                            shadowColor: theme.primary,
                        },
                    ]}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>Confirmer la réservation</Text>
                        </>
                    )}
                </Pressable>

                <Text style={[styles.disclaimer, { color: theme.icon }]}>
                    Votre réservation sera confirmée par le restaurant dans les meilleurs délais.
                </Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleBlock: {
        flex: 1,
    },
    headerTitle: {
        ...Typography.headline,
    },
    headerSub: {
        ...Typography.small,
        marginTop: 2,
    },

    // Scroll
    scrollContent: {
        padding: Spacing.md,
        gap: Spacing.md,
    },

    // Cards
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },

    // Date chips
    dayList: {
        marginHorizontal: -Spacing.xs,
    },
    dayChip: {
        width: 58,
        borderWidth: 1.5,
        borderRadius: Radii.md,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        gap: 2,
    },
    dayChipWeekday: {
        ...Typography.small,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    dayChipDay: {
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 24,
    },
    dayChipMonth: {
        ...Typography.small,
        fontSize: 11,
    },
    selectedDateLabel: {
        ...Typography.small,
        marginTop: Spacing.sm,
        textAlign: 'center',
        textTransform: 'capitalize',
    },

    // Time grid
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    timeChip: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.md - 4,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    timeChipText: {
        ...Typography.captionSemibold,
        fontVariant: ['tabular-nums'],
    },
    hintText: {
        ...Typography.small,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },

    // Party stepper
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperDisplay: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 2,
        paddingBottom: Spacing.xs,
    },
    stepperValue: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 38,
        fontVariant: ['tabular-nums'],
    },
    stepperUnit: {
        ...Typography.small,
        marginTop: 0,
    },

    // Text inputs
    inputLabel: {
        ...Typography.small,
        marginBottom: Spacing.xs,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        ...Typography.body,
    },
    textInputMultiline: {
        minHeight: 80,
        paddingTop: Spacing.sm + 2,
    },

    // Summary
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },
    summaryTitle: {
        ...Typography.captionSemibold,
        marginBottom: Spacing.xs,
    },
    summaryLine: {
        ...Typography.caption,
        marginTop: 2,
    },

    // Submit
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        marginTop: Spacing.xs,
    },
    submitBtnText: {
        color: '#fff',
        ...Typography.bodySemibold,
        fontWeight: '700',
    },

    // Availability loader
    availabilityLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },

    // Zone cards
    zoneCardList: {
        gap: Spacing.sm,
    },
    zoneCard: {
        borderWidth: 1.5,
        borderRadius: Radii.lg,
        overflow: 'hidden',
    },
    zoneCardImage: {
        width: '100%',
        height: 140,
    },
    zoneCardColorStrip: {
        width: '100%',
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoneCardNoPreferenceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        margin: Spacing.md,
        alignSelf: 'flex-start',
    },
    zoneCardBody: {
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    zoneCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    zoneCardName: {
        ...Typography.bodySemibold,
        flex: 1,
    },
    zoneCardInfo: {
        flex: 1,
        gap: 2,
        paddingVertical: Spacing.xs,
    },
    zoneCardDesc: {
        ...Typography.small,
        lineHeight: 18,
    },
    zoneCardMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: 4,
    },
    zoneMetaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.sm,
    },
    zoneMetaText: {
        ...Typography.small,
        fontSize: 11,
        fontWeight: '600',
    },
    zoneFullBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radii.sm,
    },
    zoneFullBadgeText: {
        ...Typography.small,
        fontSize: 11,
        fontWeight: '700',
    },
    zoneAmenities: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    zoneAmenityTag: {
        ...Typography.small,
        fontSize: 11,
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    zoneThumbScroll: {
        marginTop: Spacing.sm,
    },
    zoneThumb: {
        width: 72,
        height: 54,
        borderRadius: Radii.sm,
    },

    // Occasion chips
    occasionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    occasionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
    },
    occasionEmoji: {
        fontSize: 16,
    },
    occasionLabel: {
        ...Typography.caption,
        fontWeight: '600',
    },

    // Disclaimer
    disclaimer: {
        ...Typography.small,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.md,
    },
});
