import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";
import { ORDERS } from "./ordertracking";

export default function OrderDetail() {
    const { id } = useLocalSearchParams();
    const order = ORDERS.find(o => o.id === id);

    if (!order) return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.white }}>Order not found.</Text>
        </View>
    );

    const isDelivered = order.currentStep === order.steps.length - 1;

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader
                title={order.title}
                subtitle={`${order.id} · ${order.date}`}
                onBack={() => router.back()}
            />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {/* Status Banner */}
                <View style={[styles.banner, isDelivered && styles.bannerDone]}>
                    <Feather
                        name={isDelivered ? 'check-circle' : 'truck'}
                        size={20}
                        color={isDelivered ? '#4ade80' : colors.primarybtn}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.bannerStatus, isDelivered && { color: '#4ade80' }]}>
                            {order.steps[order.currentStep]?.label}
                        </Text>
                        {order.steps[order.currentStep]?.date && (
                            <Text style={styles.bannerDate}>
                                {order.steps[order.currentStep].date} · {order.steps[order.currentStep].time}
                            </Text>
                        )}
                    </View>
                    {/* Progress fraction */}
                    <Text style={styles.bannerFraction}>
                        {order.currentStep + 1}/{order.steps.length}
                    </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                        width: `${((order.currentStep + 1) / order.steps.length) * 100}%`,
                        backgroundColor: isDelivered ? '#4ade80' : colors.primarybtn,
                    }]} />
                </View>

                {/* Timeline */}
                <Text style={styles.sectionLabel}>Delivery Timeline</Text>
                <View style={styles.timeline}>
                    {order.steps.map((step, idx) => {
                        const done = idx <= order.currentStep;
                        const active = idx === order.currentStep;
                        const isLast = idx === order.steps.length - 1;

                        return (
                            <View key={idx} style={styles.stepRow}>
                                {/* Left: dot + line */}
                                <View style={styles.stepLeft}>
                                    <View style={[
                                        styles.dot,
                                        done && styles.dotDone,
                                        active && styles.dotActive,
                                    ]}>
                                        <Feather
                                            name={step.icon}
                                            size={13}
                                            color={done ? '#fff' : '#555'}
                                        />
                                    </View>
                                    {!isLast && <View style={[styles.line, done && styles.lineDone]} />}
                                </View>

                                {/* Right: content card */}
                                <View style={[
                                    styles.stepCard,
                                    active && styles.stepCardActive,
                                    isLast && { marginBottom: 0 },
                                ]}>
                                    <View style={styles.stepCardTop}>
                                        <Text style={[
                                            styles.stepLabel,
                                            done && styles.stepLabelDone,
                                            active && styles.stepLabelActive,
                                        ]}>
                                            {step.label}
                                        </Text>
                                        {active && (
                                            <View style={styles.activePill}>
                                                <Text style={styles.activePillText}>Current</Text>
                                            </View>
                                        )}
                                        {done && !active && (
                                            <Feather name="check" size={14} color={colors.primarybtn} />
                                        )}
                                    </View>

                                    <Text style={styles.stepDesc}>{step.desc}</Text>

                                    {step.date && (
                                        <Text style={styles.stepMeta}>
                                            <Feather name="clock" size={11} color={colors.inactive} /> {step.date} · {step.time}
                                        </Text>
                                    )}
                                    {!step.date && (
                                        <Text style={styles.stepMetaPending}>Pending</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View style={{ height: 60 }} />
            </ScreenWrapper>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.md,
        height: 88,
        backgroundColor: colors.topbardark,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    backBtn: { padding: 4, paddingBottom: 2 },
    headerTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.mx,
        color: colors.white,
    },
    headerSub: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.inactive,
        marginTop: 2,
    },

    // Banner
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        backgroundColor: '#2a1a0e',
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.primarybtn + '33',
    },
    bannerDone: {
        backgroundColor: '#0d2a1a',
        borderColor: '#4ade8033',
    },
    bannerStatus: {
        fontFamily: fonts.subheading,
        fontSize: spacing.sxx,
        color: colors.primarybtn,
    },
    bannerDate: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.inactive,
        marginTop: 2,
    },
    bannerFraction: {
        fontFamily: fonts.subheading,
        fontSize: spacing.sxx,
        color: colors.inactive,
    },

    // Progress bar
    progressTrack: {
        height: 4,
        backgroundColor: '#2a2a2a',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: 4,
        borderRadius: 2,
    },

    sectionLabel: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.inactive,
        marginHorizontal: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    // Timeline
    timeline: {
        marginHorizontal: spacing.md,
    },
    stepRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    stepLeft: {
        alignItems: 'center',
        width: 32,
    },
    dot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E2128',
        borderWidth: 1.5,
        borderColor: '#3a3a3a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotDone: {
        backgroundColor: colors.primarybtn,
        borderColor: colors.primarybtn,
    },
    dotActive: {
        backgroundColor: colors.primarybtn,
        borderColor: '#fff',
        shadowColor: colors.primarybtn,
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#2a2a2a',
        marginVertical: 3,
        minHeight: 20,
    },
    lineDone: {
        backgroundColor: colors.primarybtn,
    },

    // Step card
    stepCard: {
        flex: 1,
        backgroundColor: '#1E2128',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    stepCardActive: {
        borderColor: colors.primarybtn + '66',
        backgroundColor: '#1f1508',
    },
    stepCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    stepLabel: {
        fontFamily: fonts.subheading,
        fontSize: spacing.sxx,
        color: colors.inactive,
    },
    stepLabelDone: {
        color: colors.white,
    },
    stepLabelActive: {
        color: colors.primarybtn,
    },
    activePill: {
        backgroundColor: colors.primarybtn + '22',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.primarybtn + '55',
    },
    activePillText: {
        fontFamily: fonts.text,
        fontSize: 11,
        color: colors.primarybtn,
    },
    stepDesc: {
        fontFamily: fonts.text,
        fontSize: 13,
        color: colors.subheading,
        lineHeight: 18,
        marginBottom: 6,
    },
    stepMeta: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.inactive,
    },
    stepMetaPending: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: '#444',
        fontStyle: 'italic',
    },
});
