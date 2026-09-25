import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import useGoogleAuth from "../../hooks/useGoogleAuth";
import { authApi } from "../../services/api";
import { Feather } from "@expo/vector-icons";
import { rf, rs, rh, rsp, SCREEN_H } from '../../constants/rs';

const H = SCREEN_H;
const PURPLE = '#7C3AED';

export default function Login() {
    const router = useRouter();
    const [showLogin, setShowLogin]   = useState(false);
    const [email, setEmail]           = useState("");
    const [isFocused, setIsFocused]   = useState(false);
    const [loading, setLoading]       = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("Send Code");

    const cardY      = useRef(new Animated.Value(H)).current;
    const fadeIn     = useRef(new Animated.Value(0)).current;
    const arrowX     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(arrowX, { toValue: 10, duration: 500, useNativeDriver: true }),
                    Animated.timing(arrowX, { toValue: 0,  duration: 500, useNativeDriver: true }),
                ])
            ).start();
        });
    }, []);

    const handleGetStarted = () => {
        setShowLogin(true);
        Animated.spring(cardY, {
            toValue: 0, friction: 9, tension: 50, useNativeDriver: true,
        }).start();
    };

    const { promptAsync: googlePrompt, loading: googleLoading } = useGoogleAuth({
        onSuccess: () => router.replace("/dashboard"),
        onError:   (msg) => Alert.alert("Google Sign-In failed", msg),
    });

    const handleSendOtp = async () => {
        const trimmed = email.trim();
        if (!trimmed.includes("@") || !trimmed.includes(".")) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }
        try {
            setLoading(true);
            try {
                await authApi.sendOtp(trimmed);
                router.push({ pathname: "/(auth)/otp", params: { email: trimmed } });
                return;
            } catch (firstErr) {
                if (
                    firstErr.message?.includes('waking up') ||
                    firstErr.message?.includes('Network request failed') ||
                    firstErr.message?.includes('timeout')
                ) {
                    setLoadingMsg("Connecting...");
                    await new Promise(r => setTimeout(r, 15000));
                    setLoadingMsg("Retrying...");
                    await authApi.sendOtp(trimmed);
                    router.push({ pathname: "/(auth)/otp", params: { email: trimmed } });
                    return;
                }
                throw firstErr;
            }
        } catch (err) {
            Alert.alert("Error", err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
            setLoadingMsg("Send Code");
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* ── FULL BACKGROUND IMAGE ── */}
            <ImageBackground
                source={require('../../assets/images/front app.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            >
                {/* Dark overlay for readability */}
                <View style={styles.overlay} />
            </ImageBackground>

            {/* ── LANDING: Logo top + Get Started bottom ── */}
            {!showLogin && (
                <Animated.View style={[styles.landingContainer, { opacity: fadeIn }]}>
                    {/* TOP: Logo + brand */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/images/logo white png.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>RABIN'S</Text>
                        <Text style={styles.brandSub}>PHOTOGRAPHY</Text>
                        <View style={styles.dividerLine} />
                        {/* <Text style={styles.brandTagline}>CAPTURING MOMENTS,{'\n'}CREATING MEMORIES</Text> */}
                    </View>

                    {/* BOTTOM: Get Started button */}
                    <View style={styles.bottomSection}>
                        <View style={styles.getStartedBorder}>
                        <TouchableOpacity
                            onPress={handleGetStarted}
                            activeOpacity={0.85}
                            style={styles.getStartedBtn}
                        >
                            <LinearGradient
                                colors={['#C2AB8A', '#D4C5A9', '#C8B89A', '#BBA882']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.getStartedGradient}
                            >
                                <Text style={styles.getStartedText}>GET STARTED</Text>
                                <Animated.View style={{ transform: [{ translateX: arrowX }] }}>
                                    <Feather name="arrow-right" size={rf(26)} color="#1A0F00" />
                                </Animated.View>
                            </LinearGradient>
                        </TouchableOpacity>
                        </View>
                        <Text style={styles.landingFooter}>
                            By continuing you agree to our{' '}
                            <Text style={styles.footerLink}>Terms &amp; Privacy Policy</Text>
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* ── LOGIN CARD slides up ── */}
            {showLogin && (
                <Animated.View style={[styles.card, { transform: [{ translateY: cardY }] }]}>
                    <View style={styles.pill} />
                    {/* Mini logo inside card */}
                    <View style={styles.cardLogoRow}>
                        <Image
                            source={require('../../assets/images/rabins-logo.png')}
                            style={styles.cardLogo}
                            resizeMode="contain"
                        />
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.cardContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.helloTitle}>Hello</Text>
                            <Text style={styles.welcomeSub}>Sign in to continue</Text>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={[styles.inputBox, isFocused && styles.inputBoxFocused]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#C4C9D4"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                    />
                                    <Feather name="mail" size={rf(18)} color="#94A3B8" />
                                </View>
                            </View>

                            {/* Send Code Button */}
                            <TouchableOpacity
                                onPress={handleSendOtp}
                                disabled={loading}
                                activeOpacity={0.85}
                                style={styles.sendBtn}
                            >
                                <LinearGradient
                                    colors={['#7C3AED', '#9333EA']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sendBtnGradient}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.sendBtnText}>{loadingMsg.toUpperCase()}</Text>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.dividerRow}>
                                <View style={styles.divLine} />
                                <Text style={styles.divText}>OR</Text>
                                <View style={styles.divLine} />
                            </View>

                            {/* Google Button */}
                            <TouchableOpacity
                                style={styles.googleBtn}
                                onPress={() => googlePrompt()}
                                disabled={googleLoading || loading}
                                activeOpacity={0.8}
                            >
                                {googleLoading
                                    ? <ActivityIndicator size="small" color={PURPLE} />
                                    : <>
                                        <Image
                                            source={require('../../assets/images/google.png')}
                                            style={styles.googleIcon}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.googleText}>Continue with Google</Text>
                                      </>
                                }
                            </TouchableOpacity>

                            <Text style={styles.footer}>
                                By continuing you agree to our{' '}
                                <Text style={styles.footerLink}>Terms &amp; Privacy Policy</Text>
                            </Text>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    // ── Landing page ──────────────────────────────────────────────────
    landingContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: H * 0.02,
        paddingBottom: rh(60),
        paddingHorizontal: rsp.lg,
    },

    logoSection: {
        alignItems: 'center',
        marginTop: H * 0.08,
    },

    ring2: {
        width: rs(150), height: rs(150), borderRadius: rs(75),
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: rsp.mx,
    },
    ring1: {
        width: rs(122), height: rs(122), borderRadius: rs(61),
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
        alignItems: 'center', justifyContent: 'center',
    },
    logoWrap: {
        width: rs(180), height: rs(180),
        marginBottom: -rsp.sxx,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: { width: rs(90), height: rs(90) },

    brandName: {
        fontSize: rf(34),
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 8,
        textAlign: 'center',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    brandSub: {
        fontSize: rf(14),
        fontWeight: '400',
        color: '#C8B89A',
        letterSpacing: 5,
        textAlign: 'center',
        marginTop: 3,
    },
    dividerLine: {
        width: rs(30),
        height: 1,
        backgroundColor: 'rgba(200,184,154,0.6)',
        marginVertical: rsp.sm,
    },
    brandTagline: {
        fontSize: rf(12),
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: rf(20),
    },

    bottomSection: {
        alignItems: 'center',
    },
    getStartedBorder: {
        width: '100%',
        borderRadius: rs(18),
        borderWidth: 2,
        borderColor: 'rgba(200,184,154,0.8)',
        marginBottom: rsp.md,
        shadowColor: '#C8B89A',
        shadowRadius: 14,
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    getStartedBtn: {
        width: '100%',
        borderRadius: rs(16),
        overflow: 'hidden',
    },
    getStartedGradient: {
        paddingVertical: rsp.mf,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: rs(12),
    },
    getStartedText: {
        color: '#1A0F00',
        fontSize: rf(22),
        fontWeight: '800',
        letterSpacing: 4,
        fontFamily: 'CormorantGaramond_600SemiBold_Italic',
    },
    landingFooter: {
        fontSize: rf(11),
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: rf(17),
    },

    card: {
        position: 'absolute',
        top: H * 0.22,
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: rs(36),
        borderTopRightRadius: rs(36),
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -6 },
        elevation: 18,
    },
    pill: {
        width: rs(44), height: rs(4), borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginTop: rsp.sm,
    },
    cardLogoRow: {
        alignItems: 'center',
        marginTop: rsp.sm,
        marginBottom: 0,
    },
    cardLogo: {
        width: rs(80), height: rs(80), borderRadius: rs(40),
    },

    cardContent: {
        paddingHorizontal: rsp.xl,
        paddingTop: rsp.sm,
        paddingBottom: rsp.xxl,
    },

    helloTitle: {
        fontSize: rf(44),
        fontWeight: '700',
        color: '#1A1040',
        textAlign: 'center',
        lineHeight: rf(50),
        marginBottom: rsp.xs,
    },
    welcomeSub: {
        fontSize: rf(15),
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: rsp.lg,
    },

    inputContainer: { marginBottom: rsp.mx },
    inputLabel: {
        fontSize: rf(12), fontWeight: '600',
        color: '#64748B', letterSpacing: 0.5,
        marginBottom: rsp.sm, marginLeft: rsp.xs,
    },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#E2E8F0',
        borderRadius: rs(14),
        paddingHorizontal: rsp.md, paddingVertical: rsp.sxx,
        backgroundColor: '#F8FAFC',
    },
    inputBoxFocused: {
        borderColor: PURPLE,
        backgroundColor: '#FAF5FF',
    },
    input: { flex: 1, fontSize: rf(15), color: '#1A1040' },
    atSign: {
        fontSize: rf(18), color: '#94A3B8',
        fontWeight: '500', marginLeft: rsp.sm,
    },

    sendBtn: {
        borderRadius: rs(14), overflow: 'hidden',
        shadowColor: PURPLE, shadowOpacity: 0.4,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    sendBtnGradient: {
        paddingVertical: rsp.md,
        alignItems: 'center', justifyContent: 'center',
    },
    sendBtnText: {
        color: '#fff', fontSize: rf(14),
        fontWeight: '800', letterSpacing: 1.8,
    },

    dividerRow: {
        flexDirection: 'row', alignItems: 'center',
        marginVertical: rsp.mf,
    },
    divLine:  { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
    divText:  { marginHorizontal: rsp.sxx, fontSize: rf(12), color: '#94A3B8', fontWeight: '600' },

    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: rs(14), borderWidth: 1.5, borderColor: '#E2E8F0',
        paddingVertical: rsp.sxx, gap: rsp.sm,
        marginBottom: rsp.lg, backgroundColor: '#fff',
    },
    googleIcon: { width: rs(20), height: rs(20) },
    googleText: { color: '#374151', fontSize: rf(14), fontWeight: '600' },

    footer: { fontSize: rf(11), color: '#94A3B8', textAlign: 'center', lineHeight: rf(17) },
    footerLink: { color: '#C8B89A', fontWeight: '700' },
});
