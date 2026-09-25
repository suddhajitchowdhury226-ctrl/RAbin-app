import { rf, rs } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { fonts } from "../../constants/fonts";

const navItems = [
  { name: "home",     icon: "home",      label: "Home",     route: "/dashboard" },
  { name: "services", icon: "image",     label: "Services", route: "/services"  },
  { name: "tracking", icon: "calendar",  label: "Bookings", route: "/details/ordertracking" },
  { name: "bookings", icon: "map-pin",   label: "Tracking", route: "/bookings"  },
  { name: "profile",  icon: "user",      label: "Profile",  route: "/profile"   },
];

function TabItem({ item, isActive, onPress }) {
  const scale = useRef(new Animated.Value(isActive ? 1.15 : 1)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isActive ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.2 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
      Animated.spring(translateY, {
        toValue: isActive ? -5 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.timing(dotOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const iconColor = isActive ? colors.heading2 : colors.subheading;

  return (
    <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
        <Feather name={item.icon} size={rf(20)} color={iconColor} />
      </Animated.View>
      <Text style={[styles.label, { color: iconColor }]}>{item.label}</Text>
      <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
    </TouchableOpacity>
  );
}

export default function Footer({ active }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 0 },
      ]}
    >
      <View style={styles.wrapper}>
        {navItems.map((item) => (
          <TabItem
            key={item.name}
            item={item}
            isActive={active === item.name}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", bottom: -10, left: 0, right: 0,
    width: "100%", backgroundColor: "transparent", zIndex: 999,
  },
  wrapper: {
    backgroundColor: "#1a1a1a", flexDirection: "row",
    justifyContent: "space-around", alignItems: "center",
    paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: "#2a2a2a", width: "100%",
  },
  navItem: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: rs(4) },
  label: { fontFamily: fonts.text, fontSize: rf(11), marginTop: rs(3) },
  dot: { width: rs(4), height: rs(4), borderRadius: rs(2), backgroundColor: colors.heading2, marginTop: rs(2) },
});
