import { KeyboardAvoidingView, Platform } from "react-native";

export function FormWrapper({ children }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
