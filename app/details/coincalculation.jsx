import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const COIN_BALANCE  = 350;
const COIN_TO_RUPEE = 1; // 1 coin = ₹1

const HISTORY = [
    { id: 1, type: 'earn',   label: 'Referral Bonus — Arjun',   coins: +100, date: 'Apr 12, 2026' },
    { id: 2, type: 'earn',   label: 'Booking Reward',            coins: +50,  date: 'Apr 10, 2026' },
    { id: 3, type: 'redeem', label: 'Redeemed on Booking #4821', coins: -200, date: 'Apr 5, 2026'  },
    { id: 4, type: 'earn',   label: 'Referral Bonus — Priya',    coins: +100, date: 'Apr 8, 2026'  },
    { id: 5, type: 'earn',   label: 'Review Reward',             coins: +20,  date: 'Mar 28, 2026' },
    { id: 6, type: 'earn',   label: 'Birthday Bonus',            coins: +50,  date: 'Mar 15, 2026' },
    { id: 7, type: 'redeem', label: 'Redeemed on Album Upgrade', coins: -100, date: 'Mar 10, 2026' },
    { id: 8, type: 'earn',   label: 'Booking Reward',            coins: +50,  date: 'Mar 5, 2026'  },
    { id: 9, type: 'earn',   label: 'Referral Bonus — Rohit',    coins: +100, date: 'Feb 28, 2026' },
    { id: 10,type: 'redeem', label: 'Redeemed on Extra Prints',  coins: -20,  date: 'Feb 20, 2026' },
];

function AnimatedCounter({ target }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setDisplay(target); clearInterval(timer); }
            else setDisplay(start);
        }, 20);
        return () => clearInterval(timer);
    }, [target]);
    return <Text style={styles.balanceNum}>{display}</Text>;
}

