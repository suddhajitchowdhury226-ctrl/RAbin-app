import Footer from "@/components/Footer/FooterScreen";
import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fonts } from "../constants/fonts";
import { useResponsive } from "../constants/useResponsive";

const Dashboard = () => {
    const responsive = useResponsive();
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbar} translucent={false} />
            {/* HEADER */}
            <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={()=>router.push("/profile")}>
                            <Image
                                source={require('../assets/images/rabins-logo.png')}
                                style={styles.logoBox}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        <Text style={styles.title}>Dashboard</Text>
                    </View>

                    <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.bellContainer}>
                        <Feather name="bell" size={22} color={colors.primarybtn} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

            {/* NOTIFICATION MODAL */}
            <Modal
                visible={showNotifications}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowNotifications(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowNotifications(false)}
                >
                    <TouchableOpacity activeOpacity={1}>
                        <View style={styles.notificationPopup}>
                                <View style={styles.notificationHeader}>
                                    <Text style={styles.notificationTitle}>Notifications</Text>
                                    <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                        <Feather name="x" size={20} color={colors.subheading} />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationIconWrap}>
                                            <Feather name="calendar" size={16} color={colors.background} />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={styles.notificationItemTitle}>Booking Confirmed</Text>
                                            <Text style={styles.notificationItemText}>Your Autumn Portrait session has been verified.</Text>
                                            <Text style={styles.notificationTime}>2 hours ago</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.notificationItem, {borderBottomWidth: 0}]}>
                                        <View style={[styles.notificationIconWrap, {backgroundColor: colors.primarybtn}]}>
                                            <Feather name="image" size={16} color={colors.background} />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={styles.notificationItemTitle}>New Gallery Ready</Text>
                                            <Text style={styles.notificationItemText}>Your latest photoshoot gallery is now available to view.</Text>
                                            <Text style={styles.notificationTime}>1 day ago</Text>
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <ScreenWrapper scroll={true}>

                {/* BODY */}
                <View style={styles.container}>

                    {/* UPCOMING BOOKING CARD */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Upcoming Booking</Text>

                        <View style={styles.dateRow}>
                            <Feather name="calendar" size={20} color={colors.subheading} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.dateText}>November 15, 2024</Text>
                                <Text style={styles.timeText}>10:00 AM - 12:00 PM</Text>
                            </View>
                        </View>

                        <Text style={styles.sessionTitle}>Autumn Portrait Session</Text>

                        <View style={styles.locationRow}>
                            <Feather name="map-pin" size={16} color={colors.subheading} />
                            <Text style={styles.locationText}>Central Park</Text>
                        </View>

                        <TouchableOpacity>
                            <LinearGradient
                                colors={['#F5515F', '#FF8E3C']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.primaryBtn}
                            >
                                <Text style={styles.primaryBtnText}>View Details</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* FEATURED SERVICES */}
                    <Text style={styles.sectionTitle}>Featured Services</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>

                        {/* SERVICE CARD */}
                        <View style={styles.serviceCardWrapper}>
                            <View style={styles.serviceCard}>
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e" }}
                                    style={styles.serviceImage}
                                />
                                <View style={styles.overlay} />

                                <View style={styles.serviceContent}>
                                    <Text style={styles.serviceTitle}>Engagement Photoshoot</Text>
                                    <Text style={styles.serviceSub}>Couples</Text>
                                </View>
                            </View>

                            <TouchableOpacity>
                                <LinearGradient
                                    colors={['#F5515F', '#FF8E3C']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.secondaryBtn}
                                >
                                    <Text style={styles.secondaryBtnText}>Explore</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.serviceCardWrapper}>
                            <View style={styles.serviceCard}>
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1519741497674-611481863552" }}
                                    style={styles.serviceImage}
                                />
                                <View style={styles.overlay} />

                                <View style={styles.serviceContent}>
                                    <Text style={styles.serviceTitle}>Outdoor Family Shoot</Text>
                                    <Text style={styles.serviceSub}>Family</Text>
                                </View>
                            </View>

                            <TouchableOpacity>
                                <LinearGradient
                                    colors={['#F5515F', '#FF8E3C']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.secondaryBtn}
                                >
                                    <Text style={styles.secondaryBtnText}>Explore</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>

                    {/* Quick Actions */}
                    <Text style={styles.quicksectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity style={styles.actionCard}>
                            <Feather name="plus" size={32} color={colors.white} />
                            <Text style={styles.actionText} >Book New Session</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <Feather name="package" size={32} color={colors.white} />
                            <Text style={styles.actionText}>View All Packages</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Statistics Summary */}
                    <Text style={styles.sectionTitle}>Statistics Summary</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Earnings</Text>
                            <Text style={styles.statValue}>₹2,300</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Sessions</Text>
                            <Text style={styles.statValue}>128</Text>
                        </View>
                    </View>

                </View>

            </ScreenWrapper>
            <Footer active="home" />
        </>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        backgroundColor: colors.background,
    },

    /* HEADER */
    headerContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        height: 75,
        backgroundColor: colors.headder,
        paddingBottom: 15,
        marginTop: 0,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginLeft: 10,
        marginRight: 10,
        overflow: 'hidden',
    },
    title: {
        fontFamily: fonts.text,
        fontSize: 20,
        color: colors.white,
    },
    
    /* NOTIFICATIONS */
    bellContainer: {
        position: 'relative',
        padding: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.topbar,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    notificationPopup: {
        width: 320,
        backgroundColor: colors.fill,
        borderRadius: 16,
        marginTop: 65,
        marginRight: 16,
        maxHeight: 400,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: "0px 8px 24px rgba(0,0,0,0.8)",
        elevation: 8,
    },
    notificationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    notificationTitle: {
        fontFamily: fonts.heading,
        fontSize: 16,
        color: colors.white,
    },
    notificationItem: {
        flexDirection: "row",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    notificationIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        marginTop: 2,
    },
    notificationContent: {
        flex: 1,
    },
    notificationItemTitle: {
        fontFamily: fonts.heading,
        fontSize: 14,
        color: colors.white,
        marginBottom: 4,
    },
    notificationItemText: {
        fontFamily: fonts.text,
        fontSize: 13,
        color: colors.subheading,
        lineHeight: 18,
        marginBottom: 6,
    },
    notificationTime: {
        fontFamily: fonts.text,
        fontSize: 11,
        color: colors.inactive,
    },

    /* CARD */
    card: {
        backgroundColor: colors.background,
        borderRadius: 18,
        padding: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        boxShadow: "0px 0px 6px #323843",
    },
    cardLabel: {
        fontFamily: fonts.heading,
        fontSize: 18,
        fontWeight: 600,
        color: colors.subheading,
        marginBottom: 15,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    dateText: {
        fontFamily: fonts.text,
        fontSize: 17,
        color: colors.white,
        marginBottom: 4,
    },
    timeText: {
        fontFamily: fonts.text,
        fontSize: 13.5,
        color: colors.white,
    },
    sessionTitle: {
        fontFamily: fonts.heading,
        fontSize: 17,
        fontWeight: "800",
        color: colors.white,
        marginVertical: 8,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    locationText: {
        fontSize: 16,
        marginLeft: 6,
        fontFamily: fonts.text,
        color: colors.white,
    },

    primaryBtn: {
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    primaryBtnText: {
        fontFamily: fonts.text,
        fontSize: 16,
        fontVariant:["bold"],
        fontWeight: "700",
        color: colors.background,
    },

    /* SECTION */
    sectionTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.mx,
        color: colors.white,
        marginBottom: 14,
        letterSpacing: 0.5,
        marginTop: spacing.xs,
    },

    /* SERVICE CARD */
    serviceCardWrapper: {
        marginRight: 16,
        backgroundColor: "#1E2229",
        padding: spacing.sm,
        borderRadius: 18,
    },
    serviceCard: {
        width: 250,
        height: 190,
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: spacing.md,
    },
    serviceImage: {
        width: "100%",
        height: "100%",
        position: "absolute",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    serviceContent: {
        flex: 1,
        justifyContent: "flex-end",
        padding: spacing.md,
    },
    serviceTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        color: colors.white,
    },
    serviceSub: {
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        color: colors.subheading2,
        marginBottom: 8,
    },

    secondaryBtn: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    secondaryBtnText: {
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        fontVariant:["semibold"],
        fontWeight: "700",
        letterSpacing: 1,
        color: colors.background,
    },

    /* QUICK ACTIONS */
      quicksectionTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.mf,
        color: colors.white,
        marginBottom: 10,
        letterSpacing: 0.5,
        marginTop: spacing.md,
    },
    quickActionsContainer: {
        flexDirection: "row",
        gap: 16,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "#2D191B",
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 120,
    },
    actionText: {
        fontFamily: fonts.heading,
        fontSize: 14,
        color: colors.white,
        marginTop: spacing.sx,
        textAlign: "center",
        
    },

    /* STATISTICS */
    statsContainer: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 100,

    },
    statCard: {
        flex: 1,
        backgroundColor: "#1e2229",
        borderRadius: 16,
        padding: spacing.md,
        paddingVertical: spacing.lg,
    },
    statLabel: {
        fontFamily: fonts.text,
        fontSize: spacing.md,
        color: "#BDC2CB",
        marginBottom: 8,
    },
    statValue: {
        fontFamily: fonts.heading,
        fontSize: 24,
        color: "#FF8E3C",
    },
});
