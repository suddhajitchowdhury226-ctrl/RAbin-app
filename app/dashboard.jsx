import Footer from "@/components/Footer/FooterScreen";
import { PageWrapper } from "@/components/PageLoader";
import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { rf, rh, rs, SCREEN_W } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../constants/fonts";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { API_BASE, bookingsApi } from "../services/api";

const BANNER_WIDTH = SCREEN_W - rs(32);

const OFFER_BANNERS = [
  {
    id: "1",
    title: "20% OFF — Wedding Shoots",
    subtitle: "Book before March 31 & save big on your big day!",
    tag: "LIMITED TIME",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    gradient: ["#F5515F", "#9F041B"],
  },
  {
    id: "2",
    title: "Family Package — ₹4,999",
    subtitle: "Up to 2 hrs of outdoor family photography.",
    tag: "BEST VALUE",
    image: "https://images.unsplash.com/photo-1484665754804-74b091211472?w=800",
    gradient: ["#1a1a2e", "#16213e"],
  },
  {
    id: "3",
    title: "New — Maternity Sessions",
    subtitle: "Celebrate your journey with a premium maternity shoot.",
    tag: "JUST LAUNCHED",
    image: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800",
    gradient: ["#4a1942", "#c36a2d"],
  },
  {
    id: "4",
    title: "Corporate Headshots",
    subtitle: "Professional portraits for your team — starting ₹999.",
    tag: "CORPORATE",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800",
    gradient: ["#0f2027", "#203a43"],
  },
  {
    id: "5",
    title: "Refer & Earn ₹500",
    subtitle: "Invite a friend and get ₹500 off your next session!",
    tag: "REFERRAL OFFER",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800",
    gradient: ["#134e5e", "#71b280"],
  },
];

