import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COIN_BALANCE = 350;

const EARN_WAYS = [
    { icon: "user-plus",  title: "Refer a Friend",       coins: "+100",  desc: "Each friend who downloads using your code earns you 100 coins.",  color: "#4ade80" },
    { icon: "calendar",   title: "Book a Session",        coins: "+50",   desc: "Complete any photography booking and earn 50 coins.",             color: "#60a5fa" },
    { icon: "star",       title: "Leave a Review",        coins: "+20",   desc: "Write a review after your session and earn 20 coins.",            color: "#facc15" },
    { icon: "share-2",    title: "Share on Social Media", coins: "+10",   desc: "Share your photos on Instagram or Facebook and tag us.",          color: "#f472b6" },
    { icon: "gift",       title: "Birthday Bonus",        coins: "+50",   desc: "Get 50 bonus coins on your birthday every year.",                 color: "#a78bfa" },
];

const REDEEM_WAYS = [
    { icon: "tag",        title: "Booking Discount",  desc: "Use coins to get a discount on your next booking. 100 coins = ₹100 off." },
    { icon: "package",    title: "Album Upgrade",     desc: "Redeem coins to upgrade your photo album to premium quality." },
    { icon: "image",      title: "Extra Prints",      desc: "Exchange coins for additional photo prints from your session." },
];

function CoinBar({ value, max, color }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, { toValue: value / max, duration: 900, useNativeDriver: false }).start();
    }, []);
    const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
        <View style={barStyles.track}>
            <Animated.View style={[barStyles.fill, { width, backgroundColor: color }]} />
        </View>
    );
}
const barStyles = StyleSheet.create({
    track: { height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden', flex: 1 },
    fill:  { height: 6, borderRadius: 3 },
});

export default function EarnCoins() {
    const coinAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(coinAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }, []);

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader title="Earn Coins" onBack={() => router.back()} />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {/* Balance card */}
                <Animated.View style={[styles.balanceCard, { transform: [{ scale: coinAnim }] }]}>
                    <View style={styles.coinIconWrap}>
                        <Feather name="award" size={28} color={colors.primarybtn} />
                    </View>
                    <Text style={styles.balanceLabel}>Your Coin Balance</Text>
                    <Text style={styles.balanceAmount}>{COIN_BALANCE}</Text>
                    <Text style={styles.balanceValue}>= ₹{COIN_BALANCE} redeemable value</Text>

                    {/* Progress to next milestone */}
                    <View style={styles.milestoneRow}>
                        <Text style={styles.milestoneLabel}>{COIN_BALANCE} / 500 coins to next reward</Text>
                        <Text style={styles.milestoneLabel}>{500 - COIN_BALANCE} more</Text>
                    </View>
                    <CoinBar value={COIN_BALANCE} max={500} color={colors.primarybtn} />
                </Animated.View>

                {/* Ways to earn */}
                <Text style={styles.sectionLabel}>Ways to Earn</Text>
                <View style={styles.listCard}>
                    {EARN_WAYS.map((w, idx) => (
                        <View key={idx} style={[styles.row, idx === EARN_WAYS.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.iconBox, { backgroundColor: w.color + '18' }]}>
                                <Feather name={w.icon} size={18} color={w.color} />
                            </View>
                            <View style={styles.rowBody}>
                                <View style={styles.rowTop}>
                                    <Text style={styles.rowTitle}>{w.title}</Text>
                                    <View style={[styles.coinBadge, { backgroundColor: w.color + '18', borderColor: w.color + '44' }]}>
                                        <Text style={[styles.coinBadgeText, { color: w.color }]}>{w.coins} coins</Text>
                                    </View>
                                </View>
                                <Text style={styles.rowDesc}>{w.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* How to redeem */}
                <Text style={styles.sectionLabel}>How to Redeem</Text>
                <View style={styles.listCard}>
                    {REDEEM_WAYS.map((w, idx) => (
                        <View key={idx} style={[styles.row, idx === REDEEM_WAYS.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#1f2937' }]}>
                                <Feather name={w.icon} size={18} color={colors.primarybtn} />
                            </View>
                            <View style={styles.rowBody}>
                                <Text style={styles.rowTitle}>{w.title}</Text>
                                <Text style={styles.rowDesc}>{w.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.referBtn} onPress={() => router.push('/details/referfriend')} activeOpacity={0.85}>
                    <Feather name="user-plus" size={18} color="#000" />
                    <Text style={styles.referBtnText}>Refer a Friend Now</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScreenWrapper>
        </>
    );
}

const styles = StyleSheet.create({
    header: { display: 'none' },
    backBtn: { display: 'none' },
    headerTitle: { display: 'none' },

    balanceCard: {
        marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: '#1f1508',
        borderRadius: 20, padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.primarybtn + '33',
    },
    coinIconWrap: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: colors.primarybtn + '22',
        borderWidth: 2, borderColor: colors.primarybtn + '44',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.md,
    },
    balanceLabel: { fontFamily: fonts.text, fontSize: 13, color: colors.inactive, marginBottom: 4 },
    balanceAmount: { fontFamily: fonts.heading, fontSize: 52, color: colors.primarybtn, lineHeight: 60 },
    balanceValue: { fontFamily: fonts.text, fontSize: 13, color: colors.subheading, marginBottom: spacing.md },
    milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6 },
    milestoneLabel: { fontFamily: fonts.text, fontSize: 11, color: colors.inactive },

    sectionLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    listCard: {
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 14, overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a', gap: spacing.md,
    },
    iconBox: {
        width: 40, height: 40, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginTop: 2,
    },
    rowBody: { flex: 1 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    rowTitle: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white },
    rowDesc: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, lineHeight: 17 },
    coinBadge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 20, borderWidth: 1,
    },
    coinBadgeText: { fontFamily: fonts.subheading, fontSize: 11 },

    referBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: colors.primarybtn, borderRadius: 14,
        paddingVertical: spacing.md,
    },
    referBtnText: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: '#000' },
});
