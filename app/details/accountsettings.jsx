import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { getUser, profileApi } from "@/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Fields that use inline expand
const TEXT_FIELDS = [
    { key: 'name',  label: 'Full Name',     icon: 'user',  keyboard: 'default',       secure: false },
    { key: 'email', label: 'Email Address', icon: 'mail',  keyboard: 'email-address',  secure: false },
    { key: 'phone', label: 'Phone Number',  icon: 'phone', keyboard: 'phone-pad',      secure: false },
];

const formatDOB = (date) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AccountSettings() {
    const [expanded, setExpanded]     = useState(null);
    const [saving, setSaving]         = useState(false);
    const [form, setForm]             = useState({ name: '', email: '', phone: '' });
    const [dob, setDob]               = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [tempDob, setTempDob]       = useState(new Date(2000, 0, 1));

    useEffect(() => {
        const load = async () => {
            const cached = await getUser();
            if (cached) {
                setForm(f => ({ ...f, name: cached.name || '', email: cached.email || '', phone: cached.phone || '' }));
                if (cached.dob) setDob(new Date(cached.dob));
            }
            try {
                const fresh = await profileApi.get();
                if (fresh) {
                    setForm(f => ({ ...f, name: fresh.name || f.name, email: fresh.email || f.email, phone: fresh.phone || f.phone }));
                    if (fresh.dob) setDob(new Date(fresh.dob));
                }
            } catch (_) {}
        };
        load();
    }, []);

    const toggle = (key) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => prev === key ? null : key);
    };

    const handleSave = async (key) => {
        try {
            setSaving(true);
            await profileApi.update({ name: form.name, phone: form.phone });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(null);
            Alert.alert('Saved', 'Your changes have been saved.');
        } catch (err) {
            Alert.alert('Error', err.message || 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDob = async () => {
        setDob(tempDob);
        setShowPicker(false);
        try { await profileApi.update({ name: form.name, phone: form.phone, dob: tempDob.toISOString() }); } catch (_) {}
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader title="Account Settings" onBack={() => router.back()} />

            <ScreenWrapper scrollable={true} backgroundColor="#000">
                <Text style={styles.sectionHint}>Tap any field to edit</Text>

                <View style={styles.card}>
                    {/* Inline text fields */}
                    {TEXT_FIELDS.map((field) => (
                        <View key={field.key}>
                            <TouchableOpacity style={styles.row} onPress={() => toggle(field.key)} activeOpacity={0.7}>
                                <View style={styles.rowLeft}>
                                    <View style={styles.iconBox}>
                                        <Feather name={field.icon} size={18} color={colors.primarybtn} />
                                    </View>
                                    <View>
                                        <Text style={styles.rowLabel}>{field.label}</Text>
                                        <Text style={styles.rowValue} numberOfLines={1}>{form[field.key] || '—'}</Text>
                                    </View>
                                </View>
                                <Feather name={expanded === field.key ? 'chevron-down' : 'chevron-right'} size={18} color={colors.inactive} />
                            </TouchableOpacity>

                            {expanded === field.key && (
                                <View style={styles.editBox}>
                                    <TextInput
                                        style={styles.input}
                                        value={form[field.key]}
                                        onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                        placeholderTextColor={colors.inactive}
                                        keyboardType={field.keyboard}
                                        autoCapitalize="none"
                                        autoFocus
                                    />
                                    <View style={styles.btnRow}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(null); }}>
                                            <Text style={styles.cancelTxt}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(field.key)} disabled={saving}>
                                            {saving ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.saveTxt}>Save</Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Date of Birth */}
                    <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => { setTempDob(dob || new Date(2000, 0, 1)); setShowPicker(true); }} activeOpacity={0.7}>
                        <View style={styles.rowLeft}>
                            <View style={styles.iconBox}>
                                <Feather name="gift" size={18} color={colors.primarybtn} />
                            </View>
                            <View>
                                <Text style={styles.rowLabel}>Date of Birth</Text>
                                <Text style={styles.rowValue}>{formatDOB(dob)}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={18} color={colors.inactive} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScreenWrapper>

            {/* DOB Picker Modal */}
            <Modal visible={showPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconBox}>
                                <Feather name="gift" size={20} color={colors.primarybtn} />
                            </View>
                            <Text style={[styles.modalTitle, { flex: 1 }]}>Date of Birth</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.closeBtn}>
                                <Feather name="x" size={20} color={colors.inactive} />
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={tempDob}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(_, selected) => { if (selected) setTempDob(selected); }}
                            themeVariant="dark"
                            style={{ width: '100%' }}
                        />
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPicker(false)}>
                                <Text style={styles.cancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDob}>
                                <Text style={styles.saveTxt}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        display: 'none', // replaced by AppHeader component
    },
    backBtn: { padding: 4 },
    headerTitle: { display: 'none' },
    sectionHint: {
        fontFamily: fonts.text, fontSize: 12, color: colors.inactive,
        marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    card: {
        marginHorizontal: spacing.md, backgroundColor: '#1E2128',
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
    rowLabel: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, marginBottom: 2 },
    rowValue: { fontFamily: fonts.subheading, fontSize: spacing.sxx, color: colors.white, maxWidth: 220 },
    editBox: {
        backgroundColor: '#111318', paddingHorizontal: spacing.md,
        paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    input: {
        backgroundColor: '#1a1a1a', borderRadius: 10,
        paddingHorizontal: spacing.md, paddingVertical: 14,
        color: colors.white, fontFamily: fonts.text, fontSize: spacing.sxx,
        borderWidth: 1.5, borderColor: '#333', marginBottom: spacing.md,
    },
    btnRow: { flexDirection: 'row', gap: spacing.sm },
    cancelBtn: {
        flex: 1, backgroundColor: '#2a2a2a', borderRadius: 10,
        paddingVertical: 12, alignItems: 'center',
    },
    cancelTxt: { color: colors.white, fontFamily: fonts.subheading, fontSize: spacing.sxx },
    saveBtn: {
        flex: 1, backgroundColor: colors.primarybtn, borderRadius: 10,
        paddingVertical: 12, alignItems: 'center',
    },
    saveTxt: { color: '#000', fontFamily: fonts.subheading, fontSize: spacing.sxx },

    // Modal shared
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', paddingHorizontal: spacing.md,
    },
    modalSheet: {
        backgroundColor: '#1E2128', borderRadius: 20,
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: spacing.md, marginBottom: spacing.md,
    },
    modalIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: colors.primarybtn + '22',
        borderWidth: 1, borderColor: colors.primarybtn + '44',
        justifyContent: 'center', alignItems: 'center',
    },
    modalTitle: { fontFamily: fonts.heading, fontSize: spacing.mx, color: colors.white },
    modalSubtitle: { fontFamily: fonts.text, fontSize: 12, color: colors.inactive, marginTop: 2 },
    closeBtn: { padding: 4 },
});
