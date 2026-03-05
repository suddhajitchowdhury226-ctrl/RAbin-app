import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  toggleSecure,
}) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={18} color="#8A8F98" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8A8F98"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {toggleSecure && (
        <TouchableOpacity onPress={toggleSecure}>
          <Feather
            name={secureTextEntry ? "eye-off" : "eye"}
            size={18}
            color="#8A8F98"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginTop: 8,
    backgroundColor: "#0C0C0C",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "white",
    fontSize: 14,
  },
});
