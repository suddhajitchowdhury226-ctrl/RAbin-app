import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Replace with real API data
const TRANSACTIONS = [
    { id: 'TXN-001', title: 'Wedding Photography',   amount: '₹15,000', date: 'Apr 15, 2026', time: '10:30 AM', status: 'Success',  method: 'Razorpay', icon: 'check-circle' },
    { id: 'TXN-002', title: 'Pre-Wedding Shoot',     amount: '₹8,000',  date: 'Apr 5, 2026',  time: '2:15 PM',  status: 'Success',  method: 'UPI',      icon: 'check-circle' },
    { id: 'TXN-003', title: 'Maternity Session',     amount: '₹6,000',  date: 'Mar 20, 2026', time: '11:00 AM', status: 'Success',  method: 'Card',     icon: 'check-circle' },
    { id: 'TXN-004', title: 'Birthday Party Album',  amount: '₹5,000',  date: 'Feb 24, 2026', time: '4:00 PM',  status: 'Refunded', method: 'Razorpay', icon: 'rotate-ccw'   },
];

const statusColor = (s) => s === 'Success' ? '#4ade80' : s === 'Refunded' ? '#facc15' : '#f87171';

export default function LastPayment() {
    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader
                title="Last Payments"
                onBack={() => router.back()}
            />

            <ScreenWrapper scrollable={true} backgroundColor="#000">
                <Text style={styles.hint}>Recent transactions</Text>

                {TRANSACTIONS.map((txn, idx) => (
                    <View key={txn.id} style={styles.card}>
                        <View style={[styles.iconBox, { backgroundColor: txn.status === 'Success' ? '#0d2a1a' : '#2a1a0e' }]}>
                            <Feather name={txn.icon} size={20} color={statusColor(txn.status)} />
                        </View>

                        <View style={styles.cardBody}>
                            <Text style={styles.txnTitle}>{txn.title}</Text>
                            <Text style={styles.txnMeta}>{txn.id} · {txn.method}</Text>
                            <Text style={styles.txnDate}>{txn.date} · {txn.time}</Text>
                        </View>

                        <View style={styles.cardRight}>
                            <Text style={styles.amount}>{txn.amount}</Text>
                            <View style={[styles.badge, { borderColor: statusColor(txn.status) + '55', backgroundColor: statusColor(txn.status) + '15' }]}>
                                <Text style={[styles.badgeText, { color: statusColor(txn.status) }]}>{txn.status}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScreenWrapper>
        </>
    );
}

const styles = StyleSheet.create({
    backBtn: { padding: 4 },
    hint: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    card: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: spacing.md, marginBottom: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 14,
        padding: spacing.md, gap: spacing.md,
    },
    iconBox: {
        width: 46, height: 46, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { flex: 1 },
    txnTitle: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, marginBottom: 2 },
    txnMeta: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, marginBottom: 2 },
    txnDate: { fontFamily: fonts.text, fontSize: 11, color: colors.inactive },
    cardRight: { alignItems: 'flex-end', gap: 6 },
    amount: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white },
    badge: {
        paddingHorizontal: spacing.sm, paddingVertical: 3,
        borderRadius: 20, borderWidth: 1,
    },
    badgeText: { fontFamily: fonts.text, fontSize: 11 },
});
