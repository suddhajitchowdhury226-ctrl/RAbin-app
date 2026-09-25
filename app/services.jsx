import Footer from "@/components/Footer/FooterScreen";
import { PageWrapper } from "@/components/PageLoader";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { rf, rh, rs } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const Services = () => {
  const handleOpenDetails = ({ image, title, badge, slug }) => {
    router.push({
      pathname: "/details/servicedetails",
      params: {
        image,
        title,
        badge: badge ?? "",
        slug: slug ?? "",
      },
    });
  };

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [servicesData, setServicesData] = useState([]);

  const fetchServices = useCallback(async () => {
    try {
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL ||
        "https://app-server-maaw.onrender.com/api/v1";
      const res = await fetch(`${apiUrl}/services`);
      const data = await res.json();
      if (data.success && data.data) setServicesData(data.data);
    } catch (err) {}
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  useAutoRefresh(fetchServices);

  const filteredServices =
    activeCategory === "ALL"
      ? servicesData
      : servicesData.filter((s) => s.category === activeCategory.toUpperCase());

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.serviceheader} />

      <AppHeader
        title="Services"
        onBack={() => router.back()}
        bgColor={colors.serviceheader}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* CATEGORY PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginBottom: rs(24),
            backgroundColor: "#171a1f",
            paddingHorizontal: rs(16),
            paddingVertical: rs(16),
            marginTop: -1,
            width: "100%",
          }}
        >
          {["ALL", "WEDDING", "PORTRAIT", "EVENT", "CORPORATE", "OTHER"].map(
            (cat) => (
              <Category
                key={cat}
                label={
                  cat === "ALL"
                    ? "All"
                    : cat.charAt(0) + cat.slice(1).toLowerCase()
                }
                active={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ),
          )}
        </ScrollView>

        {/* GRID */}
        <View style={styles.grid}>
          {filteredServices.map((s) => (
            <ServiceCard
              key={s._id}
              image={
                s.coverImage ||
                "https://images.unsplash.com/photo-1519741497674-611481863552"
              }
              title={s.title}
              badge={s.badge || ""}
              onPress={() =>
                handleOpenDetails({
                  image:
                    s.coverImage ||
                    "https://images.unsplash.com/photo-1519741497674-611481863552",
                  title: s.title,
                  badge: s.badge || "",
                  slug: s.slug || "",
                })
              }
            />
          ))}
          {filteredServices.length === 0 && (
            <Text
              style={{
                color: "#888",
                marginTop: 20,
                textAlign: "center",
                width: "100%",
              }}
            >
              {servicesData.length === 0
                ? "No services available yet."
                : "No services in this category."}
            </Text>
          )}
        </View>
      </ScrollView>
      <Footer active="services" />
    </>
  );
};

export default Services;

const Category = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.category, active && { backgroundColor: "#F5515F" }]}
  >
    <Text style={[styles.categoryText, active && { color: "#FFF" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ServiceCard = ({ image, title, badge, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <Image source={{ uri: image }} style={styles.cardImage} />
    <View style={styles.overlay} />

    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}

    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", width: "100%" },
  category: {
    backgroundColor: "#262A33",
    paddingVertical: rs(8),
    paddingHorizontal: rs(16),
    borderRadius: rs(20),
    marginRight: rs(10),
  },
  categoryText: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: colors.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    paddingHorizontal: rs(8),
    paddingTop: rs(4),
  },
  card: {
    width: "48%",
    height: rh(175),
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(14),
    backgroundColor: "#111c29",
    marginTop: rs(14),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: rs(8),
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cardContent: {
    position: "absolute",
    bottom: rs(10),
    left: rs(10),
    right: rs(10),
  },
  cardTitle: { fontFamily: fonts.text, fontSize: rf(13), color: colors.white },
  badge: {
    position: "absolute",
    top: rs(8),
    right: rs(8),
    backgroundColor: "#FF8E3C",
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(10),
  },
  badgeText: { fontSize: rf(11), fontFamily: fonts.text, color: "#1f1d1d" },
});
