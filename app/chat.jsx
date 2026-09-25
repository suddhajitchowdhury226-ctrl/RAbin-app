import Footer from "../components/Footer/FooterScreen";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { rf, rs, rh, rsp } from "../constants/rs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Gemini Config ─────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";

// ── Fetch live data for context ───────────────────────────────────────────────
async function fetchContextData() {
  try {
    const [servicesRes, addonsRes, customRes] = await Promise.allSettled([
      fetch(`${API_BASE}/services`),
      fetch(`${API_BASE}/pricing/addons`),
      fetch(`${API_BASE}/pricing/custom-services`),
    ]);

    let servicesText = "";
    let addonsText = "";
    let customText = "";

    if (servicesRes.status === "fulfilled" && servicesRes.value.ok) {
      const d = await servicesRes.value.json();
      const list = Array.isArray(d.data) ? d.data : [];
      if (list.length > 0) {
        servicesText =
          "AVAILABLE SERVICES:\n" +
          list
            .map(
              (s) =>
                `- ${s.title}${s.description ? ": " + s.description.slice(0, 80) : ""}`,
            )
            .join("\n");
      }
    }

    if (addonsRes.status === "fulfilled" && addonsRes.value.ok) {
      const d = await addonsRes.value.json();
      const list = Array.isArray(d.data) ? d.data : [];
      if (list.length > 0) {
        addonsText =
          "AVAILABLE ADD-ONS:\n" +
          list
            .map(
              (a) => `- ${a.name}: ₹${Number(a.price).toLocaleString("en-IN")}`,
            )
            .join("\n");
      }
    }

    if (customRes.status === "fulfilled" && customRes.value.ok) {
      const d = await customRes.value.json();
      const list = Array.isArray(d.data) ? d.data : [];
      if (list.length > 0) {
        customText =
          "CUSTOM BOOKING SERVICES:\n" +
          list
            .map(
              (s) => `- ${s.name}: ₹${Number(s.price).toLocaleString("en-IN")}`,
            )
            .join("\n");
      }
    }

    return [servicesText, addonsText, customText].filter(Boolean).join("\n\n");
  } catch {
    return "";
  }
}

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(liveData) {
  return `You are the official AI customer support assistant for Rabin's Photography Studio mobile app.

Your role is to help customers with everything related to the app and photography services:

CORE TOPICS YOU HANDLE:
- Photography services, packages, and pricing
- How to book a session (tap a service → choose package → pick date/time → proceed to payment)
- Booking status: after payment it shows as "Payment Done", admin will then approve or reject it
- Order tracking for photo albums and prints
- Payment methods: Razorpay, UPI, Credit/Debit cards
- Coupons and discounts: apply coupon codes at checkout
- Account management: name, phone, password, profile photo
- Referral program: refer friends, earn coins (1 coin = ₹1 discount)
- Notifications and app settings
- Cancellation: only PENDING bookings can be cancelled before payment
- Chat support: this very chat they are using now

${
  liveData
    ? `LIVE DATA FROM THE APP:\n${liveData}`
    : `DEFAULT PRICING (approximate):\n- Wedding Photography: ₹15,000\n- Pre-Wedding Shoot: ₹8,000\n- Maternity Session: ₹6,000\n- Family Portraits: ₹4,999\n- Corporate Events: ₹10,000\n- Birthday Party: ₹5,000\n- Drone Photography: ₹3,000\n- Cinematic Videography: ₹12,000`
}

BOOKING FLOW:
1. Browse services on the Home screen
2. Tap a service to see packages (Bronze/Silver/Gold tiers)
3. Select a package → Book Service → choose date, time, venue
4. Add optional add-ons → proceed to payment (Razorpay)
5. After payment, booking appears in "My Bookings" tab with "Awaiting Approval" status
6. Admin reviews and approves or rejects the booking
7. You will see the updated status in My Bookings

IMPORTANT RULES:
- Always be warm, helpful, and professional
- Keep answers concise — 2-4 sentences max unless detail is requested
- Use plain text only — no markdown like ** or ## or bullet symbols with *
- If you don't know something specific, say "Please contact us directly at support for this"
- Do not discuss topics unrelated to photography, the app, or customer service
- Never make up prices — if unsure, direct them to browse the app`;
}

