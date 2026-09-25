import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Alert, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";

const STORAGE_KEY = "payment_methods";

const TYPES = [
    { key: 'card', label: 'Debit / Credit Card', icon: 'credit-card' },
    { key: 'upi',  label: 'UPI',                 icon: 'smartphone'  },
];

export default function AddPayment() {
    const [type, setType] = useState('card');

    // Card fields
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry]         = useState('');
    const [cvv, setCvv]               = useState('');
    const [cardBrand, setCardBrand]   = useState('Visa');

    // UPI fields
    const [upiId, setUpiId]     = useState('');
    const [upiName, setUpiName] = useState('');

    const [saving, setSaving] = useState(false);

    // Format card number with spaces every 4 digits
    const formatCard = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    // Format expiry MM/YY
    const formatExpiry = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const validate = () => {
        if (type === 'card') {
            if (!cardHolder.trim()) { Alert.alert('Enter card holder name'); return false; }
            if (cardNumber.replace(/\s/g, '').length < 16) { Alert.alert('Enter valid 16-digit card number'); return false; }
            if (expiry.length < 5) { Alert.alert('Enter valid expiry (MM/YY)'); return false; }
            if (cvv.length < 3) { Alert.alert('Enter valid CVV'); return false; }
        } else {
            if (!upiId.includes('@')) { Alert.alert('Enter valid UPI ID (e.g. name@bank)'); return false; }
            if (!upiName.trim()) { Alert.alert('Enter UPI app name'); return false; }
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const existing = stored ? JSON.parse(stored) : [];

            const newMethod = type === 'card'
                ? {
                    id: Date.now().toString(),
                    type: 'card',
                    label: cardBrand,
                    detail: `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}`,
                    sub: `Expires ${expiry}`,
                    icon: 'credit-card',
                    default: existing.length === 0,
                  }
                : {
                    id: Date.now().toString(),
                    type: 'upi',
                    label: upiName,
                    detail: upiId,
                    sub: 'UPI Connected',
                    icon: 'smartphone',
                    default: existing.length === 0,
                  };

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newMethod]));
            router.back();
        } catch (err) {
            Alert.alert('Error', 'Could not save payment method.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader
                title="Add Payment Method"
                onBack={() => router.back()}
            />

            <ScreenWrapper scrollable={true} backgroundColor="#000">

                {/* Type selector */}
                <Text style={styles.sectionLabel}>Select Type</Text>
                <View style={styles.typeRow}>
                    {TYPES.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                            onPress={() => setType(t.key)}
                            activeOpacity={0.8}
                        >
                            <Feather name={t.icon} size={18} color={type === t.key ? '#000' : colors.inactive} />
                            <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Card form */}
                {type === 'card' && (
                    <View style={styles.formCard}>
                        {/* Brand selector */}
                        <Text style={styles.fieldLabel}>Card Brand</Text>
                        <View style={styles.brandRow}>
                            {['Visa', 'Mastercard', 'Rupay'].map(b => (
                                <TouchableOpacity
                                    key={b}
                                    style={[styles.brandBtn, cardBrand === b && styles.brandBtnActive]}
                                    onPress={() => setCardBrand(b)}
                                >
                                    <Text style={[styles.brandText, cardBrand === b && styles.brandTextActive]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Card Holder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full name on card"
                            placeholderTextColor={colors.inactive}
                            value={cardHolder}
                            onChangeText={setCardHolder}
                            autoCapitalize="words"
                        />

                        <Text style={styles.fieldLabel}>Card Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1234 5678 9012 3456"
                            placeholderTextColor={colors.inactive}
                            value={cardNumber}
                            onChangeText={v => setCardNumber(formatCard(v))}
                            keyboardType="number-pad"
                            maxLength={19}
                        />

                        <View style={styles.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>Expiry</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="MM/YY"
                                    placeholderTextColor={colors.inactive}
                                    value={expiry}
                                    onChangeText={v => setExpiry(formatExpiry(v))}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>CVV</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="•••"
                                    placeholderTextColor={colors.inactive}
                                    value={cvv}
                                    onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    maxLength={4}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* UPI form */}
                {type === 'upi' && (
                    <View style={styles.formCard}>
                        <Text style={styles.fieldLabel}>UPI App Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Google Pay, PhonePe, Paytm"
                            placeholderTextColor={colors.inactive}
                            value={upiName}
                            onChangeText={setUpiName}
                        />

                        <Text style={styles.fieldLabel}>UPI ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="yourname@bank"
                            placeholderTextColor={colors.inactive}
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Payment Method'}</Text>
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
    typeRow: {
        flexDirection: 'row', gap: spacing.md,
        marginHorizontal: spacing.md,
    },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, paddingVertical: spacing.md,
        backgroundColor: '#1E2128', borderRadius: 12,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    typeBtnActive: {
        backgroundColor: colors.primarybtn,
        borderColor: colors.primarybtn,
    },
    typeBtnText: { fontFamily: fonts.subheading, fontSize: 13, color: colors.inactive },
    typeBtnTextActive: { color: '#000' },

    formCard: {
        marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: '#1E2128', borderRadius: 14,
        padding: spacing.md,
    },
    fieldLabel: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginBottom: spacing.sm, marginTop: spacing.md,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#111318', borderRadius: 10,
        paddingHorizontal: spacing.md, paddingVertical: 14,
        color: colors.white, fontFamily: fonts.text,
        fontSize: spacing.sxx, borderWidth: 1.5, borderColor: '#2a2a2a',
    },
    row2: { flexDirection: 'row', gap: spacing.md },
    brandRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    brandBtn: {
        paddingHorizontal: spacing.md, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#2a2a2a',
        backgroundColor: '#111318',
    },
    brandBtnActive: { backgroundColor: colors.primarybtn + '22', borderColor: colors.primarybtn },
    brandText: { fontFamily: fonts.text, fontSize: 13, color: colors.inactive },
    brandTextActive: { color: colors.primarybtn },

    saveBtn: {
        marginHorizontal: spacing.md, marginTop: spacing.lg,
        backgroundColor: colors.primarybtn, borderRadius: 14,
        paddingVertical: spacing.md, alignItems: 'center',
    },
    saveBtnText: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: '#000' },
});