export default function CoinCalculation() {
    const [coins, setCoins] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 7,   useNativeDriver: true }),
        ]).start();
    }, []);

    const rupeeValue = coins ? parseInt(coins.replace(/\D/g, '') || '0') * COIN_TO_RUPEE : null;

    const totalEarned  = HISTORY.filter(h => h.type === 'earn').reduce((s, h) => s + h.coins, 0);
    const totalRedeemed = Math.abs(HISTORY.filter(h => h.type === 'redeem').reduce((s, h) => s + h.coins, 0));

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader title="Coin Calculation" onBack={() => router.back()} />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {/* Balance hero */}
                <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {/* Rate pill */}
                    <View style={styles.ratePill}>
                        <Feather name="zap" size={12} color={colors.primarybtn} />
                        <Text style={styles.ratePillText}>1 Coin = ₹1</Text>
                    </View>

                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <View style={styles.balanceRow}>
                        <Feather name="award" size={28} color={colors.primarybtn} style={{ marginRight: 8 }} />
                        <AnimatedCounter target={COIN_BALANCE} />
                        <Text style={styles.coinUnit}> coins</Text>
                    </View>
                    <Text style={styles.rupeeEquiv}>= ₹{COIN_BALANCE} redeemable value</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>+{totalEarned}</Text>
                            <Text style={styles.statLabel}>Total Earned</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statNum, { color: '#f87171' }]}>-{totalRedeemed}</Text>
                            <Text style={styles.statLabel}>Total Redeemed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statNum, { color: '#4ade80' }]}>{COIN_BALANCE}</Text>
                            <Text style={styles.statLabel}>Balance</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Converter */}
                <Text style={styles.sectionLabel}>Coin Converter</Text>
                <View style={styles.converterCard}>
                    <Text style={styles.converterHint}>Enter coins to see rupee value</Text>
                    <View style={styles.converterRow}>
                        <View style={styles.converterInput}>
                            <Feather name="award" size={16} color={colors.primarybtn} />
                            <TextInput
                                style={styles.converterField}
                                placeholder="0"
                                placeholderTextColor={colors.inactive}
                                keyboardType="number-pad"
                                value={coins}
                                onChangeText={v => setCoins(v.replace(/\D/g, ''))}
                            />
                            <Text style={styles.converterUnit}>coins</Text>
                        </View>
                        <View style={styles.converterArrow}>
                            <Feather name="arrow-right" size={20} color={colors.primarybtn} />
                        </View>
                        <View style={styles.converterResult}>
                            <Feather name="indian-rupee" size={16} color="#4ade80" />
                            <Text style={styles.converterResultText}>
                                {rupeeValue !== null ? `₹${rupeeValue}` : '₹0'}
                            </Text>
                        </View>
                    </View>
                    {coins !== '' && parseInt(coins) > COIN_BALANCE && (
                        <Text style={styles.converterWarn}>
                            <Feather name="alert-circle" size={12} color="#f87171" /> Insufficient balance
                        </Text>
                    )}
                </View>

                {/* Transaction history */}
                <Text style={styles.sectionLabel}>Transaction History</Text>
                <View style={styles.historyCard}>
                    {HISTORY.map((h, idx) => (
                        <View key={h.id} style={[styles.histRow, idx === HISTORY.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.histIcon, { backgroundColor: h.type === 'earn' ? '#0d2a1a' : '#2a0d0d' }]}>
                                <Feather
                                    name={h.type === 'earn' ? 'arrow-down-left' : 'arrow-up-right'}
                                    size={14}
                                    color={h.type === 'earn' ? '#4ade80' : '#f87171'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.histLabel}>{h.label}</Text>
                                <Text style={styles.histDate}>{h.date}</Text>
                            </View>
                            <Text style={[styles.histCoins, { color: h.type === 'earn' ? '#4ade80' : '#f87171' }]}>
                                {h.coins > 0 ? `+${h.coins}` : h.coins}
                            </Text>
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

    heroCard: {
        marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: '#1f1508',
        borderRadius: 20, padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.primarybtn + '33',
    },
    ratePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colors.primarybtn + '22',
        borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 5,
        borderWidth: 1, borderColor: colors.primarybtn + '44',
        marginBottom: spacing.md,
    },
    ratePillText: { fontFamily: fonts.subheading, fontSize: 12, color: colors.primarybtn },
    balanceLabel: { fontFamily: fonts.text, fontSize: 13, color: colors.inactive, marginBottom: 4 },
    balanceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
    balanceNum: { fontFamily: fonts.heading, fontSize: 56, color: colors.primarybtn, lineHeight: 64 },
    coinUnit: { fontFamily: fonts.text, fontSize: 16, color: colors.inactive, marginBottom: 10 },
    rupeeEquiv: { fontFamily: fonts.text, fontSize: 13, color: colors.subheading, marginBottom: spacing.lg },

    statsRow: {
        flexDirection: 'row', width: '100%',
        backgroundColor: '#111318', borderRadius: 12, overflow: 'hidden',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    statNum: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.primarybtn, marginBottom: 2 },
    statLabel: { fontFamily: fonts.text, fontSize: 11, color: colors.inactive },
    statDivider: { width: 1, backgroundColor: '#2a2a2a', marginVertical: spacing.sm },

    sectionLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },

    converterCard: {
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 14, padding: spacing.md,
    },
    converterHint: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, marginBottom: spacing.md },
    converterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    converterInput: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#111318', borderRadius: 10,
        paddingHorizontal: spacing.md, paddingVertical: 12,
        borderWidth: 1.5, borderColor: colors.primarybtn + '44',
    },
    converterField: { flex: 1, color: colors.white, fontFamily: fonts.subheading, fontSize: spacing.sxx },
    converterUnit: { fontFamily: fonts.text, fontSize: 11, color: colors.inactive },
    converterArrow: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primarybtn + '22',
        justifyContent: 'center', alignItems: 'center',
    },
    converterResult: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#0d2a1a', borderRadius: 10,
        paddingHorizontal: spacing.md, paddingVertical: 12,
        borderWidth: 1.5, borderColor: '#4ade8044',
    },
    converterResultText: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: '#4ade80' },
    converterWarn: { fontFamily: fonts.text, fontSize: 12, color: '#f87171', marginTop: spacing.sm },

    historyCard: {
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 14, overflow: 'hidden',
    },
    histRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a', gap: spacing.md,
    },
    histIcon: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    histLabel: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, marginBottom: 2 },
    histDate: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive },
    histCoins: { fontFamily: fonts.subheading, fontSize: spacing.sxx },
});