const Dashboard = () => {
  const bannerRef = useRef(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [offerBanners, setOfferBanners] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, rs(12));

  // Pulse animation for the "View Our Work" button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.data?.homeSliders?.length > 0) {
        setOfferBanners(
          data.data.homeSliders.map((s, i) => ({
            id: String(i),
            title: s.title || "",
            subtitle: s.link || "",
            tag: "NEW",
            image: s.imageUrl,
            gradient: ["transparent", "rgba(0,0,0,0.75)"],
          })),
        );
      } else {
        setOfferBanners(OFFER_BANNERS);
      }
    } catch {
      setOfferBanners(OFFER_BANNERS);
    }
  }, []);

  const DEFAULT_SERVICES = [
    {
      _id: "d1",
      title: "Engagement Photoshoot",
      category: "Couples",
      coverImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    },
    {
      _id: "d2",
      title: "Outdoor Family Shoot",
      category: "Family",
      coverImage:
        "https://images.unsplash.com/photo-1484665754804-74b091211472",
    },
    {
      _id: "d3",
      title: "Wedding Photography",
      category: "Wedding",
      coverImage:
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
    },
  ];

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/services/trending`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setTrendingServices(data.data);
      } else {
        setTrendingServices(DEFAULT_SERVICES);
      }
    } catch (_) {
      setTrendingServices(DEFAULT_SERVICES);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchTrending();
    // Fetch real active bookings for the home card
    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          // Show only CONFIRMED / IN_PROGRESS / APPROVED ones on home
          const active = data.filter((b) =>
            ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(b.status),
          );
          setActiveBookings(active);
        }
      })
      .catch(() => {});
  }, [fetchSettings, fetchTrending]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (offerBanners.length === 0) return;
      setActiveBanner((prev) => {
        const next = (prev + 1) % offerBanners.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [offerBanners]);

  const onBannerScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveBanner(index);
  };

  const renderBanner = ({ item }) => (
    <View style={styles.bannerSlide}>
      <Image
        source={{ uri: item.image }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bannerContent}>
        <View style={styles.bannerTag}>
          <Text style={styles.bannerTagText}>{item.tag}</Text>
        </View>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <PageWrapper id="dashboard">
      <>
        <StatusBar
          style="light"
          backgroundColor={colors.topbar}
          translucent={false}
        />
        {/* HEADER */}
        <View
          style={[
            styles.headerContainer,
            { paddingTop: topPad, height: topPad + rs(70) + rs(14) },
          ]}
        >
          <View style={styles.headerContent}>
            <Image
              source={require("../assets/images/rabins-logo.png")}
              style={styles.logoBox}
              resizeMode="contain"
            />
            <View style={{ gap: rs(2) }}>
              <Text style={styles.title}>Rabin's Photography</Text>
              <Text style={styles.titleSub}>
                Capture every beautiful moment
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/notification")}
            style={styles.bellContainer}
          >
            <Feather name="bell" size={rs(24)} color={colors.primarybtn} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <ScreenWrapper scroll={true}>
          {/* BODY */}
          <View style={styles.container}>
            {/* OFFER BANNER SLIDER */}
            <View style={styles.bannerWrapper}>
              <FlatList
                ref={bannerRef}
                data={offerBanners}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={onBannerScroll}
                getItemLayout={(_, index) => ({
                  length: BANNER_WIDTH,
                  offset: BANNER_WIDTH * index,
                  index,
                })}
              />
              {/* Dot Indicators */}
              <View style={styles.bannerDots}>
                {offerBanners.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bannerDot,
                      i === activeBanner
                        ? styles.bannerDotActive
                        : styles.bannerDotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* View Our Work button */}
            <Animated.View
              style={{ transform: [{ scale: pulseAnim }], marginBottom: rs(4) }}
            >
              <TouchableOpacity
                onPress={() => router.push("/portfolio")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#2D191B", "#3d1f10"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.portfolioBtn}
                >
                  <Feather
                    name="image"
                    size={rf(16)}
                    color={colors.primarybtn}
                  />
                  <Text style={styles.portfolioBtnText}>View Our Work</Text>
                  <Feather
                    name="arrow-right"
                    size={rf(15)}
                    color={colors.primarybtn}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* UPCOMING BOOKING — only shown when real active bookings exist */}
            {activeBookings.length > 0 &&
              activeBookings.slice(0, 1).map((booking) => {
                const coverImage = booking.serviceId?.coverImage || null;
                const packageName =
                  booking.packageId?.name || booking.serviceId?.title || null;
                const packageTier = booking.packageId?.tier || null;
                const scheduledDate = booking.scheduledDate
                  ? new Date(booking.scheduledDate).toLocaleDateString(
                      "en-IN",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : null;
                const adminStatus = booking.adminStatus || "PENDING";
                const statusColor =
                  adminStatus === "APPROVED"
                    ? "#4ade80"
                    : adminStatus === "REJECTED"
                      ? "#f87171"
                      : "#a78bfa";
                const statusLabel =
                  adminStatus === "APPROVED"
                    ? "Approved"
                    : adminStatus === "REJECTED"
                      ? "Rejected"
                      : "Awaiting Approval";

                return (
                  <View style={styles.card} key={booking._id}>
                    {/* Header row */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardLabel}>Upcoming Booking</Text>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            borderColor: statusColor + "55",
                            backgroundColor: statusColor + "18",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: statusColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: statusColor },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Image + details side by side */}
                    <View style={styles.cardBody}>
                      {coverImage ? (
                        <Image
                          source={{ uri: coverImage }}
                          style={styles.cardThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.cardThumb,
                            styles.cardThumbPlaceholder,
                          ]}
                        >
                          <Feather
                            name="camera"
                            size={rf(20)}
                            color="#3a3e4a"
                          />
                        </View>
                      )}

                      <View style={styles.cardInfo}>
                        {packageName && (
                          <Text style={styles.sessionTitle} numberOfLines={2}>
                            {packageName}
                          </Text>
                        )}
                        {packageTier && (
                          <View style={styles.tierPill}>
                            <Text style={styles.tierPillText}>
                              {packageTier}
                            </Text>
                          </View>
                        )}
                        {scheduledDate && (
                          <View style={styles.dateRow}>
                            <Feather
                              name="calendar"
                              size={rf(13)}
                              color={colors.subheading}
                            />
                            <Text style={styles.dateText}>
                              {scheduledDate}
                              {booking.scheduledTime
                                ? `  ·  ${booking.scheduledTime}`
                                : ""}
                            </Text>
                          </View>
                        )}
                        {!!booking.venue && (
                          <View style={styles.locationRow}>
                            <Feather
                              name="map-pin"
                              size={rf(13)}
                              color={colors.subheading}
                            />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {booking.venue}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* View Details button → ordertracking */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push("/details/ordertracking")}
                    >
                      <LinearGradient
                        colors={["#F5515F", "#FF8E3C"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryBtn}
                      >
                        <Text style={styles.primaryBtnText}>View Details</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })}

            {/* TRENDING SERVICES */}
            <Text style={styles.sectionTitle}>Trending Services</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingServices.map((service) => (
                <View key={service._id} style={styles.serviceCardWrapper}>
                  <View style={styles.serviceCard}>
                    <Image
                      source={{ uri: service.coverImage }}
                      style={styles.serviceImage}
                    />
                    <View style={styles.overlay} />
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <Text style={styles.serviceSub}>{service.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/details/servicedetails",
                        params: {
                          image: service.coverImage || "",
                          title: service.title || "",
                          badge: service.badge || "",
                          slug: service.slug || "",
                        },
                      })
                    }
                  >
                    <LinearGradient
                      colors={["#F5515F", "#FF8E3C"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryBtnText}>Explore</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Quick Actions */}
            <Text style={styles.quicksectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/details/custombooking")}
              >
                <Feather name="plus" size={rf(32)} color={colors.white} />
                <Text style={styles.actionText}>Customize Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/services")}
              >
                <Feather name="package" size={rf(32)} color={colors.white} />
                <Text style={styles.actionText}>View All Packages</Text>
              </TouchableOpacity>
            </View>

            {/* Refer & Earn — Coming Soon */}
            <Text style={styles.sectionTitle}>Refer & Earn</Text>
            <View style={styles.referComingSoonCard}>
              {/* Lock icon + badge */}
              <View style={styles.referCSTop}>
                <View style={styles.referCSIconWrap}>
                  <Feather name="gift" size={rf(28)} color="#a78bfa" />
                </View>
                <View style={styles.referCSBadge}>
                  <Feather name="lock" size={rf(10)} color="#a78bfa" />
                  <Text style={styles.referCSBadgeText}>Coming Soon</Text>
                </View>
              </View>

              {/* Title + description */}
              <Text style={styles.referCSTitle}>
                Refer & Earn is on its way!
              </Text>
              <Text style={styles.referCSSub}>
                Invite friends, earn coins, and redeem them for discounts on
                your next booking. Launching very soon.
              </Text>

              {/* Teaser stat pills */}
              <View style={styles.referCSPills}>
                <View style={styles.referCSPill}>
                  <Feather name="award" size={rf(13)} color="#f59e0b" />
                  <Text style={styles.referCSPillText}>
                    100 coins per referral
                  </Text>
                </View>
                <View style={styles.referCSPill}>
                  <Feather name="dollar-sign" size={rf(13)} color="#4ade80" />
                  <Text style={styles.referCSPillText}>1 coin = ₹1</Text>
                </View>
              </View>

              {/* Disabled button */}
              <View style={styles.referCSBtn}>
                <Feather name="lock" size={rf(14)} color="#555" />
                <Text style={styles.referCSBtnText}>
                  Invite Friends & Earn — Coming Soon
                </Text>
              </View>
            </View>
          </View>
        </ScreenWrapper>
        <Footer active="home" />
      </>
    </PageWrapper>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    padding: rs(16),
    backgroundColor: colors.background,
  },
  bannerWrapper: { marginBottom: rs(20) },
  bannerSlide: {
    width: BANNER_WIDTH,
    height: rh(170),
    borderRadius: rs(16),
    overflow: "hidden",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerContent: { flex: 1, justifyContent: "flex-end", padding: rs(14) },
  bannerTag: {
    backgroundColor: "#FF8E3C",
    alignSelf: "flex-start",
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(6),
    marginBottom: rs(6),
  },
  bannerTagText: {
    fontFamily: fonts.heading,
    fontSize: rf(10),
    color: colors.white,
    textTransform: "uppercase",
  },
  bannerTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(16),
    color: colors.white,
    marginBottom: rs(3),
  },
  bannerSubtitle: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "rgba(255,255,255,0.8)",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: rs(10),
  },
  bannerDot: { height: rs(6), borderRadius: rs(3), marginHorizontal: rs(3) },
  bannerDotActive: { width: rs(18), backgroundColor: "#FF8E3C" },
  bannerDotInactive: { width: rs(6), backgroundColor: "rgba(255,255,255,0.3)" },

  portfolioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    borderRadius: rs(14),
    paddingVertical: rs(13),
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.25)",
  },
  portfolioBtnText: {
    color: colors.white,
    fontSize: rf(14),
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: rs(12),
    paddingBottom: rs(14),
    backgroundColor: colors.headder,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: rs(6),
  },
  logoBox: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    marginHorizontal: rs(8),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,142,60,0.25)",
  },
  title: {
    fontFamily: fonts.subheading,
    fontSize: rf(20),
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  titleSub: {
    fontFamily: fonts.text,
    fontSize: rf(11.5),
    color: colors.inactive,
    letterSpacing: 0.2,
  },
  bellContainer: {
    position: "relative",
    width: rs(46),
    height: rs(46),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rs(23),
    marginBottom: rs(2),
  },
  notificationBadge: {
    position: "absolute",
    top: rs(8),
    right: rs(9),
    width: rs(9),
    height: rs(9),
    borderRadius: rs(5),
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.headder,
  },

  card: {
    backgroundColor: colors.background,
    borderRadius: rs(16),
    padding: rs(16),
    marginTop: rs(4),
    marginBottom: rs(16),
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs(12),
  },
  cardLabel: {
    fontFamily: fonts.heading,
    fontSize: rf(15),
    color: colors.subheading,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(5),
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(20),
    borderWidth: 1,
  },
  statusDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },
  statusPillText: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    gap: rs(12),
    marginBottom: rs(14),
  },
  cardThumb: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(12),
    flexShrink: 0,
  },
  cardThumbPlaceholder: {
    backgroundColor: "#12151b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  cardInfo: {
    flex: 1,
    gap: rs(5),
  },
  tierPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,142,60,0.1)",
    borderRadius: rs(6),
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.25)",
  },
  tierPillText: {
    fontFamily: fonts.bold,
    fontSize: rf(10),
    color: colors.primarybtn,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  dateText: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#BDC1CA",
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  locationText: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#BDC1CA",
    flex: 1,
  },
  sessionTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(14),
    color: colors.white,
    lineHeight: rf(20),
  },
  primaryBtn: {
    paddingVertical: rs(12),
    borderRadius: rs(12),
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: rf(14),
    fontWeight: "700",
    color: colors.background,
  },

  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(18),
    color: colors.white,
    marginBottom: rs(12),
    letterSpacing: 0.5,
    marginTop: rs(4),
  },
  quicksectionTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(16),
    color: colors.white,
    marginBottom: rs(8),
    letterSpacing: 0.5,
    marginTop: rs(12),
  },

  serviceCardWrapper: {
    marginRight: rs(14),
    backgroundColor: "#1E2229",
    padding: rs(8),
    borderRadius: rs(16),
  },
  serviceCard: {
    width: SCREEN_W * 0.62,
    height: rh(170),
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(10),
  },
  serviceImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  serviceContent: { flex: 1, justifyContent: "flex-end", padding: rs(12) },
  serviceTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(14),
    color: colors.white,
  },
  serviceSub: {
    fontFamily: fonts.heading,
    fontSize: rf(13),
    color: colors.subheading2,
    marginBottom: rs(6),
  },
  secondaryBtn: {
    paddingVertical: rs(10),
    borderRadius: rs(10),
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: fonts.heading,
    fontSize: rf(14),
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.background,
  },

  quickActionsContainer: {
    flexDirection: "row",
    gap: rs(14),
    marginTop: rs(12),
    marginBottom: rs(16),
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#2D191B",
    borderRadius: rs(14),
    padding: rs(20),
    alignItems: "center",
    justifyContent: "center",
    minHeight: rh(110),
  },
  actionText: {
    fontFamily: fonts.heading,
    fontSize: rf(13),
    color: colors.white,
    marginTop: rs(10),
    textAlign: "center",
  },

  statsContainer: { flexDirection: "row", gap: rs(14), marginBottom: rh(100) },
  statCard: {
    backgroundColor: "#1e2229",
    borderRadius: rs(14),
    padding: rs(16),
    paddingVertical: rs(18),
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    marginBottom: rs(6),
  },
  statLabel: { fontFamily: fonts.text, fontSize: rf(12), color: "#BDC2CB" },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: rf(22),
    color: "#FF8E3C",
    marginBottom: rs(2),
  },
  statSub: { fontFamily: fonts.text, fontSize: rf(11), color: "#666" },

  referComingSoonCard: {
    backgroundColor: "#1e2229",
    borderRadius: rs(14),
    padding: rs(16),
    marginBottom: rh(100),
    gap: rs(14),
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  referCSTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  referCSIconWrap: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(26),
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  referCSBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rs(20),
  },
  referCSBadgeText: {
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "#a78bfa",
    fontWeight: "600",
  },
  referCSTitle: {
    fontFamily: fonts.heading,
    fontSize: rf(16),
    color: "#e2d9f3",
  },
  referCSSub: {
    fontFamily: fonts.text,
    fontSize: rf(13),
    color: "#666",
    lineHeight: rf(19),
  },
  referCSPills: {
    flexDirection: "row",
    gap: rs(10),
    flexWrap: "wrap",
  },
  referCSPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(5),
    backgroundColor: "#111318",
    borderRadius: rs(20),
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  referCSPillText: {
    fontFamily: fonts.text,
    fontSize: rf(12),
    color: "#888",
  },
  referCSBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    backgroundColor: "#1a1a1a",
    borderRadius: rs(12),
    paddingVertical: rs(13),
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  referCSBtnText: {
    fontFamily: fonts.subheading,
    fontSize: rf(13),
    color: "#555",
  },
});
