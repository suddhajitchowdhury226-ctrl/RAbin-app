import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { PageWrapper } from "@/components/PageLoader";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";

const ServiceDetails = () => {
  const { image, title, badge, slug } = useLocalSearchParams();
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [serviceInfo, setServiceInfo] = useState(null);

  const toggleDetail = (detail) => {
    setExpandedDetail(expandedDetail === detail ? null : detail);
  };

  // Fetch full service info + packages from API
  useEffect(() => {
    if (!slug) {
      setLoadingPkgs(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoadingPkgs(true);
        const [pkgRes, svcRes] = await Promise.all([
          fetch(`${API_BASE}/services/${slug}/packages`),
          fetch(`${API_BASE}/services/${slug}`),
        ]);
        const pkgData = await pkgRes.json();
        const svcData = await svcRes.json();
        if (pkgData.success && pkgData.data?.length > 0) {
          setPackages(pkgData.data);
        }
        if (svcData.success && svcData.data) {
          // API returns { service: {...}, packages: [...] } — extract the service object
          setServiceInfo(svcData.data.service || svcData.data);
        }
      } catch (e) {
        console.error("Failed to fetch service data:", e);
      } finally {
        setLoadingPkgs(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleSelectPackage = (pkg) => {
    router.push({
      pathname: "/details/bookservice",
      params: {
        image,
        title,
        badge,
        serviceId: serviceInfo?._id || "",
        packageId: pkg._id || "",
        packageName: pkg.name,
        packagePrice: String(pkg.price),
        packageTier: pkg.tier || "",
        baseDays: String(pkg.baseDays ?? (pkg.tier === "GOLD" ? 4 : 3)),
        razorpayButtonId: pkg.razorpayKeyId || "",
        packageFeatures: JSON.stringify(pkg.features || []),
      },
    });
  };

  return (
    <PageWrapper>
      <>
        <StatusBar style="light" backgroundColor={colors.topbardark} />
        <AppHeader
          title={title || "Wedding Photography"}
          onBack={() => router.back()}
          right={
            <TouchableOpacity style={styles.headerButton}>
              <Feather name="share-2" size={22} color={colors.primarybtn} />
            </TouchableOpacity>
          }
        />
        <ScreenWrapper scroll={true} backgroundColor="#000000">
          <View style={styles.container}>
            {/* Hero Image */}
            <View style={styles.heroImageContainer}>
              {!!image && (
                <Image
                  source={{ uri: image }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <Text style={styles.mainTitle}>
                {serviceInfo?.title || title || "Photography Service"}
              </Text>
              {!!serviceInfo?.description && (
                <Text style={styles.description}>
                  {serviceInfo.description}
                </Text>
              )}

              {/* Feature Tags — badge + category */}
              <View style={styles.tagsContainer}>
                {!!badge && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{badge}</Text>
                  </View>
                )}
                {!!serviceInfo?.category && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {serviceInfo.category.charAt(0) +
                        serviceInfo.category.slice(1).toLowerCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Pricing Tiers */}
            <View style={styles.pricingSection}>
              <Text style={styles.pricingTitle}>Pricing Tiers</Text>

              {loadingPkgs ? (
                <ActivityIndicator
                  color={colors.base}
                  size="large"
                  style={{ marginTop: 20 }}
                />
              ) : packages.length === 0 ? (
                <Text
                  style={{
                    color: colors.subheading,
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  No packages available.
                </Text>
              ) : (
                packages.map((pkg, index) => (
                  <View
                    key={pkg._id}
                    style={[
                      styles.packageCard,
                      index > 0 && styles.packageCardSpacing,
                    ]}
                  >
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packagePrice}>
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </Text>

                    {/* Fixed days pill */}
                    <View style={styles.daysPillRow}>
                      <View style={styles.daysPill}>
                        <Feather
                          name="calendar"
                          size={13}
                          color={colors.base}
                        />
                        <Text style={styles.daysPillText}>
                          {pkg.baseDays ?? (pkg.tier === "GOLD" ? 4 : 3)} days
                          fixed
                        </Text>
                      </View>
                    </View>

                    {pkg.sessionHours > 0 && (
                      <View style={styles.pkgMeta}>
                        <View style={styles.pkgMetaItem}>
                          <Feather
                            name="clock"
                            size={13}
                            color={colors.subheading}
                          />
                          <Text style={styles.pkgMetaText}>
                            {pkg.sessionHours}h session
                          </Text>
                        </View>
                        {pkg.edited > 0 && (
                          <View style={styles.pkgMetaItem}>
                            <Feather
                              name="image"
                              size={13}
                              color={colors.subheading}
                            />
                            <Text style={styles.pkgMetaText}>
                              {pkg.edited}+ photos
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.featuresList}>
                      {(pkg.features || []).map((f, i) => (
                        <View key={i} style={styles.featureItem}>
                          <Feather name="check" size={16} color={colors.base} />
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => handleSelectPackage(pkg)}
                    >
                      <Text style={styles.selectButtonText}>
                        Select Package
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Package Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Package Details</Text>

              {/* Flexible Scheduling */}
              <View style={styles.detailCard}>
                <TouchableOpacity
                  style={styles.detailHeader}
                  onPress={() => toggleDetail("scheduling")}
                >
                  <View style={styles.detailLeft}>
                    <Feather
                      name="calendar"
                      size={22}
                      color={colors.primarybtn}
                    />
                    <Text style={styles.detailTitle}>Flexible Scheduling</Text>
                  </View>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={colors.subheading}
                    style={
                      expandedDetail === "scheduling"
                        ? styles.chevronExpanded
                        : null
                    }
                  />
                </TouchableOpacity>
                {expandedDetail === "scheduling" && (
                  <View style={styles.detailContent}>
                    <Text style={styles.detailText}>
                      We work around your schedule to ensure we capture every
                      important moment of your special day.
                    </Text>
                  </View>
                )}
              </View>

              {/* Professional Equipment */}
              <View style={styles.detailCard}>
                <TouchableOpacity
                  style={styles.detailHeader}
                  onPress={() => toggleDetail("equipment")}
                >
                  <View style={styles.detailLeft}>
                    <Feather
                      name="camera"
                      size={22}
                      color={colors.primarybtn}
                    />
                    <Text style={styles.detailTitle}>
                      Professional Equipment
                    </Text>
                  </View>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={colors.subheading}
                    style={
                      expandedDetail === "equipment"
                        ? styles.chevronExpanded
                        : null
                    }
                  />
                </TouchableOpacity>
                {expandedDetail === "equipment" && (
                  <View style={styles.detailContent}>
                    <Text style={styles.detailText}>
                      High-end cameras, lenses, and lighting equipment to
                      deliver stunning, professional-quality photos.
                    </Text>
                  </View>
                )}
              </View>

              {/* Timeless Editing Style */}
              <View style={styles.detailCard}>
                <TouchableOpacity
                  style={styles.detailHeader}
                  onPress={() => toggleDetail("editing")}
                >
                  <View style={styles.detailLeft}>
                    <Feather name="clock" size={22} color={colors.primarybtn} />
                    <Text style={styles.detailTitle}>
                      Timeless Editing Style
                    </Text>
                  </View>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={colors.subheading}
                    style={
                      expandedDetail === "editing"
                        ? styles.chevronExpanded
                        : null
                    }
                  />
                </TouchableOpacity>
                {expandedDetail === "editing" && (
                  <View style={styles.detailContent}>
                    <Text style={styles.detailText}>
                      Classic, elegant editing that will look beautiful for
                      years to come, never going out of style.
                    </Text>
                  </View>
                )}
              </View>

              {/* Dedicated Support */}
              <View style={styles.detailCard}>
                <TouchableOpacity
                  style={styles.detailHeader}
                  onPress={() => toggleDetail("support")}
                >
                  <View style={styles.detailLeft}>
                    <Feather name="user" size={22} color={colors.primarybtn} />
                    <Text style={styles.detailTitle}>Dedicated Support</Text>
                  </View>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={colors.subheading}
                    style={
                      expandedDetail === "support"
                        ? styles.chevronExpanded
                        : null
                    }
                  />
                </TouchableOpacity>
                {expandedDetail === "support" && (
                  <View style={styles.detailContent}>
                    <Text style={styles.detailText}>
                      Personal assistance from planning to delivery, ensuring a
                      smooth and stress-free experience.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Meet Your Photographer Section */}
            <View style={styles.photographerSection}>
              <Text style={styles.photographerSectionTitle}>
                Meet Your Photographer
              </Text>

              <View style={styles.photographerCard}>
                <View style={styles.photographerHeader}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                    }}
                    style={styles.photographerImage}
                  />
                  <View style={styles.photographerInfo}>
                    <Text style={styles.photographerName}>Rabin Singh</Text>
                    <Text style={styles.photographerRole}>
                      Lead Wedding Photographer
                    </Text>
                  </View>
                </View>

                <Text style={styles.photographerBio}>
                  Rabin is an award-winning photographer with over a decade of
                  experience capturing the magic of weddings. His passion lies
                  in telling unique love stories through candid, emotional, and
                  breathtaking imagery. He believes in creating a comfortable
                  and fun environment to ensure genuine moments are preserved
                  forever.
                </Text>

                <TouchableOpacity style={styles.portfolioButton}>
                  <Text style={styles.portfolioButtonText}>View Portfolio</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Client Reviews */}
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsSectionTitle}>Client Reviews</Text>

              {/* Review 1 */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
                    }}
                    style={styles.reviewerImage}
                  />
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>Sarah & David</Text>
                    <View style={styles.ratingContainer}>
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>Oct 26, 2023</Text>
                </View>
                <Text style={styles.reviewText}>
                  Rabin made our wedding day unforgettable! The photos are
                  absolutely stunning, and he captured every emotion
                  beautifully. Highly recommend his professional and friendly
                  service!
                </Text>
              </View>

              {/* Review 2 */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
                    }}
                    style={styles.reviewerImage}
                  />
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>Jessica L.</Text>
                    <View style={styles.ratingContainer}>
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                      <Feather
                        name="star"
                        size={14}
                        color={colors.gold}
                        fill={colors.gold}
                      />
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>Sep 15, 2023</Text>
                </View>
                <Text style={styles.reviewText}>
                  We are so thrilled with our wedding photos. Rabin has an
                  incredible eye for detail and perfectly captured the essence
                  of our day. The album is a treasure!
                </Text>
              </View>
            </View>
          </View>
        </ScreenWrapper>
      </>
    </PageWrapper>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  heroImageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#1a1a1a",
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
  },
  mainTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.white,
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  description: {
    fontFamily: "ui-sans-regular",
    fontSize: 17,
    letterSpacing: 0.8,
    color: colors.white,
    lineHeight: 25,
    marginBottom: spacing.lg,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: "#395E84",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: fonts.text,
    fontSize: spacing.sx,
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Pricing Section
  pricingSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  pricingTitle: {
    fontFamily: fonts.heading,
    fontSize: spacing.xl,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  packageCard: {
    backgroundColor: "#1E2128",
    borderRadius: 14,
    padding: spacing.lg,
  },
  packageCardSpacing: {
    marginTop: spacing.lg,
  },
  pkgMeta: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  pkgMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pkgMetaText: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  daysPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
  },
  daysPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,142,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  daysPillText: { color: colors.base, fontFamily: fonts.medium, fontSize: 12 },
  packageName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  packagePrice: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.base,
    marginBottom: spacing.lg,
  },
  featuresList: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    color: colors.white,
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.base,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  selectButtonText: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // Package Details Section
  detailsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  detailsTitle: {
    fontFamily: fonts.heading,
    fontSize: spacing.xl,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  detailCard: {
    backgroundColor: "#1E2128",
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  detailTitle: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    color: colors.white,
    fontWeight: "600",
    flex: 1,
  },
  chevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  detailContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 0,
  },
  detailText: {
    fontFamily: fonts.body,
    fontSize: spacing.sm,
    color: "#fff",
    lineHeight: 20,
  },

  // Meet Your Photographer Section
  photographerSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  photographerSectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    fontWeight: "600",
    color: colors.white,
    marginBottom: spacing.lg,
  },
  photographerCard: {
    backgroundColor: "#1E2128",
    borderRadius: 16,
    padding: spacing.lg,
  },
  photographerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  photographerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1a1a1a",
  },
  photographerInfo: {
    flex: 1,
  },
  photographerName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.white,
    marginBottom: 4,
  },
  photographerRole: {
    fontFamily: fonts.text,
    fontSize: spacing.sxx,
    color: colors.subheading,
  },
  photographerBio: {
    fontFamily: fonts.text,
    fontSize: spacing.md,
    color: colors.subheading,
    lineHeight: 22,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  portfolioButton: {
    borderWidth: 1.5,
    borderColor: colors.base,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  portfolioButtonText: {
    fontFamily: fonts.heading,
    fontSize: spacing.md,
    color: colors.base,
  },

  // Client Reviews Section
  reviewsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  reviewsSectionTitle: {
    fontFamily: fonts.heading,
    fontSize: spacing.xl,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  reviewCard: {
    backgroundColor: "#1E2128",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  reviewerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a1a1a",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.white,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontFamily: fonts.text,
    fontSize: spacing.sxx,
    color: colors.subheading,
  },
  reviewText: {
    fontFamily: fonts.text,
    fontSize: spacing.md,
    color: colors.subheading,
    lineHeight: 22,
  },
});
