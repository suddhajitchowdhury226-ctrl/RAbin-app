import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingDetails() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const booking = {
        id: "b1",
        title: "Autumn Portrait Session",
        status: "Confirmed",
        date: "November 15, 2024",
        time: "10:00 AM - 12:00 PM",
        location: "Central Park, NY",
        photographer: "Rabin Photography",
        package: "Premium Outdoor Package",
        amountPaid: "₹2,500",
        amountDue: "₹2,499",
        image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="transparent" translucent={true} />
            
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* HERO IMAGE SECTION */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: booking.image }} style={styles.heroImage} resizeMode="cover" />
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.8)", "#0a0a0a"]}
                        style={StyleSheet.absoluteFill}
                    />
                    
                    {/* BACK BUTTON */}
                    <TouchableOpacity 
                        style={[styles.backBtn, { top: Math.max(insets.top, 20) + 10 }]} 
                        onPress={() => router.back()}
                    >
                        <Feather name="chevron-left" size={24} color={colors.white} />
                    </TouchableOpacity>

                    <View style={styles.heroContent}>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>{booking.status}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{booking.title}</Text>
                        <Text style={styles.heroSubtitle}>{booking.package}</Text>
                    </View>
                </View>

                {/* DETAILS CONTENT */}
                <View style={styles.content}>

                    {/* Quick Info Grid */}
                    <View style={styles.gridContainer}>
                        <View style={styles.gridItem}>
                            <View style={styles.iconBox}>
                                <Feather name="calendar" size={20} color="#FF8E3C" />
                            </View>
                            <View>
                                <Text style={styles.gridLabel}>Date</Text>
                                <Text style={styles.gridValue}>{booking.date}</Text>
                            </View>
                        </View>

                        <View style={styles.gridItem}>
                            <View style={styles.iconBox}>
                                <Feather name="clock" size={20} color="#FF8E3C" />
                            </View>
                            <View>
                                <Text style={styles.gridLabel}>Time</Text>
                                <Text style={styles.gridValue}>{booking.time}</Text>
                            </View>
                        </View>

                        <View style={styles.gridItem}>
                            <View style={styles.iconBox}>
                                <Feather name="map-pin" size={20} color="#FF8E3C" />
                            </View>
                            <View>
                                <Text style={styles.gridLabel}>Location</Text>
                                <Text style={styles.gridValue}>{booking.location}</Text>
                            </View>
                        </View>

                        <View style={styles.gridItem}>
                            <View style={styles.iconBox}>
                                <Feather name="camera" size={20} color="#FF8E3C" />
                            </View>
                            <View>
                                <Text style={styles.gridLabel}>Photographer</Text>
                                <Text style={styles.gridValue}>{booking.photographer}</Text>
                            </View>
                        </View>
                    </View>

                    {/* PAYMENT SUMMARY */}
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Package Total</Text>
                            <Text style={styles.paymentValue}>₹4,999</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Amount Paid</Text>
                            <Text style={styles.paymentValue}>{booking.amountPaid}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentTotalLabel}>Amount Due</Text>
                            <Text style={styles.paymentTotalValue}>{booking.amountDue}</Text>
                        </View>
                        <Text style={styles.paymentHint}>Due 24 hours before your session.</Text>
                    </View>

                    {/* ACTIONS */}
                    <Text style={styles.sectionTitle}>Manage Booking</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Feather name="message-square" size={20} color={colors.white} />
                            <Text style={styles.actionButtonText}>Message Support</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.actionButton, styles.rescheduleBtn]}>
                            <Feather name="calendar" size={20} color={colors.subheading} />
                            <Text style={[styles.actionButtonText, {color: colors.subheading}]}>Reschedule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]}>
                            <Feather name="x-circle" size={20} color="#F5515F" />
                            <Text style={[styles.actionButtonText, {color: "#F5515F"}]}>Cancel Booking</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* FLOATING ACTION BOTTOM */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={{ flex: 1 }}>
                    <LinearGradient
                        colors={['#F5515F', '#FF8E3C']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.ctaButton}
                    >
                        <Text style={styles.ctaButtonText}>Pay Remaining Balance</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a0a",
    },
    heroSection: {
        height: 380,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    backBtn: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 10,
    },
    heroContent: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        color: '#4CAF50',
        fontFamily: fonts.heading,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontFamily: fonts.heading,
        fontSize: 32,
        color: colors.white,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontFamily: fonts.text,
        fontSize: 16,
        color: colors.gold,
    },
    content: {
        padding: spacing.md,
        paddingBottom: 100, // accommodate bottom bar
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: -10,
    },
    gridItem: {
        width: '48%',
        backgroundColor: '#171A1F',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 142, 60, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    gridLabel: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.subheading2,
        marginBottom: 2,
    },
    gridValue: {
        fontFamily: fonts.heading,
        fontSize: 14,
        color: colors.white,
    },
    sectionTitle: {
        fontFamily: fonts.heading,
        fontSize: 18,
        color: colors.white,
        marginTop: 16,
        marginBottom: 16,
    },
    paymentCard: {
        backgroundColor: '#1E2229',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentLabel: {
        fontFamily: fonts.text,
        fontSize: 15,
        color: colors.subheading,
    },
    paymentValue: {
        fontFamily: fonts.subheading,
        fontSize: 15,
        color: colors.white,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    paymentTotalLabel: {
        fontFamily: fonts.heading,
        fontSize: 18,
        color: colors.white,
    },
    paymentTotalValue: {
        fontFamily: fonts.heading,
        fontSize: 22,
        color: '#FF8E3C',
    },
    paymentHint: {
        fontFamily: fonts.text,
        fontSize: 12,
        color: colors.subheading2,
        textAlign: 'center',
        marginTop: 16,
    },
    actionsContainer: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },
    rescheduleBtn: {
        backgroundColor: 'transparent',
    },
    cancelBtn: {
        backgroundColor: 'rgba(245, 81, 95, 0.05)',
        borderColor: 'rgba(245, 81, 95, 0.2)',
    },
    actionButtonText: {
        fontFamily: fonts.heading,
        fontSize: 16,
        color: colors.white,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: spacing.md,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
    },
    ctaButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: fonts.heading,
        fontSize: 16,
        fontWeight: "700",
        color: colors.background,
    },
});
