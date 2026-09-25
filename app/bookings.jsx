import Footer from "@/components/Footer/FooterScreen";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { rf, rh, rs } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { bookingsApi } from "../services/api";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

// ─── Status configs ───────────────────────────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING: {
    label: "Payment Pending",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    icon: "clock",
  },
  CONFIRMED: {
    label: "Payment Done",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.3)",
    icon: "check-circle",
  },
  COMPLETED: {
    label: "Completed",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.3)",
    icon: "check-circle",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.3)",
    icon: "activity",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.3)",
    icon: "x-circle",
  },
};
const ADMIN_STATUS = {
  PENDING: {
    label: "Awaiting Approval",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.3)",
    icon: "loader",
  },
  APPROVED: {
    label: "Approved",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.3)",
    icon: "check-circle",
  },
  REJECTED: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.3)",
    icon: "x-circle",
  },
};

const StatusBadge = ({ config }) => (
  <View
    style={[
      s.badge,
      { backgroundColor: config.bg, borderColor: config.border },
    ]}
  >
    <Feather name={config.icon} size={rf(11)} color={config.color} />
    <Text style={[s.badgeText, { color: config.color }]}>{config.label}</Text>
  </View>
);

// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard = ({ booking }) => {
  const paymentCfg = PAYMENT_STATUS[booking.status] || PAYMENT_STATUS.PENDING;
  const adminCfg = ADMIN_STATUS[booking.adminStatus || "PENDING"];
  const isApproved = booking.adminStatus === "APPROVED";

  // Image: use the booked service's cover image (real data only)
  const coverImage = booking.serviceId?.coverImage || null;

  // Real names — show nothing if not present
  const packageName = booking.packageId?.name || null;
  const serviceName = booking.serviceId?.title || null;
  const packageTier = booking.packageId?.tier || null;

  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const amount =
    booking.totalAmount != null
      ? `₹${Number(booking.totalAmount).toLocaleString("en-IN")}`
      : null;
  const bookingRef = `#${booking._id.slice(-6).toUpperCase()}`;

  return (
    <View style={s.card}>
      {/* ── Top: image left, details right ── */}
      <View style={s.topRow}>
        {/* Package / service image */}
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={s.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.cardImage, s.cardImagePlaceholder]}>
            <Feather name="camera" size={rf(22)} color="#3a3e4a" />
          </View>
        )}

        {/* Details */}
        <View style={s.topDetails}>
          <Text style={s.bookingRef}>{bookingRef}</Text>

          {packageName ? (
            <Text style={s.packageName} numberOfLines={2}>
              {packageName}
            </Text>
          ) : null}

          {packageTier ? (
            <View style={s.tierBadge}>
              <Text style={s.tierText}>{packageTier}</Text>
            </View>
          ) : null}

          {serviceName ? (
            <Text style={s.serviceName} numberOfLines={1}>
              {serviceName}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Date / time / venue ── */}
      {(scheduledDate || booking.scheduledTime || booking.venue) && (
        <View style={s.metaBlock}>
          {scheduledDate && (
            <View style={s.metaRow}>
              <Feather
                name="calendar"
                size={rf(13)}
                color={colors.subheading}
              />
              <Text style={s.metaText}>
                {scheduledDate}
                {booking.scheduledTime ? `  ·  ${booking.scheduledTime}` : ""}
              </Text>
            </View>
          )}
          {!!booking.venue && (
            <View style={s.metaRow}>
              <Feather name="map-pin" size={rf(13)} color={colors.subheading} />
              <Text style={s.metaText} numberOfLines={1}>
                {booking.venue}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={s.divider} />

      {/* ── Amount + status badges ── */}
      <View style={s.bottomRow}>
        {amount && (
          <View>
            <Text style={s.amountLabel}>Total Paid</Text>
            <Text style={s.amountValue}>{amount}</Text>
          </View>
        )}
        <View style={s.badgeStack}>
          <StatusBadge config={paymentCfg} />
          <StatusBadge config={adminCfg} />
        </View>
      </View>

      {/* ── Rejection reason ── */}
      {booking.adminStatus === "REJECTED" && !!booking.adminNote && (
        <View style={s.rejectionNote}>
          <Feather name="info" size={rf(12)} color="#f87171" />
          <Text style={s.rejectionText}>{booking.adminNote}</Text>
        </View>
      )}

      {/* ── Track Order button (approved only) ── */}
      {isApproved && (
        <TouchableOpacity
          style={s.trackBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/details/tracking",
              params: { bookingId: booking._id },
            })
          }
        >
          <Feather name="map-pin" size={rf(14)} color="#000" />
          <Text style={s.trackBtnText}>Track Order</Text>
          <Feather name="chevron-right" size={rf(14)} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await bookingsApi.list();
      const active = Array.isArray(data)
        ? data.filter((b) =>
            ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(
              b.status,
            ),
          )
        : [];
      setBookings(active);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  useAutoRefresh(() => fetchBookings(true));

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      <AppHeader
        title="My Bookings"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            onPress={() => fetchBookings(true)}
            style={{ padding: rs(6) }}
          >
            <Feather
              name="refresh-cw"
              size={rf(18)}
              color={colors.subheading}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primarybtn}
            colors={[colors.primarybtn]}
          />
        }
      >
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primarybtn}
            style={{ marginTop: rh(60) }}
          />
        )}

        {!loading && error && (
          <View style={s.centerBox}>
            <Feather name="alert-circle" size={rf(32)} color="#f87171" />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={() => fetchBookings()}
            >
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && bookings.length === 0 && (
          <View style={s.centerBox}>
            <Feather name="camera-off" size={rf(40)} color="#2a2e39" />
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptySub}>
              Once you complete a booking, it will appear here.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          bookings.map((b) => <BookingCard key={b._id} booking={b} />)}

        <View style={{ height: rh(20) }} />
      </ScrollView>

      <Footer active="bookings" />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Card ──────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  scrollContent: {
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
    paddingBottom: rh(100),
    gap: rs(12),
  },

  // ── Card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#1E2128",
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: "#2a2e39",
    overflow: "hidden",
  },

  topRow: {
    flexDirection: "row",
    gap: rs(12),
    padding: rs(14),
  },

  cardImage: {
    width: rs(90),
    height: rs(90),
    borderRadius: rs(12),
    flexShrink: 0,
  },
  cardImagePlaceholder: {
    backgroundColor: "#12151b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2e39",
  },

  topDetails: {
    flex: 1,
    gap: rs(4),
  },
  bookingRef: {
    fontFamily: fonts.body,
    fontSize: rf(11),
    color: "#4a4e5a",
    letterSpacing: 0.5,
  },
  packageName: {
    fontFamily: fonts.heading,
    fontSize: rf(15),
    color: "#F3F4F6",
    lineHeight: rf(20),
  },
  tierBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,142,60,0.1)",
    borderRadius: rs(6),
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.25)",
  },
  tierText: {
    fontFamily: fonts.bold,
    fontSize: rf(10),
    color: colors.primarybtn,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  serviceName: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: colors.subheading,
  },

  metaBlock: {
    paddingHorizontal: rs(14),
    paddingBottom: rs(10),
    gap: rs(5),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  metaText: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#BDC1CA",
    flex: 1,
  },

  divider: { height: 1, backgroundColor: "#2a2e39" },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
  },
  amountLabel: {
    fontFamily: fonts.text,
    fontSize: rf(10),
    color: colors.subheading,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: rs(2),
  },
  amountValue: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: "#f59e0b",
  },
  badgeStack: {
    gap: rs(6),
    alignItems: "flex-end",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(20),
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.text,
    fontSize: rf(10),
    fontWeight: "600",
  },

  rejectionNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rs(6),
    marginHorizontal: rs(14),
    marginBottom: rs(12),
    backgroundColor: "rgba(248,113,113,0.08)",
    borderRadius: rs(8),
    padding: rs(10),
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
  },
  rejectionText: {
    flex: 1,
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#f87171",
    lineHeight: rf(17),
  },

  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    margin: rs(14),
    marginTop: rs(4),
    backgroundColor: colors.primarybtn,
    borderRadius: rs(12),
    paddingVertical: rs(11),
  },
  trackBtnText: {
    fontFamily: fonts.bold,
    fontSize: rf(13),
    color: "#000",
    fontWeight: "700",
  },

  // Empty / error
  centerBox: {
    alignItems: "center",
    marginTop: rh(60),
    gap: rs(12),
    paddingHorizontal: rs(24),
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: "#F3F4F6",
  },
  emptySub: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: colors.subheading,
    textAlign: "center",
    lineHeight: rf(20),
  },
  errorText: {
    fontFamily: fonts.text,
    fontSize: rf(14),
    color: "#f87171",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#2a2e39",
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rs(10),
  },
  retryText: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: "#F3F4F6",
  },
});