// ── Call Gemini API ───────────────────────────────────────────────────────────
async function askGemini(userMessage, history, systemPrompt, retries = 3) {
  if (!GEMINI_API_KEY) {
    return "AI assistant is not configured. Please contact support.";
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Hi! I'm Rabin's Photography assistant. I'm here to help with services, bookings, pricing, and anything else about the app. What can I do for you?",
        },
      ],
    },
    // Last 10 messages for context
    ...history.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.65,
            topP: 0.9,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH",
            },
          ],
        }),
      });

      if (res.status === 429) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 2500));
          continue;
        }
        return "I'm a bit busy right now. Please wait a moment and try again.";
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("Gemini error:", res.status, JSON.stringify(errData));
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        return "Something went wrong on my end. Please try again shortly.";
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || "I didn't catch that. Could you rephrase your question?";
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      return "I'm having trouble connecting. Please check your internet and try again.";
    }
  }
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_CHIPS = [
  "What services do you offer?",
  "How do I book a session?",
  "What are your prices?",
  "How does booking approval work?",
  "Available add-ons?",
  "How to apply a coupon?",
  "Track my order",
  "Referral program",
  "How to cancel a booking?",
  "Payment methods",
];

// ── Typing dots animation ─────────────────────────────────────────────────────
function TypingDots() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot((d) => (d + 1) % 3), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.typingBubble}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.typingDot, { opacity: dot === i ? 1 : 0.25 }]}
        />
      ))}
    </View>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ item }) {
  const isUser = item.sender === "user";

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Feather name="camera" size={rf(13)} color={colors.primarybtn} />
      </View>
      <View style={styles.botBubble}>
        <Text style={styles.botText}>{item.text}</Text>
        <Text style={styles.timeTextBot}>{item.time}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hi! I'm Rabin's Photography assistant. Ask me anything about our services, packages, pricing, bookings, or your account. I'm here to help!",
      sender: "bot",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(buildSystemPrompt(""));
  const [contextLoaded, setContextLoaded] = useState(false);

  // Load live data once on mount
  useEffect(() => {
    fetchContextData().then((liveData) => {
      setSystemPrompt(buildSystemPrompt(liveData));
      setContextLoaded(true);
    });
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const t = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [messages, typing]);

  const now = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const sendMessage = useCallback(
    async (quickText) => {
      const msg = (quickText || input).trim();
      if (!msg || typing) return;
      setInput("");

      const userMsg = {
        id: `u_${Date.now()}`,
        text: msg,
        sender: "user",
        time: now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      const currentHistory = messages; // capture before state update
      const reply = await askGemini(msg, currentHistory, systemPrompt);
      setTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          text: reply,
          sender: "bot",
          time: now(),
        },
      ]);
    },
    [input, typing, messages, systemPrompt],
  );

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />
      <View style={styles.container}>
        {/* ── HEADER ── */}
        <View
          style={[styles.header, { paddingTop: Math.max(insets.top, rs(16)) }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather
              name="chevron-left"
              size={rs(30)}
              color={colors.primarybtn}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Feather name="camera" size={rf(18)} color={colors.primarybtn} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Rabin's Support</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerOnline}>
                  AI Assistant {contextLoaded ? "· Ready" : "· Loading…"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── CHAT + INPUT ── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Messages list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble item={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              typing ? (
                <View style={styles.botRow}>
                  <View style={styles.botAvatar}>
                    <Feather
                      name="camera"
                      size={rf(13)}
                      color={colors.primarybtn}
                    />
                  </View>
                  <TypingDots />
                </View>
              ) : null
            }
          />

          {/* Quick chip suggestions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickBar}
            contentContainerStyle={styles.quickBarContent}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_CHIPS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.inputField}
              placeholder="Ask anything about bookings, services…"
              placeholderTextColor="#555"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              autoCapitalize="sentences"
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!input.trim() || typing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  input.trim() && !typing
                    ? [colors.primarybtn, colors.primarybtn]
                    : ["#222", "#222"]
                }
                style={styles.sendBtn}
              >
                <Feather
                  name="send"
                  size={rf(16)}
                  color={input.trim() && !typing ? "#000" : "#444"}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Space for footer tab bar */}
          <View style={{ height: keyboardVisible ? 0 : 80 + insets.bottom }} />
        </KeyboardAvoidingView>

        {!keyboardVisible && <Footer active="chat" />}
      </View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  // Header
  header: {
    backgroundColor: colors.topbardark,
    paddingHorizontal: rs(8),
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: rs(18),
    gap: spacing.md,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  backBtn: {
    width: rs(46),
    height: rs(46),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rs(23),
    marginBottom: rs(2),
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    paddingBottom: rs(6),
  },
  headerAvatar: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: colors.primarybtn + "22",
    borderWidth: 1.5,
    borderColor: colors.primarybtn + "55",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(5),
    marginTop: rs(3),
  },
  onlineDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: "#4ade80",
  },
  headerOnline: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#4ade80",
  },

  // Messages
  messageList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  // User bubble — right
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: "78%",
    backgroundColor: colors.primarybtn,
    borderRadius: rs(18),
    borderBottomRightRadius: rs(4),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  userText: {
    color: "#000",
    fontSize: rf(14),
    fontFamily: fonts.text,
    lineHeight: rf(21),
  },

  // Bot bubble — left
  botRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  botAvatar: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: colors.primarybtn + "22",
    borderWidth: 1,
    borderColor: colors.primarybtn + "44",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    flexShrink: 0,
  },
  botBubble: {
    maxWidth: "78%",
    backgroundColor: "#1E2128",
    borderRadius: rs(18),
    borderBottomLeftRadius: rs(4),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  botText: {
    color: colors.white,
    fontSize: rf(14),
    fontFamily: fonts.text,
    lineHeight: rf(21),
  },

  timeText: {
    fontSize: rf(10),
    color: "rgba(0,0,0,0.45)",
    marginTop: rs(4),
    textAlign: "right",
  },
  timeTextBot: {
    fontSize: rf(10),
    color: "rgba(255,255,255,0.3)",
    marginTop: rs(4),
    textAlign: "right",
  },

  // Typing indicator
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(5),
    backgroundColor: "#1E2128",
    borderRadius: rs(18),
    borderBottomLeftRadius: rs(4),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  typingDot: {
    width: rs(7),
    height: rs(7),
    borderRadius: rs(4),
    backgroundColor: colors.primarybtn,
  },

  // Quick chips
  quickBar: {
    backgroundColor: "#0f1015",
    borderTopWidth: 1,
    borderTopColor: "#1a1d24",
    maxHeight: rh(50),
  },
  quickBarContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: rs(9),
    gap: rs(8),
    alignItems: "center",
  },
  quickChip: {
    borderWidth: 1,
    borderColor: colors.primarybtn + "44",
    paddingHorizontal: spacing.md,
    paddingVertical: rs(6),
    borderRadius: rs(20),
    backgroundColor: colors.primarybtn + "0d",
  },
  quickChipText: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: colors.primarybtn,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#0f1015",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#1a1d24",
  },
  inputField: {
    flex: 1,
    backgroundColor: "#1E2128",
    borderRadius: rs(22),
    paddingHorizontal: spacing.md,
    paddingVertical: rsp.sx,
    color: colors.white,
    fontFamily: fonts.text,
    fontSize: rf(14),
    maxHeight: rh(100),
    borderWidth: 1,
    borderColor: "#2a2e39",
    lineHeight: rf(20),
  },
  sendBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    justifyContent: "center",
    alignItems: "center",
  },
});
