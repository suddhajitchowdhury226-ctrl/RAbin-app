import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";

const Popup = ({ visible, type = "success", message = "", duration = 800, onClose }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        closePopup();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const closePopup = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onClose?.();
    });
  };

  const getPopupConfig = () => {
    const configs = {
      success: {
        icon: "check-circle",
        color: "#10b981",
        bgColor: "#d1fae5",
        title: "Success!",
      },
      failed: {
        icon: "x-circle",
        color: "#ef4444",
        bgColor: "#fee2e2",
        title: "Failed!",
      },
      cancelled: {
        icon: "alert-circle",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        title: "Cancelled",
      },
      warning: {
        icon: "alert-triangle",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        title: "Warning!",
      },
      info: {
        icon: "info",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        title: "Info",
      },
      loading: {
        icon: "loader",
        color: colors.gold,
        bgColor: "#fef8f0",
        title: "Loading...",
      },
    };
    return configs[type] || configs.success;
  };

  const config = getPopupConfig();

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.card, { borderColor: config.color }]}>
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              {type === "loading" ? (
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: scaleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Feather name={config.icon} size={40} color={config.color} />
                </Animated.View>
              ) : (
                <Feather name={config.icon} size={40} color={config.color} />
              )}
            </View>

            {/* Text Content */}
            <Text style={styles.title}>{config.title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: opacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["100%", "0%"],
                    }),
                    backgroundColor: config.color,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Popup;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.heading2,
    borderRadius: 20,
    borderWidth: 2,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: "center",
  },
  message: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
  progressBar: {
    width: "100%",
    height: 3,
    backgroundColor: "#2a3442",
    borderRadius: 1.5,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
});
