// import { View, TouchableOpacity, StyleSheet } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useRouter, usePathname } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import { colors } from "../../constants/colors";

// export default function Footer({active}) {
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const pathname = usePathname();
//   const iconSize = 28;

//   const navItems = [
//     { name: "home", icon: "home", route: "/dashboard" },
//     { name: "image", icon: "image", route: "/services" },
//     { name: "calendar", icon: "calendar", route: "/calendar" },
//     { name: "monitor", icon: "message-square", route: "/monitor" },
//     { name: "user", icon: "user", route: "/user" },
//   ];

//   const handleNavigation = (route) => {
//     router.push(route);
//   };

//   const isActive = (route) => pathname === route;

//   const getColor = (route) =>
//     isActive(route) ? colors.gold : colors.inactive;

//   return (
//     <View style={[styles.container, { paddingBottom: insets.bottom }]}>
//       <View style={styles.wrapper}>
//         {navItems.map((item) => (
//           <TouchableOpacity
//             key={item.name}
//             style={[
//               styles.navItem,
//               isActive(item.route) && styles.activeItem,
//             ]}
//             activeOpacity={0.7}
//             onPress={() => handleNavigation(item.route)}
//           >
//             <Feather name={item.icon} size={iconSize} color={getColor(item.route)} />
//             {/* {isActive(item.route) && <View style={styles.indicator} />} */}
//           </TouchableOpacity>
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "transparent",
//   },
//   wrapper: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     height: 80,
//     borderRadius: 25,
//     backgroundColor: "#0f1b2e",
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "rgba(212, 175, 55, 0.2)",
    
//     // Premium shadow for iOS
//     shadowColor: "#000",
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 8 },
    
//     // Shadow for Android
//     elevation: 12,
//   },
//   navItem: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//   },
//   activeItem: {
//     backgroundColor: "rgba(212, 175, 55, 0.1)",
//   },
//   indicator: {
//     position: "absolute",
//     bottom: 4,
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: colors.gold,
//   },
// });



// new Footer code after redesign

import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { fonts } from "../../constants/fonts";

export default function Footer({ active }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "home", icon: "home", label: "Home", route: "/dashboard" },
    { name: "services", icon: "image", label: "Services", route: "/services" },
    { name: "bookings", icon: "calendar", label: "Bookings", route: "/bookings" },
    { name: "chat", icon: "message-square", label: "Chat", route: "/chat" },
    { name: "profile", icon: "user", label: "Profile", route: "/profile" },
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  const isActive = (name) => active === name;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 0,
        },
      ]}
    >
      <View style={styles.wrapper}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handleNavigation(item.route)}
          >
            <Feather
              name={item.icon}
              size={spacing.mx}
              color={isActive(item.name) ? colors.heading2 : colors.subheading}
            />
            <Text
              style={[
                styles.label,
                { color: isActive(item.name) ? colors.heading2 : colors.subheading },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -10,
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: "transparent",
    zIndex: 999,
  },
  wrapper: {
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    width: "100%",
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.text,
    fontSize: spacing.sx,
    marginTop: 4,
  },
});
