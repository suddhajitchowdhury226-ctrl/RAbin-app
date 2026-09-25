import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STORAGE_KEY = "payment_methods";

const DEFAULT_METHODS = [
    { id: '1', type: 'card', label: 'Visa',       detail: '•••• •••• •••• 1234', sub: 'Expires 12/26', icon: 'credit-card', default: true  },
    { id: '2', type: 'card', label: 'Mastercard', detail: '•••• •••• •••• 5678', sub: 'Expires 08/27', icon: 'credit-card', default: false },
    { id: '3', type: 'upi',  label: 'Google Pay', detail: 'user@okicici',         sub: 'UPI Connected', icon: 'smartphone',  default: false },
    { id: '4', type: 'upi',  label: 'PhonePe',    detail: 'user@ybl',             sub: 'UPI Connected', icon: 'smartphone',  default: false },
];

export default function PaymentMethod() {
    const [methods, setMethods] = useState([]);

    // Reload every time screen is focused (after adding a new method)
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setMethods(JSON.parse(stored));
                } else {
                    // First time — seed with defaults
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_METHODS));
                    setMethods(DEFAULT_METHODS);
                }
            };
            load();
        }, [])
    );

    const save = async (updated) => {
        setMethods(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const setDefault = async (id) => {
        const updated = methods.map(m => ({ ...m, default: m.id === id }));
        await save(updated);
    };

    const handleRemove = (id) => {
        Alert.alert('Remove', 'Remove this payment method?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => {
                const updated = methods.filter(m => m.id !== id);
                await save(updated);
            }},
        ]);
    };

    const cards = methods.filter(m => m.type === 'card');
    const upis  = methods.filter(m => m.type === 'upi');

    const MethodRow = ({ m, isLast }) => (
        <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                    <Feather name={m.icon} size={18} color={colors.primarybtn} />
                </View>
                <View>
                    <View style={styles.labelRow}>
                        <Text style={styles.methodLabel}>{m.label}  {m.detail}</Text>
                        {m.default && (
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>Default</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                {!m.default && (
                    <TouchableOpacity onPress={() => setDefault(m.id)} style={styles.actionBtn}>
                        <Feather name="star" size={16} color={colors.inactive} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleRemove(m.id)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={16} color="#f87171" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader
                title="Payment Method"
                onBack={() => router.back()}
            />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {cards.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Saved Cards</Text>
                        <View style={styles.card}>
                            {cards.map((m, idx) => <MethodRow key={m.id} m={m} isLast={idx === cards.length - 1} />)}
                        </View>
                    </>
                )}

                {upis.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>UPI</Text>
                        <View style={styles.card}>
                            {upis.map((m, idx) => <MethodRow key={m.id} m={m} isLast={idx === upis.length - 1} />)}
                        </View>
                    </>
                )}

                {methods.length === 0 && (
                    <Text style={styles.emptyText}>No payment methods saved yet.</Text>
                )}

                <TouchableOpacity
                    style={styles.addBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push('/details/addpayment')}
                >
                    <Feather name="plus" size={18} color={colors.primarybtn} />
                    <Text style={styles.addBtnText}>Add Payment Method</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScreenWrapper>
        </>
    );
}

const styles = StyleSheet.create({
    backBtn: { padding: 4 },
    sectionLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    emptyText: {
        fontFamily: fonts.text, fontSize: spacing.sxx, color: colors.inactive,
        textAlign: 'center', marginTop: spacing.xl,
    },
    card: {
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        borderRadius: 14, overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    iconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center',
    },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
    methodLabel: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white },
    methodSub: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive },
    defaultBadge: {
        backgroundColor: colors.primarybtn + '22', borderRadius: 20,
        paddingHorizontal: 6, paddingVertical: 2,
        borderWidth: 1, borderColor: colors.primarybtn + '55',
    },
    defaultText: { fontFamily: fonts.text, fontSize: 10, color: colors.primarybtn },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: { padding: 6 },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: '#1E2128', borderRadius: 14,
        paddingVertical: spacing.md,
        borderWidth: 1, borderColor: colors.primarybtn + '44',
        borderStyle: 'dashed',
    },
    addBtnText: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.primarybtn },
});
