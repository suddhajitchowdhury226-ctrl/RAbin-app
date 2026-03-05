import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import AuthInput from "../../components/Authvalidate/AuthInput";
import { fonts } from "../../constants/fonts";
import { authApi, storeToken, storeUser } from "../../services/api";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secure, setSecure] = useState(true);
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!email.includes("@")) {
            Alert.alert("Please enter valid email");
            return false;
        }
        if (password.length < 6) {
            Alert.alert("Password must be at least 6 characters");
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            const data = await authApi.login({ email, password });
            await storeToken(data.accessToken);
            await storeUser(data.user);
            router.replace("/");
        } catch (err) {
            Alert.alert("Login failed", err.message || "Please check your credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper scroll={true}>

            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.container}>
                {/* Logo */}
                <View style={styles.logoBox}>
                    <Feather name="camera" size={30} color="black" />
                </View>

                {/* Title */}
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                    Log in to your account to continue your photography journey.
                </Text>

                {/* Email */}
                <Text style={styles.label}>Email Address</Text>
                <AuthInput
                    icon="mail"
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                />

                {/* Password */}
                <Text style={styles.label}>Password</Text>
                <AuthInput
                    icon="lock"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secure}
                    toggleSecure={() => setSecure(!secure)}
                />

                <TouchableOpacity style={styles.forgot}>
                    <Text style={styles.goldText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity onPress={handleLogin}>
                    <LinearGradient
                        colors={['#F5515F', '#FF8E3C']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.loginButton}
                    >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={styles.loginText}>Login</Text>
                    )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.or}>or</Text>
                    <View style={styles.line} />
                </View>

                {/* Google */}
                <TouchableOpacity style={styles.socialButton}>
                    <Feather name="chrome" size={18} color="white" />
                    <Text style={styles.socialText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Facebook */}
                <TouchableOpacity style={styles.socialButton}>
                    <Feather name="facebook" size={18} color="white" />
                    <Text style={styles.socialText}>Continue with Facebook</Text>
                </TouchableOpacity>

                <Text style={styles.signup}>
                    Don't have an account?{" "}
                    <Text style={styles.goldText} onPress={() => router.push("/register")}>
                        Sign Up
                    </Text>
                </Text>
            </ScrollView>

        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#0f1b2e",
    },
    container: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 28,
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 24,
    },
    title: {
        fontFamily: fonts.heading,
        fontSize: 28,
        color: "white",
        textAlign: "center",
    },
    subtitle: {
        fontFamily: fonts.body,
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
    },
    label: {
        fontFamily: fonts.subheading,
        fontSize: 14,
        color: "white",
        marginBottom: 8,
        marginTop: 16,
    },
    forgot: {
        alignSelf: "flex-end",
        marginTop: 8,
    },
    goldText: {
        color: "#F5515F",
        fontFamily: fonts.subheading,
    },
    loginButton: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16,
    },
    loginText: {
        fontFamily: fonts.subheading,
        fontSize: 16,
        color: "#0f1b2e",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 22,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    or: {
        marginHorizontal: 10,
        color: "rgba(255,255,255,0.8)",
        fontFamily: fonts.body,
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        marginTop: 12,
    },
    socialText: {
        color: "white",
        fontFamily: fonts.subheading,
        fontSize: 15,
        marginLeft: 8,
    },
    signup: {
        marginTop: 24,
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        fontFamily: fonts.body,
    },
});
