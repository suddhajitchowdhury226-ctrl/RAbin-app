import Footer from "@/components/Footer/FooterScreen";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const Services = () => {
  const handleOpenDetails = ({ image, title, badge }) => {
    router.push({
      pathname: "/details/servicedetails",
      params: {
        image,
        title,
        badge: badge ?? "",
      },
    });
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.serviceheader} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => { router.back() }}>
            <Feather name="chevron-left" size={25} color={"#F5515F"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Services</Text>
        </View>
        <Feather name="filter" size={20} color={"#F5515F"} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* CATEGORY PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg ,backgroundColor:"#171a1f", paddingHorizontal:spacing.md,paddingVertical:spacing.md,marginTop:-1,width:"100%"}}
        >
          <Category label="Wedding" active />
          <Category label="Portrait" />
          <Category label="Event" />
          <Category label="Corporate" />
        </ScrollView>

        {/* GRID */}
        <View style={styles.grid}>
          <ServiceCard
            image="https://images.unsplash.com/photo-1519741497674-611481863552"
            title="Elegant Wedding Photography"
            badge="Popular"
            onPress={() =>
              handleOpenDetails({
                image: "https://images.unsplash.com/photo-1519741497674-611481863552",
                title: "Elegant Wedding Photography",
                badge: "Popular",
              })
            }
          />

          <ServiceCard
            image="https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
            title="Professional Portrait Sessions"
            onPress={() =>
              handleOpenDetails({
                image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
                title: "Professional Portrait Sessions",
                badge: "",
              })
            }
          />

          <ServiceCard
            image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91"
            title="Corporate Event Coverage"
            badge="New"
            onPress={() =>
              handleOpenDetails({
                image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91",
                title: "Corporate Event Coverage",
                badge: "New",
              })
            }
          />

          <ServiceCard
            image="https://images.unsplash.com/photo-1492724441997-5dc865305da7"
            title="Product & Fashion Shoots"
            onPress={() =>
              handleOpenDetails({
                image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
                title: "Product & Fashion Shoots",
                badge: "",
              })
            }
          />


        </View>
      </ScrollView>
      <Footer active="services" />
    </>
  );
};

export default Services;

const Category = ({ label, active }) => (
  <TouchableOpacity
    style={[
      styles.category,
      active && { backgroundColor: "#F5515F" },
    ]}
  >
    <Text
      style={[
        styles.categoryText,
        active && { color: "#FFF" },
      ]}
    >
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
  header: {
    height: 85,
    backgroundColor: colors.serviceheader,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: "#F3F4F6",
    marginLeft: 12,
  },

  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 0,
    width: "100%",
  },

  /* CATEGORY */
  category: {
    backgroundColor: "#262A33",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryText: {
    fontFamily: fonts.text,
    fontSize: 15,
    color: colors.white,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    marginTop: -20,
    paddingHorizontal: spacing.sm,

  },

  /* CARD */
  card: {
    width: "48%",
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: "#111c29",
    marginTop:18,
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.8)",
    elevation: 12,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)",
  },
  cardContent: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  cardTitle: {
    fontFamily: fonts.text,
    fontSize: 14,
    color: colors.white,
  },

  /* BADGE */
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF8E3C",
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: fonts.text,
    color: "#1f1d1d",
  },
});


