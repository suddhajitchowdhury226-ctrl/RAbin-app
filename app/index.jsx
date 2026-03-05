import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";

export default function Index() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const slides = [
    {
      id: 1,
      title: "Welcome to Photo Studio",
      subtitle: "Capturing life's most precious moments with unparalleled artistry and dedication.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyL9RF6ezjLHPZ3TnP-GCFEcqL-lt1L_bIdA&s",
    },
    {
      id: 2,
      title: "Professional Photography",
      subtitle: "Expert photographers with years of experience in capturing your special moments.",
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=600",
    },
    {
      id: 3,
      title: "Book Your Session",
      subtitle: "Easy booking process with flexible scheduling options to suit your needs.",
      image: "https://images.unsplash.com/photo-1516035069371-29ad0afe3f3d?w=400&h=600",
    },
  ];

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      if (seen === "true") {
        setHasSeenOnboarding(true);
        router.replace("/dashboard");
      } else {
        setHasSeenOnboarding(false);
      }
    } catch (error) {
      console.log("Error checking onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    setCurrentSlide(slide);
  };

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * 375, // Approximate screen width
        animated: true,
      });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/(auth)/login");
    } catch (error) {
      console.log("Error completing onboarding:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slides ScrollView */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          style={styles.slidesContainer}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <Image
                source={{ uri: slide.image }}
                style={styles.slideImage}
                resizeMode="cover"
              />
              <View style={styles.overlay} />
              <View style={styles.slideContent}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  x: index * 375,
                  animated: true,
                });
              }}
            >
              <View />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSkip}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
          >
            <LinearGradient
              colors={[colors.primary, colors.base]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <View style={styles.nextButtonContent}>
                <Text style={styles.nextButtonText}>
                  {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                </Text>
                <Feather name="arrow-right" size={18} color={colors.background} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: 20,
  },
  headerSpacer: {
    width: 40,
  },
  skipButton: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  slideContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    alignItems: "center",
    zIndex: 1,
  },
  slideTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  slideSubtitle: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  dotInactive: {
    backgroundColor: colors.muted,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loginButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nextButtonText: {
    color: colors.background,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
