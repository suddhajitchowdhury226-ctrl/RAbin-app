import Footer from "@/components/Footer/FooterScreen";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { bookingsApi } from "../services/api";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Bookings = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingsApi.list();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Map backend booking to card-friendly shape
  const ordersData = bookings
    .filter(b => b.status !== 'CANCELLED')
    .map(b => ({
      id:     `#${b._id.slice(-5).toUpperCase()}`,
      title:  b.serviceId?.title || "Photography Package",
      date:   new Date(b.scheduledDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      price:  `₹${b.totalAmount?.toLocaleString()}`,
      status: b.status,
      image:  b.serviceId?.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552",
    }));

  const paymentsData = bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .map(b => ({
      id:     `#PAY${b._id.slice(-5).toUpperCase()}`,
      title:  b.serviceId?.title || "Payment",
      date:   new Date(b.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      price:  `₹${b.totalAmount?.toLocaleString()}`,
      status: "Paid",
      image:  b.serviceId?.coverImage || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    }));

  const data = activeTab === "orders" ? ordersData : paymentsData;

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <Feather name="filter" size={20} color="white" />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* SEGMENTED FILTER */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "orders" && styles.activeSegment]}
            onPress={() => setActiveTab("orders")}
          >
            <Text style={[styles.segmentText, activeTab === "orders" && styles.activeSegmentText]}>
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "payments" && styles.activeSegment]}
            onPress={() => setActiveTab("payments")}
          >
            <Text style={[styles.segmentText, activeTab === "payments" && styles.activeSegmentText]}>
              Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOADING / ERROR / EMPTY */}
        {loading && <Text style={{ color: colors.subheading, textAlign: 'center', marginTop: 40 }}>Loading bookings…</Text>}
        {!loading && error && <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>}
        {!loading && !error && data.length === 0 && (
          <Text style={{ color: colors.subheading, textAlign: 'center', marginTop: 40 }}>No bookings found.</Text>
        )}

        {/* CARD LIST */}
        {data.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order {item.id}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.dateRow}>
              <Feather name="calendar" size={16} color={colors.subheading} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.price}>{item.price}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <Footer active="bookings" />
    </>
  );
};

export default Bookings;


const styles = StyleSheet.create({
  header: {
    height: 85,
    backgroundColor: colors.topbardark,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: "#F3F4F6",
    marginLeft: 10,
  },

  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },

  scrollContent: {
    paddingBottom: 100,
  },

  /* SEGMENT */
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 14,
    marginBottom: spacing.lg,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeSegment: {
    backgroundColor: colors.primarybtn,
  },
  segmentText: {
    fontFamily: fonts.text,
    fontSize: spacing.md,
    fontWeight: "00",
    letterSpacing: 0.5,
    color: colors.white,
  },
  activeSegmentText: {
    color: "#000",
  },

  /* CARD */
  card: {
    backgroundColor: "#1E2128",
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 10,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderId: {
    fontFamily: fonts.body,
    color: "#BDC1CA",
  },
  status: {
    fontFamily: fonts.text,
    color: "#F3F4F6",
  },

  title: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    color: "#F3F4F6",
    marginVertical: 6,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: spacing.md,
    marginLeft: 6,
    fontFamily: fonts.text,
    color: "#BDC1CA",
  },

  divider: {
    height: 1,
    backgroundColor: "#323743",
    marginVertical: 10,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  image: {
    width: 80,
    height: 60,
    borderRadius: 10,
  },

  price: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    color: colors.heading2,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-between",
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#262A33",
    paddingVertical: 13,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 8,
  },
  secondaryBtnText: {
    fontFamily: fonts.text,
    color: colors.white,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 13,
    borderRadius: 5,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: fonts.text,
    color: colors.white,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
