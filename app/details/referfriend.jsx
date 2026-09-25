import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import {
    Alert, Animated, Share, StyleSheet,
    Text, TouchableOpacity, View,
} from "react-native";

const REFERRAL_CODE = "RABIN100";
const REFERRAL_LINK = "https://rabinsphotography.com/app?ref=RABIN100";

const STEPS = [
    { icon: "share-2",    title: "Share Your Code",   desc: "Send your unique referral code or link to a friend." },
    { icon: "download",   title: "Friend Downloads",  desc: "Your friend downloads the Rabin's Photography app." },
    { icon: "award",      title: "Both Earn 100 Coins", desc: "You and your friend each get 100 coins instantly." },
];

const REFERRED = [
    { name: "Arjun Sharma",   date: "Apr 12, 2026", coins: 100, status: "Credited" },
    { name: "Priya Mehta",    date: "Apr 8, 2026",  coins: 100, status: "Credited" },
    { name: "Rohit Das",      date: "Mar 30, 2026", coins: 100, status: "Pending"  },
];

export default function ReferFriend() {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleCopy = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, friction: 4 }),
            Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, friction: 4 }),
        ]).start();
        Alert.alert("Copied!", `Referral code "${REFERRAL_CODE}" copied to clipboard.`);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `📸 Book your photography session with Rabin's Photography!\nUse my referral code *${REFERRAL_CODE}* and get ₹100 off your first booking.\n\nDownload: ${REFERRAL_LINK}`,
                title: "Refer & Earn with Rabin's Photography",
            });
        } catch (_) {}
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader title="Refer a Friend" onBack={() => router.back()} />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {/* Hero banner */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroIconRing}>
                        <View style={styles.heroIconInner}>
                            <Feather name="users" size={32} color={colors.primarybtn} />
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>Invite Friends,{"\n"}Earn Together</Text>
                    <Text style={styles.heroSub}>For every friend who downloads the app using your code, you both earn <Text style={styles.heroHighlight}>100 coins = ₹100</Text></Text>
                </View>

                {/* Referral code card */}
                <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Your Referral Code</Text>
                    <Animated.View style={[styles.codeBox, { transform: [{ scale: scaleAnim }] }]}>
                        <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
                        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                            <Feather name="copy" size={16} color="#000" />
                            <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                        <Feather name="share-2" size={18} color="#000" />
                        <Text style={styles.shareBtnText}>Share with Friends</Text>
                    </TouchableOpacity>
                </View>

                {/* How it works */}
                <Text style={styles.sectionLabel}>How It Works</Text>
                <View style={styles.stepsCard}>
                    {STEPS.map((step, idx) => (
                        <View key={idx} style={[styles.stepRow, idx === STEPS.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={styles.stepNumBox}>
                                <Text style={styles.stepNum}>{idx + 1}</Text>
                            </View>
                            <View style={styles.stepIconBox}>
                                <Feather name={step.icon} size={18} color={colors.primarybtn} />
                            </View>
                            <View style={styles.stepText}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDesc}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Referred friends */}
                <Text style={styles.sectionLabel}>Friends Referred ({REFERRED.length})</Text>
                <View style={styles.stepsCard}>
                    {REFERRED.map((r, idx) => (
                        <View key={idx} style={[styles.referRow, idx === REFERRED.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarLetter}>{r.name[0]}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.referName}>{r.name}</Text>
                                <Text style={styles.referDate}>{r.date}</Text>
                            </View>
                            <View style={styles.referRight}>
                                <Text style={styles.referCoins}>+{r.coins} coins</Text>
                                <View style={[styles.referBadge, r.status === 'Pending' && styles.referBadgePending]}>
                                    <Text style={[styles.referBadgeText, r.status === 'Pending' && styles.referBadgeTextPending]}>
                                        {r.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScreenWrapper>
        </>
    );
}

const styles = StyleSheet.create({
    header: { display: 'none' },
    backBtn: { display: 'none' },
    headerTitle: { display: 'none' },

    // Hero
    heroBanner: {
        marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: '#1f1508',
        borderRadius: 20, padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.primarybtn + '33',
    },
    heroIconRing: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, borderColor: colors.primarybtn + '44',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.md,
    },
    heroIconInner: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: colors.primarybtn + '22',
        justifyContent: 'center', alignItems: 'center',
    },
    heroTitle: {
        fontFamily: fonts.heading, fontSize: 26,
        color: colors.white, textAlign: 'center',
        marginBottom: spacing.sm,
    },
    heroSub: {
        fontFamily: fonts.text, fontSize: 13,
        color: colors.inactive, textAlign: 'center', lineHeight: 20,
    },
    heroHighlight: { color: colors.primarybtn, fontFamily: fonts.subheading },

    // Code card
    codeCard: {
        marginHorizontal: spacing.md, marginTop: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 16, padding: spacing.lg,
    },
    codeLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md,
    },
    codeBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#111318', borderRadius: 12,
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderWidth: 1.5, borderColor: colors.primarybtn + '55',
        marginBottom: spacing.md,
    },
    codeText: { fontFamily: fonts.subheading, fontSize: 22, color: colors.primarybtn, letterSpacing: 4 },
    copyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.primarybtn, borderRadius: 8,
        paddingHorizontal: spacing.md, paddingVertical: 8,
    },
    copyText: { fontFamily: fonts.subheading, fontSize: 13, color: '#000' },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, backgroundColor: colors.primarybtn,
        borderRadius: 12, paddingVertical: spacing.md,
    },
    shareBtnText: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: '#000' },

    sectionLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },

    // Steps
    stepsCard: {
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 14, overflow: 'hidden',
    },
    stepRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a', gap: spacing.md,
    },
    stepNumBox: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colors.primarybtn + '22',
        borderWidth: 1, borderColor: colors.primarybtn + '55',
        justifyContent: 'center', alignItems: 'center',
    },
    stepNum: { fontFamily: fonts.subheading, fontSize: 11, color: colors.primarybtn },
    stepIconBox: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center',
    },
    stepText: { flex: 1 },
    stepTitle: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, marginBottom: 2 },
    stepDesc: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, lineHeight: 17 },

    // Referred list
    referRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a', gap: spacing.md,
    },
    avatarCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primarybtn + '22',
        borderWidth: 1, borderColor: colors.primarybtn + '44',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarLetter: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.primarybtn },
    referName: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, marginBottom: 2 },
    referDate: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive },
    referRight: { alignItems: 'flex-end', gap: 4 },
    referCoins: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: '#4ade80' },
    referBadge: {
        backgroundColor: '#0d2a1a', borderRadius: 20,
        paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: '#4ade8044',
    },
    referBadgePending: { backgroundColor: '#2a1a0e', borderColor: colors.primarybtn + '44' },
    referBadgeText: { fontFamily: fonts.text, fontSize: 11, color: '#4ade80' },
    referBadgeTextPending: { color: colors.primarybtn },
});
