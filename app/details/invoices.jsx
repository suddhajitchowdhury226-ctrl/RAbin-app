import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Replace with real API data
const INVOICES = [
    { id: 'INV-2026-001', title: 'Wedding Photography',  amount: '₹15,000', date: 'Apr 15, 2026', paid: true  },
    { id: 'INV-2026-002', title: 'Pre-Wedding Shoot',    amount: '₹8,000',  date: 'Apr 5, 2026',  paid: true  },
    { id: 'INV-2026-003', title: 'Maternity Session',    amount: '₹6,000',  date: 'Mar 20, 2026', paid: true  },
    { id: 'INV-2026-004', title: 'Birthday Party Album', amount: '₹5,000',  date: 'Feb 24, 2026', paid: false },
];

export default function Invoices() {
    const handleDownload = (inv) => {
        Alert.alert('Download', `Invoice ${inv.id} download will be available soon.`);
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader
                title="Invoices"
                onBack={() => router.back()}
            />

            <ScreenWrapper scrollable={true} backgroundColor="#000">
                <Text style={styles.hint}>Tap to download</Text>

                {INVOICES.map(inv => (
                    <TouchableOpacity key={inv.id} style={styles.card} activeOpacity={0.75} onPress={() => handleDownload(inv)}>
                        <View style={[styles.iconBox, { backgroundColor: inv.paid ? '#0d2a1a' : '#2a1a0e' }]}>
                            <Feather name="file-text" size={20} color={inv.paid ? '#4ade80' : colors.primarybtn} />
                        </View>

                        <View style={styles.cardBody}>
                            <Text style={styles.invTitle}>{inv.title}</Text>
                            <Text style={styles.invId}>{inv.id}</Text>
                            <Text style={styles.invDate}>{inv.date}</Text>
                        </View>

                        <View style={styles.cardRight}>
                            <Text style={styles.amount}>{inv.amount}</Text>
                            <View style={[styles.badge, inv.paid ? styles.badgePaid : styles.badgePending]}>
                                <Text style={[styles.badgeText, inv.paid ? styles.badgeTextPaid : styles.badgeTextPending]}>
                                    {inv.paid ? 'Paid' : 'Pending'}
                                </Text>
                            </View>
                            <Feather name="download" size={16} color={colors.inactive} style={{ marginTop: 4 }} />
                        </View>
                    </TouchableOpacity>
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
    invTitle: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, marginBottom: 2 },
    invId: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, marginBottom: 2 },
    invDate: { fontFamily: fonts.text, fontSize: 11, color: colors.inactive },
    cardRight: { alignItems: 'flex-end', gap: 4 },
    amount: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white },
    badge: {
        paddingHorizontal: spacing.sm, paddingVertical: 3,
        borderRadius: 20, borderWidth: 1,
    },
    badgePaid: { backgroundColor: '#0d2a1a', borderColor: '#4ade8055' },
    badgePending: { backgroundColor: '#2a1a0e', borderColor: colors.primarybtn + '55' },
    badgeText: { fontFamily: fonts.text, fontSize: 11 },
    badgeTextPaid: { color: '#4ade80' },
    badgeTextPending: { color: colors.primarybtn },
});
