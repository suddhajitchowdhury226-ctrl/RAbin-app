import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AuthInput from "../../components/Authvalidate/AuthInput";
import { fonts } from "../../constants/fonts";
import useGoogleAuth from "../../hooks/useGoogleAuth";
import { authApi, storeToken, storeUser } from "../../services/api";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // ── Google Sign-In ────────────────────────────────────────────────
  const { promptAsync: googlePrompt, loading: googleLoading } = useGoogleAuth({
    onSuccess: () => router.replace("/dashboard"),
    onError: (msg) => Alert.alert("Google Sign-In failed", msg),
  });

  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Please enter your full name");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Please enter a valid email");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const data = await authApi.register({ name, email, password });
      await storeToken(data.accessToken);
      await storeUser(data.user);
      router.replace("/dashboard");
    } catch (err) {
      Alert.alert("Registration failed", err.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    Alert.alert("Google SignUp Clicked");
  };

  return (
    <ScreenWrapper scroll={true}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.container}>

        {/* Logo */}
        <Image
          source={require('../../assets/images/rabins-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Start your photography journey today.
        </Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <AuthInput
          icon="user"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

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
          placeholder="Create your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          toggleSecure={() => setSecure(!secure)}
        />

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F5515F', '#FF8E3C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.loginButton}
          >
          {loading ? (
            <ActivityIndicator color="#0f1b2e" />
          ) : (
            <Text style={styles.loginText}>Register</Text>
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
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={() => googlePrompt()}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="chrome" size={18} color="white" />
              <Text style={styles.socialText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom */}
        <Text style={styles.signup}>
          Already have an account?{" "}
          <Text
            style={styles.goldText}
            onPress={() => router.back()}
          >
            Login
          </Text>
        </Text>

      </ScrollView>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 28,
  },

  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 12,
  },
  googleButton: {
    borderColor: "rgba(66,133,244,0.4)",
    backgroundColor: "rgba(66,133,244,0.1)",
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

  goldText: {
    color: "#F5515F",
    fontFamily: fonts.subheading,
  },
});
