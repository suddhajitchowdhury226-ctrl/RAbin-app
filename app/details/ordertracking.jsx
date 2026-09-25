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
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { bookingsApi } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

// ─── Status configs ───────────────────────────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING:     { label: "Payment Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: "clock" },
  CONFIRMED:   { label: "Payment Done",    color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  icon: "check-circle" },
  COMPLETED:   { label: "Completed",       color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  icon: "check-circle" },
  IN_PROGRESS: { label: "In Progress",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  icon: "activity" },
  CANCELLED:   { label: "Cancelled",       color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", icon: "x-circle" },
};
const ADMIN_STATUS = {
  PENDING:  { label: "Awaiting Approval", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", icon: "loader" },
  APPROVED: { label: "Approved",          color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  icon: "check-circle" },
  REJECTED: { label: "Rejected",          color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", icon: "x-circle" },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const StatusBadge = ({ config }) => (
  <View style={[s.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
    <Feather name={config.icon} size={rf(11)} color={config.color} />
    <Text style={[s.badgeText, { color: config.color }]}>{config.label}</Text>
  </View>
);

// ─── Full Booking Detail Modal ────────────────────────────────────────────────
const BookingDetailModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const paymentCfg  = PAYMENT_STATUS[booking.status] || PAYMENT_STATUS.PENDING;
  const adminCfg    = ADMIN_STATUS[booking.adminStatus || "PENDING"];

  // Image: the service this package belongs to
  const coverImage  = booking.serviceId?.coverImage || null;
  const packageName = booking.packageId?.name || null;
  const packageTier = booking.packageId?.tier || null;
  const serviceName = booking.serviceId?.title || null;
  const bookingRef  = `#${booking._id.slice(-6).toUpperCase()}`;

  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
        <StatusBar style="light" backgroundColor={colors.topbardark} />

        {/* ── Header ── */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="chevron-down" size={rf(22)} color={colors.primarybtn} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.modalTitle}>Booking Details</Text>
            <Text style={s.modalRef}>{bookingRef}</Text>
          </View>
          <View style={s.badgeRow}>
            <StatusBadge config={paymentCfg} />
            <StatusBadge config={adminCfg} />
          </View>
        </View>

        <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>

          {/* ── Hero image (service cover for this package) ── */}
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, s.heroPlaceholder]}>
              <Feather name="camera" size={rf(40)} color="#2a2e39" />
            </View>
          )}

          {/* ── Package identity ── */}
          <View style={s.section}>
            {packageName && <Text style={s.packageName}>{packageName}</Text>}
            {packageTier && (
              <View style={s.tierBadge}>
                <Text style={s.tierText}>{packageTier}</Text>
              </View>
            )}
            {serviceName && <Text style={s.serviceName}>{serviceName}</Text>}
          </View>

          {/* ── Session details ── */}
          {(scheduledDate || booking.scheduledTime || booking.outTime || booking.venue || booking.additionalDates?.length > 0) && (
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>Session Details</Text>
              {scheduledDate && (
                <View style={s.infoRow}>
                  <Feather name="calendar" size={rf(14)} color={colors.primarybtn} />
                  <Text style={s.infoLabel}>Date</Text>
                  <Text style={s.infoValue}>{scheduledDate}</Text>
                </View>
              )}
              {!!booking.scheduledTime && (
                <View style={s.infoRow}>
                  <Feather name="clock" size={rf(14)} color={colors.primarybtn} />
                  <Text style={s.infoLabel}>Start Time</Text>
                  <Text style={s.infoValue}>{booking.scheduledTime}</Text>
                </View>
              )}
              {!!booking.outTime && (
                <View style={s.infoRow}>
                  <Feather name="clock" size={rf(14)} color={colors.subheading} />
                  <Text style={s.infoLabel}>End Time</Text>
                  <Text style={s.infoValue}>{booking.outTime}</Text>
                </View>
              )}
              {!!booking.venue && (
                <View style={s.infoRow}>
                  <Feather name="map-pin" size={rf(14)} color={colors.primarybtn} />
                  <Text style={s.infoLabel}>Venue</Text>
                  <Text style={[s.infoValue, { flex: 1, textAlign: "right" }]}>{booking.venue}</Text>
                </View>
              )}
              {booking.additionalDates?.length > 0 && (
                <View style={s.infoRow}>
                  <Feather name="plus-circle" size={rf(14)} color={colors.subheading} />
                  <Text style={s.infoLabel}>Extra Days</Text>
                  <Text style={s.infoValue}>
                    {booking.additionalDates.length} additional day{booking.additionalDates.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Payment summary ── */}
          {(booking.baseAmount > 0 || booking.addonsAmount > 0 || booking.taxAmount > 0 || booking.totalAmount > 0) && (
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>Payment Summary</Text>
              {booking.baseAmount > 0 && (
                <View style={s.infoRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Base Price</Text>
                  <Text style={s.infoValue}>{fmt(booking.baseAmount)}</Text>
                </View>
              )}
              {booking.addonsAmount > 0 && (
                <View style={s.infoRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Add-ons</Text>
                  <Text style={s.infoValue}>{fmt(booking.addonsAmount)}</Text>
                </View>
              )}
              {booking.taxAmount > 0 && (
                <View style={s.infoRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Tax</Text>
                  <Text style={s.infoValue}>{fmt(booking.taxAmount)}</Text>
                </View>
              )}
              {booking.totalAmount > 0 && (
                <View style={[s.infoRow, s.totalRow]}>
                  <Text style={s.totalLabel}>Total Paid</Text>
                  <Text style={s.totalValue}>{fmt(booking.totalAmount)}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Add-ons list ── */}
          {booking.addons?.length > 0 && (
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>Add-ons</Text>
              {booking.addons.map((a, i) => (
                <View key={i} style={s.infoRow}>
                  <Feather name="plus-square" size={rf(13)} color={colors.subheading} />
                  <Text style={[s.infoLabel, { flex: 1 }]}>{a.name}</Text>
                  <Text style={s.infoValue}>{fmt(a.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Booking status ── */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>Booking Status</Text>
            <View style={s.statusRow}>
              <Text style={s.infoLabel}>Payment</Text>
              <StatusBadge config={paymentCfg} />
            </View>
            <View style={[s.statusRow, { marginTop: rs(10) }]}>
              <Text style={s.infoLabel}>Admin Approval</Text>
              <StatusBadge config={adminCfg} />
            </View>
            {booking.adminStatus === "REJECTED" && !!booking.adminNote && (
              <View style={s.rejectionNote}>
                <Feather name="info" size={rf(12)} color="#f87171" />
                <Text style={s.rejectionText}>{booking.adminNote}</Text>
              </View>
            )}
          </View>

          {/* ── Special notes ── */}
          {!!booking.specialNotes && (
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>Special Notes</Text>
              <Text style={s.notesText}>{booking.specialNotes}</Text>
            </View>
          )}

          {/* ── Booked on ── */}
          {!!booking.createdAt && (
            <Text style={s.bookedOn}>
              Booked on{" "}
              {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </Text>
          )}

          <View style={{ height: rh(40) }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Tappable Booking Card ────────────────────────────────────────────────────
const BookingCard = ({ booking, onPress }) => {
  const paymentCfg  = PAYMENT_STATUS[booking.status] || PAYMENT_STATUS.PENDING;
  const adminCfg    = ADMIN_STATUS[booking.adminStatus || "PENDING"];

  const coverImage  = booking.serviceId?.coverImage || null;
  const packageName = booking.packageId?.name || null;
  const packageTier = booking.packageId?.tier || null;
  const serviceName = booking.serviceId?.title || null;
  const bookingRef  = `#${booking._id.slice(-6).toUpperCase()}`;

  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const amount = booking.totalAmount != null
    ? `₹${Number(booking.totalAmount).toLocaleString("en-IN")}`
    : null;

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.82} onPress={onPress}>

      {/* ── Top: image + details ── */}
      <View style={s.topRow}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={s.cardImage} resizeMode="cover" />
        ) : (
          <View style={[s.cardImage, s.cardImagePlaceholder]}>
            <Feather name="camera" size={rf(22)} color="#3a3e4a" />
          </View>
        )}

        <View style={s.topDetails}>
          <Text style={s.bookingRef}>{bookingRef}</Text>
          {packageName && (
            <Text style={s.packageName} numberOfLines={2}>{packageName}</Text>
          )}
          {packageTier && (
            <View style={s.tierBadge}>
              <Text style={s.tierText}>{packageTier}</Text>
            </View>
          )}
          {serviceName && (
            <Text style={s.serviceName} numberOfLines={1}>{serviceName}</Text>
          )}
        </View>

        {/* Arrow */}
        <View style={s.arrowBg}>
          <Feather name="chevron-right" size={rf(15)} color={colors.primarybtn} />
        </View>
      </View>

      {/* ── Date / venue ── */}
      {(scheduledDate || booking.venue) && (
        <View style={s.metaBlock}>
          {scheduledDate && (
            <View style={s.metaRow}>
              <Feather name="calendar" size={rf(12)} color={colors.subheading} />
              <Text style={s.metaText}>
                {scheduledDate}
                {booking.scheduledTime ? `  ·  ${booking.scheduledTime}` : ""}
              </Text>
            </View>
          )}
          {!!booking.venue && (
            <View style={s.metaRow}>
              <Feather name="map-pin" size={rf(12)} color={colors.subheading} />
              <Text style={s.metaText} numberOfLines={1}>{booking.venue}</Text>
            </View>
          )}
        </View>
      )}

      <View style={s.divider} />

      {/* ── Amount + badges ── */}
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

    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await bookingsApi.list();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true));

  const onRefresh = () => { setRefreshing(true); load(true); };

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      <AppHeader
        title="My Bookings"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={() => load(true)} style={s.refreshBtn}>
            <Feather name="refresh-cw" size={rf(16)} color={colors.subheading} />
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
          <ActivityIndicator size="large" color={colors.primarybtn} style={{ marginTop: rh(60) }} />
        )}

        {!loading && error && (
          <View style={s.centerBox}>
            <Feather name="alert-circle" size={rf(32)} color="#f87171" />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && bookings.length === 0 && (
          <View style={s.centerBox}>
            <Feather name="calendar" size={rf(44)} color="#2a2e39" />
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptySub}>Your booking history will appear here.</Text>
          </View>
        )}

        {!loading && !error && bookings.map((b) => (
          <BookingCard key={b._id} booking={b} onPress={() => setSelected(b)} />
        ))}

        <View style={{ height: rh(20) }} />
      </ScrollView>

      <Footer active="tracking" />

      {selected && (
        <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Refresh button
  refreshBtn: { padding: rs(6) },
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  scrollContent: {
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
    paddingBottom: rh(100),
    gap: rs(12),
  },

  // ── List Card ────────────────────────────────────────────────────
  card: {
    backgroundColor: "#1E2128",
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: "#2a2e39",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rs(12),
    padding: rs(14),
  },
  cardImage: {
    width: rs(88),
    height: rs(88),
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
  topDetails: { flex: 1, gap: rs(4) },
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
    lineHeight: rf(21),
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
  arrowBg: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(8),
    backgroundColor: "rgba(255,142,60,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.18)",
    alignSelf: "center",
    flexShrink: 0,
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
    alignItems: "flex-end",
    gap: rs(5),
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
  badgeText: { fontFamily: fonts.text, fontSize: rf(10), fontWeight: "600" },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(5),
    flexShrink: 1,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  // Empty / error
  centerBox: {
    alignItems: "center",
    marginTop: rh(60),
    gap: rs(12),
    paddingHorizontal: rs(24),
  },
  emptyTitle: { fontFamily: fonts.heading, fontSize: rf(18), color: "#F3F4F6" },
  emptySub: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: colors.subheading,
    textAlign: "center",
    lineHeight: rf(20),
  },
  errorText: { fontFamily: fonts.text, fontSize: rf(14), color: "#f87171", textAlign: "center" },
  retryBtn: {
    backgroundColor: "#2a2e39",
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rs(10),
  },
  retryText: { fontFamily: fonts.text, fontSize: rf(13), color: "#F3F4F6" },

  // ── Modal ────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    paddingHorizontal: rs(14),
    paddingTop: rs(14),
    paddingBottom: rs(10),
    backgroundColor: colors.topbardark,
    borderBottomWidth: 1,
    borderBottomColor: "#1e222b",
  },
  closeBtn: { padding: rs(4) },
  modalTitle: { fontFamily: fonts.heading, fontSize: rf(16), color: "#F3F4F6" },
  modalRef: { fontFamily: fonts.text, fontSize: rf(11), color: colors.subheading, marginTop: rs(2) },
  modalContent: { paddingBottom: rh(40) },

  heroImg: { width: "100%", height: rh(210), backgroundColor: "#1E2128" },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2e39",
  },

  section: { paddingHorizontal: rs(16), paddingTop: rs(16), paddingBottom: rs(4), gap: rs(6) },

  infoCard: {
    marginHorizontal: rs(16),
    marginTop: rs(12),
    backgroundColor: "#1E2128",
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  infoCardTitle: {
    fontFamily: fonts.bold,
    fontSize: rf(10),
    color: colors.subheading,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: rs(12),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginBottom: rs(10),
  },
  infoLabel: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: colors.subheading,
    width: rs(90),
  },
  infoValue: { fontFamily: fonts.bold, fontSize: rf(13), color: "#F3F4F6" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#2a2e39",
    paddingTop: rs(10),
    marginTop: rs(4),
    marginBottom: 0,
  },
  totalLabel: { fontFamily: fonts.bold, fontSize: rf(14), color: "#F3F4F6", flex: 1 },
  totalValue: { fontFamily: fonts.heading, fontSize: rf(20), color: "#f59e0b" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rejectionNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rs(6),
    marginTop: rs(10),
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
  notesText: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: "#BDC1CA",
    lineHeight: rf(20),
  },
  bookedOn: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "#3a3e4a",
    textAlign: "center",
    marginTop: rs(16),
  },
});
