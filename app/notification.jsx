import AppHeader from "../components/AppHeader/AppHeader";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";
import { rf, rh, rs } from "../constants/rs";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { notificationsApi } from "../services/api";

// ─── Type → icon / accent colour map ─────────────────────────────────────────
const TYPE_META = {
  general: { icon: "bell", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  promo: { icon: "tag", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  service: { icon: "camera", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  booking: { icon: "calendar", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  discount: { icon: "percent", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.general;

const formatTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

// ─── Single Notification Row ──────────────────────────────────────────────────
const NotifRow = ({ item, onMarkRead }) => {
  const meta = getTypeMeta(item.type);
  const fadeAnim = useRef(new Animated.Value(item.isRead ? 1 : 0)).current;

  const handlePress = () => {
    if (!item.isRead) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      onMarkRead(item._id);
    }
  };

  const bgColor = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1e222b", "#181b22"],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View style={[styles.row, { backgroundColor: bgColor }]}>
        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={rf(18)} color={meta.color} />
        </View>

        {/* Text */}
        <View style={styles.rowBody}>
          <Text
            style={[styles.rowTitle, item.isRead && styles.rowTitleRead]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.rowMsg} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.rowTime}>{formatTime(item.createdAt)}</Text>
        </View>

        {/* Type pill */}
        <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.typeText, { color: meta.color }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Realtime-poll state ───────────────────────────────────────────────────
  const knownIdsRef = useRef(new Set());
  const [toast, setToast] = useState(null); // { title, message, color }
  const toastHideTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const showToast = (item) => {
    const meta = getTypeMeta(item.type);
    setToast({
      title: item.title,
      message: item.message,
      color: meta.color,
      bg: meta.bg,
    });
    if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    toastHideTimerRef.current = setTimeout(() => setToast(null), 6000);
  };

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await notificationsApi.list();
      const list = Array.isArray(data?.notifications) ? data.notifications : [];

      // ── Detect brand-new notifications we haven't seen before ──────────────
      const prevIds = knownIdsRef.current;
      const newOnes =
        prevIds.size > 0
          ? list.filter((n) => !prevIds.has(n._id) && !n.isRead).slice(0, 3)
          : [];
      list.forEach((n) => prevIds.add(n._id));

      if (newOnes.length && !silent) {
        showToast(newOnes[0]);
      }

      setNotifications(list);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + soft realtime polling (15s) while screen is mounted.
  // Avoids adding socket.io-client as a dependency and works everywhere.
  useEffect(() => {
    load();
    pollTimerRef.current = setInterval(() => load(true), 15000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleMarkRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      /* silent */
    }
  }, []);

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      /* silent */
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      <AppHeader
        title="Notifications"
        onBack={() => router.back()}
        right={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
              <Feather
                name="check-circle"
                size={rf(15)}
                color={colors.primarybtn}
              />
              <Text style={styles.markAllText}>All read</Text>
            </TouchableOpacity>
          ) : null
        }
        centerContent={
          <View style={styles.headerCenterContent}>
            <Text style={styles.headerTitleText}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        }
      />

      {/* ── Live / Realtime Toast Banner ───────────────────────────────────── */}
      {toast && (
        <Animated.View
          style={[
            styles.toastWrap,
            { borderLeftColor: toast.color, backgroundColor: "#141720" },
          ]}
        >
          <View style={[styles.toastIcon, { backgroundColor: toast.bg }]}>
            <Feather name="bell" size={rf(18)} color={toast.color} />
          </View>
          <View style={{ flex: 1, gap: rs(2) }}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {toast.title}
            </Text>
            <Text style={styles.toastMessage} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setToast(null)}
            hitSlop={10}
            style={{ padding: rs(4) }}
          >
            <Feather name="x" size={rf(14)} color="#4a4e5a" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Body ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primarybtn}
            colors={[colors.primarybtn]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primarybtn}
            style={{ marginTop: rh(80) }}
          />
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centerBox}>
            <Feather name="alert-circle" size={rf(36)} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && notifications.length === 0 && (
          <View style={styles.centerBox}>
            <View style={styles.emptyIcon}>
              <Feather name="bell-off" size={rf(34)} color="#3a3e4a" />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>
              You'll be notified here when there are new offers, service
              updates, or booking news.
            </Text>
          </View>
        )}

        {/* Sections: Unread → Today → Earlier */}
        {!loading &&
          !error &&
          notifications.length > 0 &&
          (() => {
            const now = new Date();
            const todayStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            ).getTime();

            const unread = notifications.filter((n) => !n.isRead);
            const todayRead = notifications.filter(
              (n) => n.isRead && new Date(n.createdAt).getTime() >= todayStart,
            );
            const earlier = notifications.filter(
              (n) => n.isRead && new Date(n.createdAt).getTime() < todayStart,
            );

            const Section = ({ label, items }) =>
              items.length === 0 ? null : (
                <>
                  <Text style={styles.sectionLabel}>{label}</Text>
                  {items.map((item) => (
                    <NotifRow
                      key={item._id}
                      item={item}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </>
              );

            return (
              <>
                <Section label="Unread" items={unread} />
                <Section label="Today" items={todayRead} />
                <Section label="Earlier" items={earlier} />
              </>
            );
          })()}

        <View style={{ height: rh(60) }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0a0a" },

  headerCenterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  headerTitleText: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: "#F3F4F6",
  },
  countBadge: {
    backgroundColor: colors.primarybtn,
    borderRadius: rs(10),
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    minWidth: rs(20),
    alignItems: "center",
  },
  countBadgeText: {
    fontFamily: fonts.bold,
    fontSize: rf(10),
    color: "#000",
    fontWeight: "800",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    paddingVertical: rs(4),
    paddingHorizontal: rs(8),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,142,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.2)",
  },
  markAllText: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: colors.primarybtn,
    fontWeight: "600",
  },

  // ── Realtime Toast ──────────────────────────────────────────────────────
  toastWrap: {
    marginHorizontal: rs(12),
    marginTop: rs(8),
    marginBottom: rs(4),
    padding: rs(12),
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: "#2a2e39",
    borderLeftWidth: rs(3),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toastIcon: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  toastTitle: {
    fontFamily: fonts.bold,
    fontSize: rf(13),
    color: "#F3F4F6",
    fontWeight: "700",
  },
  toastMessage: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "#9ca3af",
    lineHeight: rf(15),
  },

  list: { flex: 1 },
  listContent: { paddingTop: rs(8), paddingHorizontal: rs(12) },

  sectionLabel: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "#4a4e5a",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingHorizontal: rs(4),
    marginTop: rs(18),
    marginBottom: rs(6),
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
    marginBottom: rs(2),
    borderRadius: rs(14),
    gap: rs(12),
    borderWidth: 1,
    borderColor: "#1e222b",
    position: "relative",
    overflow: "hidden",
  },

  unreadDot: {
    position: "absolute",
    top: rs(14),
    left: rs(4),
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: colors.primarybtn,
  },

  iconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  rowBody: { flex: 1, gap: rs(3) },
  rowTitle: {
    fontFamily: fonts.bold,
    fontSize: rf(13),
    color: "#F3F4F6",
    fontWeight: "700",
  },
  rowTitleRead: { color: "#6b7280" },
  rowMsg: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#9ca3af",
    lineHeight: rf(18),
  },
  rowTime: {
    fontFamily: fonts.text,
    fontSize: rf(10),
    color: "#4a4e5a",
    marginTop: rs(2),
  },

  typePill: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(20),
    alignSelf: "flex-start",
    flexShrink: 0,
    marginTop: rs(2),
  },
  typeText: {
    fontFamily: fonts.text,
    fontSize: rf(9),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  centerBox: {
    alignItems: "center",
    marginTop: rh(80),
    paddingHorizontal: rs(32),
    gap: rs(12),
  },
  emptyIcon: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: "#1e222b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2e39",
    marginBottom: rs(4),
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: "#F3F4F6",
  },
  emptySub: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: "#6b7280",
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
    backgroundColor: "#1e222b",
    paddingHorizontal: rs(24),
    paddingVertical: rs(10),
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  retryText: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: "#F3F4F6",
  },
});
