import Footer from "@/components/Footer/FooterScreen";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
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

const initialMessages = [
  {
    id: "1",
    text: "Hello! How can I assist you today with your photography needs?",
    sender: "admin",
    time: "10:00 AM",
  },
  {
    id: "2",
    text: "Hi! I'd like to inquire about wedding photography packages.",
    sender: "user",
    time: "10:02 AM",
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.adminRow,
        ]}
      >
        {isUser ? (
          <>
            <View style={styles.avatar}>
              <Feather name="user" size={14} color="#000" />
            </View>

            <View style={styles.userBubble}>
              <Text style={styles.userText}>{item.text}</Text>
              <Text style={styles.userTime}>{item.time}</Text>
            </View>
          </>
        ) : (
          <View style={styles.adminBubble}>
            <Text style={styles.adminText}>{item.text}</Text>
            <Text style={styles.adminTime}>{item.time}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      <View style={styles.container}>
        <View style={styles.root}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color={colors.primarybtn} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Rabin's Support
          </Text>

          <Feather name="more-vertical" size={20} color={colors.primarybtn} />
        </View>

        {/* MAIN CONTENT */}
        <KeyboardAvoidingView
          style={styles.main}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          enabled={true}
        >
          {/* CHAT */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.md }}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />

          {/* QUICK ACTIONS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActions}
          >
            <TouchableOpacity style={styles.quickBtn}>
              <Text style={styles.quickText}>
                Check package details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn}>
              <Text style={styles.quickText}>
                Booking inquiry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn}>
              <Text style={styles.quickText}>
                Pricing info
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* INPUT */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputInner}>
              <View style={styles.iconWrapper}>
                <Feather name="paperclip" size={18} color="#aaa" />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#888"
                value={messageText}
                onChangeText={setMessageText}
                multiline={true}
                maxLength={500}
                textAlignVertical="center"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={sendMessage}
              >
                <LinearGradient
                  colors={[colors.primary, colors.base]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.sendBtn}
                >
                  <Feather name="send" size={18} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* FOOTER SPACING - Always present, height changes based on keyboard */}
          <View style={[
            styles.footerSpacer, 
            { height: keyboardVisible ? 0 : 65 }
          ]} />
        </KeyboardAvoidingView>

        </View>
        
        {!keyboardVisible && <Footer active="chat" />}
      </View>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  header: {
    height: 85,
    backgroundColor: colors.topbardark,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: spacing.sx,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },

  main: {
    flex: 1,
  },

  footerSpacer: {
    backgroundColor: "#0a0a0a",
  },

  messageRow: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  adminRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  userBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#1E2128",
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "#F3F4F6",
    lineHeight: 20,
    fontSize: spacing.md,
    textTransform: "none",
  },
  userTime: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 6,
    textAlign: "right",
  },

  adminBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FF8E3C",
    borderBottomRightRadius: 4,
  },
  adminText: {
    color: "#19191F",
    fontSize: spacing.md,
    lineHeight: 20,
    textTransform: "none",
  },
  adminTime: {
    fontSize: 11,
    color: "#333",
    marginTop: 6,
    textAlign: "right",
  },

  quickActions: {
    backgroundColor: "#171A1F",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    maxHeight: 50,
  },
  quickBtn: {
    borderWidth: 1,
    borderColor: colors.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  quickText: {
    color: colors.base,
    fontFamily: fonts.text,
    fontSize: spacing.sx,
  },

  inputWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#171A1F",
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#323743",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120,
  },
  iconWrapper: {
    paddingBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    marginHorizontal: 8,
    fontSize: 14,
    paddingVertical: 8,
    textAlignVertical: "center",
    fontFamily: "ui-monospace",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
