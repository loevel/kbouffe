import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupport } from '@/contexts/support-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QUICK_ACTIONS = [
    {
        icon: 'create-outline' as const,
        color: '#3b82f6',
        title: 'Créer un ticket',
        subtitle: 'Signaler un problème',
        route: '/support/new-ticket',
    },
    {
        icon: 'list-outline' as const,
        color: '#10b981',
        title: 'Mes tickets',
        subtitle: 'Suivre mes demandes',
        route: '/support/tickets',
        showCount: true,
    },
    {
        icon: 'document-text-outline' as const,
        color: '#a855f7',
        title: 'Pages légales',
        subtitle: 'CGU, confidentialité...',
        route: '/legal/client',
    },
];

const CONTACT_OPTIONS = [
    {
        icon: 'mail-outline' as const,
        color: '#3b82f6',
        label: 'Email',
        value: 'support@kbouffe.com',
        action: 'mailto:support@kbouffe.com',
    },
    {
        icon: 'call-outline' as const,
        color: '#10b981',
        label: 'Téléphone',
        value: '+237 6XX XXX XXX',
        action: 'tel:+237600000000',
    },
];

export default function SupportCenterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const { faq, tickets } = useSupport();

    const openTicketCount = tickets.filter(t => t.status !== 'closed').length;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Centre d'aide</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Info banner */}
                <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                    style={[styles.infoBanner, { backgroundColor: isDark ? '#3b82f610' : '#eff6ff', borderColor: '#3b82f625' }]}
                >
                    <View style={[styles.infoIconBox, { backgroundColor: '#3b82f618' }]}>
                        <Ionicons name="information-circle" size={22} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
                            Contact direct avec vos commerçants
                        </Text>
                        <Text style={[styles.infoText, { color: isDark ? '#93c5fd90' : '#1e40af90' }]}>
                            Pour toute question sur votre repas ou sa livraison, contactez directement le restaurant concerné.
                        </Text>
                    </View>
                </Animated.View>

                {/* Quick actions */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: theme.icon }]}>ACTIONS RAPIDES</Text>
                    <View style={[styles.actionsCard, { backgroundColor: theme.surface }]}>
                        {QUICK_ACTIONS.map((action, index) => (
                            <AnimatedPressable
                                key={action.title}
                                entering={FadeInDown.delay(100 + index * 60).duration(400).springify()}
                                style={({ pressed }) => [
                                    styles.actionRow,
                                    index < QUICK_ACTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '30' },
                                    pressed && { opacity: 0.7, backgroundColor: theme.primary + '05' },
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push(action.route as any);
                                }}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon} size={20} color={action.color} />
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={[styles.actionTitle, { color: theme.text }]}>{action.title}</Text>
                                    <Text style={[styles.actionSubtitle, { color: theme.icon }]}>
                                        {action.subtitle}
                                    </Text>
                                </View>
                                {action.showCount && openTicketCount > 0 && (
                                    <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.countText}>{openTicketCount}</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={theme.border} />
                            </AnimatedPressable>
                        ))}
                    </View>
                </View>

                {/* FAQ section */}
                {faq.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionLabel, { color: theme.icon }]}>QUESTIONS FRÉQUENTES</Text>
                        <View style={[styles.faqCard, { backgroundColor: theme.surface }]}>
                            {faq.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(250 + index * 60).duration(400).springify()}
                                    style={[
                                        styles.faqItem,
                                        index < faq.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '30' },
                                    ]}
                                >
                                    <View style={styles.faqHeader}>
                                        <View style={[styles.faqBullet, { backgroundColor: theme.primary + '20' }]}>
                                            <Ionicons name="help" size={14} color={theme.primary} />
                                        </View>
                                        <Text style={[styles.faqQuestion, { color: theme.text }]}>{item.question}</Text>
                                    </View>
                                    <Text style={[styles.faqAnswer, { color: theme.icon }]}>{item.answer}</Text>
                                </Animated.View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Contact section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: theme.icon }]}>NOUS CONTACTER</Text>
                    <View style={styles.contactGrid}>
                        {CONTACT_OPTIONS.map((contact, index) => (
                            <AnimatedPressable
                                key={contact.label}
                                entering={FadeInDown.delay(380 + index * 60).duration(400).springify()}
                                style={({ pressed }) => [
                                    styles.contactCard,
                                    { backgroundColor: theme.surface, borderColor: theme.border + '30' },
                                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    Linking.openURL(contact.action);
                                }}
                            >
                                <View style={[styles.contactIconBox, { backgroundColor: contact.color + '15' }]}>
                                    <Ionicons name={contact.icon} size={22} color={contact.color} />
                                </View>
                                <Text style={[styles.contactLabel, { color: theme.icon }]}>{contact.label}</Text>
                                <Text style={[styles.contactValue, { color: theme.text }]}>{contact.value}</Text>
                            </AnimatedPressable>
                        ))}
                    </View>
                </View>
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

    /* Info banner */
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
    },
    infoIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTitle: { ...Typography.captionSemibold, fontWeight: '700', marginBottom: 2 },
    infoText: { ...Typography.caption, lineHeight: 20 },

    /* Section container */
    sectionContainer: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    sectionLabel: {
        ...Typography.small,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        marginTop: Spacing.md,
    },

    /* Actions card */
    actionsCard: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    actionIconBox: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContent: { flex: 1 },
    actionTitle: { ...Typography.bodySemibold },
    actionSubtitle: { ...Typography.caption, marginTop: 1 },
    countBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    countText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    /* FAQ */
    faqCard: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
    faqItem: { padding: Spacing.md, gap: Spacing.md },
    faqHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    faqBullet: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    faqQuestion: { ...Typography.captionSemibold, fontWeight: '700', flex: 1 },
    faqAnswer: { ...Typography.caption, lineHeight: 20, paddingLeft: 26 + Spacing.md, marginTop: Spacing.sm },

    /* Contact grid */
    contactGrid: { flexDirection: 'row', gap: Spacing.sm },
    contactCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radii.xl,
        borderWidth: 1,
        gap: 8,
        ...Shadows.md,
    },
    contactIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactLabel: { ...Typography.small, fontWeight: '600' },
    contactValue: { ...Typography.caption, fontWeight: '600', textAlign: 'center' },
});
