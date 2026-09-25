/**
 * AppHeader — Shared responsive header for all app screens.
 *
 * Props:
 *   title         (string)  — Centre title text
 *   subtitle      (string)  — Optional smaller line below title (e.g. order id)
 *   onBack        (fn|null) — If provided, renders a back chevron on the left.
 *                             Pass null to hide (e.g. root screens).
 *   right         (node)    — Optional JSX for the right slot (icon button, etc.)
 *   bgColor       (string)  — Background colour override (defaults to topbardark)
 *   centerContent (node)    — Replaces the title+subtitle block with custom JSX
 *   leftContent   (node)    — Replaces the back-button slot with custom JSX
 */

import { Feather } from "@expo/vector-icons";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { rf, rs } from "../../constants/rs";

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

// Content area height below the safe-area padding
const CONTENT_H = rs(70);

export default function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  bgColor,
  centerContent,
  leftContent,
}) {
  const insets = useSafeAreaInsets();

  // Respect device safe area (notch / status bar) with a comfortable minimum
  const topPad = Math.max(insets.top, rs(Platform.OS === "android" ? 12 : 0));
  const totalHeight = topPad + CONTENT_H;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor || colors.topbardark,
          paddingTop: topPad,
          height: totalHeight,
        },
      ]}
    >
      {/* ── Left slot ── */}
      <View style={styles.side}>
        {leftContent ? (
          leftContent
        ) : onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={HIT}
            style={styles.iconBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Feather
              name="chevron-left"
              size={rs(30)}
              color={colors.primarybtn}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {/* ── Centre ── */}
      <View style={styles.centre}>
        {centerContent ?? (
          <>
            {!!title && (
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </>
        )}
      </View>

      {/* ── Right slot ── */}
      <View style={styles.side}>
        {right ?? <View style={styles.iconBtn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end", // content sits at the bottom of the bar
    paddingBottom: rs(14),
    paddingHorizontal: rs(8),
    // shadow
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },
  side: {
    width: rs(56),
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: rs(2),
  },
  iconBtn: {
    width: rs(46),
    height: rs(46),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rs(23),
  },
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: rs(6),
  },
  title: {
    color: colors.white,
    fontSize: rf(19),
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  subtitle: {
    color: colors.inactive,
    fontSize: rf(12),
    marginTop: rs(3),
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
