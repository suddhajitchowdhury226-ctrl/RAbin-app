import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authApi, storeToken, storeUser, storeRefreshToken, storeLoginTime } from "../../services/api";
import { rf, rs, rh, rsp, SCREEN_H } from '../../constants/rs';
import { Feather } from "@expo/vector-icons";

const H = SCREEN_H;
const OTP_LENGTH   = 4;
const PURPLE       = '#7C3AED';
const PURPLE_DARK  = '#4C1D95';
const PURPLE_LIGHT = '#A78BFA';
const BG           = '#0D0614';
const CARD_TOP     = H * 0.42;

export default function OtpScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();

    const [otp, setOtp]                 = useState(["", "", "", ""]);
    const [loading, setLoading]         = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [resending, setResending]     = useState(false);
    const inputs = useRef([]);

    const cardY      = useRef(new Animated.Value(H)).current;
    const topOpacity = useRef(new Animated.Value(0)).current;
    const glowPulse  = useRef(new Animated.Value(0.4)).current;
    const shakeX     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, { toValue: 0.75, duration: 2200, useNativeDriver: true }),
                Animated.timing(glowPulse, { toValue: 0.4,  duration: 2200, useNativeDriver: true }),
            ])
        ).start();

        Animated.timing(topOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        Animated.spring(cardY, {
            toValue: 0, friction: 9, tension: 50, delay: 200, useNativeDriver: true,
        }).start();
    }, []);

    // Countdown
    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    // Auto-submit
    useEffect(() => {
        const code = otp.join("");
        if (code.length === OTP_LENGTH && !otp.includes("")) {
            Keyboard.dismiss();
            handleVerify(code);
        }
    }, [otp]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeX, { toValue: -12, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 12,  duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -8,  duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 8,   duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0,   duration: 55, useNativeDriver: true }),
        ]).start();
    };

    const handleChange = (text, index) => {
        if (text.length === OTP_LENGTH) {
            const digits = text.replace(/\D/g, "").split("").slice(0, OTP_LENGTH);
            if (digits.length === OTP_LENGTH) {
                setOtp(digits);
                inputs.current[OTP_LENGTH - 1]?.focus();
                return;
            }
        }
        const digit = text.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (digit && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (code) => {
        const finalCode = code ?? otp.join("");
        if (finalCode.length < OTP_LENGTH) return;
        try {
            setLoading(true);
            const data = await authApi.verifyOtp(email, finalCode);
            // Always store the access token
            await storeToken(data.accessToken);
            // refreshToken is only present after server is updated — guard it
            if (data.refreshToken) await storeRefreshToken(data.refreshToken);
            if (data.user)         await storeUser(data.user);
            await storeLoginTime();
            router.replace("/dashboard");
        } catch (err) {
            shake();
            Alert.alert("Wrong code", err.message || "Please check the code and try again.");
            setOtp(["", "", "", ""]);
            setTimeout(() => inputs.current[0]?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setResending(true);
            await authApi.sendOtp(email);
            setOtp(["", "", "", ""]);
            setResendTimer(30);
            setTimeout(() => inputs.current[0]?.focus(), 100);
        } catch (err) {
            Alert.alert("Error", err.message || "Failed to resend.");
        } finally {
            setResending(false);
        }
    };

    const filled    = otp.filter(Boolean).length;
    const allFilled = filled === OTP_LENGTH;

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* ── PURPLE BACKGROUND ── */}
            <LinearGradient
                colors={[BG, PURPLE_DARK, PURPLE]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.orbTL, { opacity: glowPulse }]} />
            <Animated.View style={[styles.orbBR, { opacity: glowPulse }]} />

            {/* ── TOP: Mail icon + rings ── */}
            <Animated.View style={[styles.topSection, { opacity: topOpacity }]}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backArrow}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                {/* Mail icon in concentric rings */}
                <View style={styles.ring2}>
                    <View style={styles.ring1}>
                        <LinearGradient
                            colors={['rgba(124,58,237,0.6)', 'rgba(168,85,247,0.4)']}
                            style={styles.iconWrap}
                        >
                            <Feather name="mail" size={rf(38)} color="#fff" />
                        </LinearGradient>
                    </View>
                </View>

                <Text style={styles.topTitle}>Check your inbox</Text>
                <Text style={styles.topSub}>
                    We sent a 4-digit code to{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
            </Animated.View>

            {/* ── WHITE CARD ── */}
            <Animated.View style={[styles.card, { transform: [{ translateY: cardY }] }]}>
                <View style={styles.pill} />

                <ScrollView
                    contentContainerStyle={styles.cardContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.cardTitle}>Enter Code</Text>
                    <Text style={styles.cardSub}>Type the 4-digit code below</Text>

                    {/* OTP boxes */}
                    <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeX }] }]}>
                        {otp.map((digit, i) => (
                            <View key={i} style={[
                                styles.otpBox,
                                digit   && styles.otpBoxFilled,
                                loading && styles.otpBoxDisabled,
                            ]}>
                                <TextInput
                                    ref={r => (inputs.current[i] = r)}
                                    style={styles.otpInput}
                                    value={digit}
                                    onChangeText={t => handleChange(t, i)}
                                    onKeyPress={e => handleKeyPress(e, i)}
                                    keyboardType="number-pad"
                                    maxLength={OTP_LENGTH}
                                    textAlign="center"
                                    selectionColor={PURPLE}
                                    autoFocus={i === 0}
                                    editable={!loading}
                                    caretHidden
                                />
                            </View>
                        ))}
                    </Animated.View>

                    {/* Progress */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${(filled / OTP_LENGTH) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{filled} of {OTP_LENGTH} digits entered</Text>

                    {/* Verify button */}
                    <TouchableOpacity
                        onPress={() => handleVerify()}
                        disabled={loading || !allFilled}
                        activeOpacity={0.85}
                        style={styles.verifyBtn}
                    >
                        <LinearGradient
                            colors={allFilled ? [PURPLE, '#9333EA'] : ['#E5E7EB', '#E5E7EB']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.verifyBtnGradient}
                        >
                            {loading
                                ? <ActivityIndicator color={allFilled ? '#fff' : '#9CA3AF'} />
                                : <Text style={[styles.verifyBtnText, !allFilled && styles.verifyBtnTextDim]}>
                                    Verify &amp; Continue  →
                                  </Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={styles.resendRow}>
                        <Text style={styles.resendLabel}>Didn't receive it?  </Text>
                        {resendTimer > 0 ? (
                            <View style={styles.timerPill}>
                                <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                {resending
                                    ? <ActivityIndicator size="small" color={PURPLE} />
                                    : <Text style={styles.resendLink}>Resend code</Text>
                                }
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    orbTL: {
        position: 'absolute', top: -80, left: -80,
        width: rs(260), height: rs(260), borderRadius: rs(130),
        backgroundColor: 'rgba(124,58,237,0.45)',
    },
    orbBR: {
        position: 'absolute', top: H * 0.15, right: -60,
        width: rs(160), height: rs(160), borderRadius: rs(80),
        backgroundColor: 'rgba(168,85,247,0.28)',
    },

    topSection: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: CARD_TOP,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: H * 0.07,
    },

    backBtn: {
        position: 'absolute',
        top: rsp.sxx, left: rsp.mx,
        flexDirection: 'row', alignItems: 'center', gap: rsp.xs,
        paddingVertical: rsp.sm, paddingHorizontal: rsp.xs,
    },
    backArrow: { color: 'rgba(255,255,255,0.7)', fontSize: rf(24), lineHeight: rf(26) },
    backText:  { color: 'rgba(255,255,255,0.5)', fontSize: rf(15) },

    ring2: {
        width: rs(140), height: rs(140), borderRadius: rs(70),
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: rsp.md,
    },
    ring1: {
        width: rs(116), height: rs(116), borderRadius: rs(58),
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.38)',
        alignItems: 'center', justifyContent: 'center',
    },
    iconWrap: {
        width: rs(96), height: rs(96), borderRadius: rs(48),
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    },

    envelope: { width: rs(40), height: rs(30), alignItems: 'center', justifyContent: 'center' },
    envBody: {
        width: rs(40), height: rs(28),
        borderWidth: 2.5, borderColor: '#fff',
        borderRadius: 4,
        position: 'absolute',
    },
    envFlapLeft: {
        width: rs(22), height: rs(22),
        borderTopWidth: 2.5, borderRightWidth: 2.5,
        borderColor: '#fff',
        transform: [{ rotate: '-45deg' }],
        position: 'absolute',
        top: -1, left: -1,
        backgroundColor: 'transparent',
    },
    envFlapRight: {
        width: rs(22), height: rs(22),
        borderTopWidth: 2.5, borderLeftWidth: 2.5,
        borderColor: '#fff',
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
        top: -1, right: -1,
        backgroundColor: 'transparent',
    },

    topTitle: {
        fontSize: rf(20), fontWeight: '700', color: '#fff',
        letterSpacing: 0.3, marginBottom: rsp.sx,
    },
    topSub: {
        fontSize: rf(13), color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', lineHeight: rf(20),
    },
    emailHighlight: { color: PURPLE_LIGHT, fontWeight: '600' },

    card: {
        position: 'absolute',
        top: CARD_TOP - rsp.xxl,
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: rs(36),
        borderTopRightRadius: rs(36),
        shadowColor: '#000',
        shadowOpacity: 0.14, shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 14,
    },
    pill: {
        width: rs(44), height: rs(4), borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center', marginTop: rsp.sx,
    },

    cardContent: {
        paddingHorizontal: rsp.xl,
        paddingTop: rsp.mx,
        paddingBottom: rsp.xxl,
        alignItems: 'center',
    },

    cardTitle: {
        fontSize: rf(26),
        fontWeight: '700',
        color: '#1A1040',
        marginBottom: rsp.xs,
    },
    cardSub: {
        fontSize: rf(13), color: '#94A3B8',
        marginBottom: rsp.xl,
    },

    otpRow: {
        flexDirection: 'row', gap: rsp.sx,
        marginBottom: rsp.mx,
    },
    otpBox: {
        width: rs(64), height: rh(68),
        borderRadius: rs(16),
        borderWidth: 1.5, borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        alignItems: 'center', justifyContent: 'center',
    },
    otpBoxFilled: {
        borderColor: PURPLE,
        backgroundColor: '#FAF5FF',
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    otpBoxDisabled: { opacity: 0.5 },
    otpInput: {
        width: '100%', height: '100%',
        fontSize: rf(26), fontWeight: '700',
        color: '#1A1040', textAlign: 'center',
    },

    progressTrack: {
        width: '100%', height: 3,
        backgroundColor: '#F1F5F9',
        borderRadius: 2, marginBottom: rsp.sm, overflow: 'hidden',
    },
    progressFill: {
        height: '100%', backgroundColor: PURPLE, borderRadius: 2,
    },
    progressText: {
        fontSize: rf(11), color: '#94A3B8',
        marginBottom: rsp.xl, letterSpacing: 0.3,
    },

    verifyBtn: {
        width: '100%', borderRadius: rs(14),
        overflow: 'hidden',
        shadowColor: PURPLE, shadowOpacity: 0.35,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        marginBottom: rsp.xs,
    },
    verifyBtnGradient: {
        paddingVertical: rsp.md,
        alignItems: 'center', justifyContent: 'center',
    },
    verifyBtnText: {
        color: '#fff', fontSize: rf(15),
        fontWeight: '800', letterSpacing: 0.8,
    },
    verifyBtnTextDim: { color: '#9CA3AF' },

    resendRow: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: rsp.lg,
    },
    resendLabel: { fontSize: rf(13), color: '#94A3B8' },
    timerPill: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: rsp.sm, paddingVertical: rsp.xs,
        borderRadius: rs(20),
    },
    timerText: { fontSize: rf(12), color: '#9CA3AF' },
    resendLink: { fontSize: rf(13), color: PURPLE, fontWeight: '700' },
});
