import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Mock Razorpay for testing - replace with real import after native build
const mockRazorpayCheckout = {
    open: async (options) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock success response
                resolve({
                    razorpay_payment_id: "pay_" + Math.random().toString(36).substr(2, 9),
                    razorpay_order_id: "order_" + Math.random().toString(36).substr(2, 9),
                    razorpay_signature: "sig_" + Math.random().toString(36).substr(2, 9),
                });
            }, 1500);
        });
    },
};

const CompletePayment = () => {
    const {
        packageName,
        packagePrice,
        selectedDate,
        selectedTime,
        selectedAddons,
    } = useLocalSearchParams();

    const parsedAddons = useMemo(() => {
        if (!selectedAddons) return [];
        try {
            const parsed = JSON.parse(selectedAddons);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }, [selectedAddons]);

    const parseCurrency = (value) => {
        if (!value) return 0;
        const numeric = String(value).replace(/[^0-9.]/g, "");
        const parsed = Number(numeric);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

    const basePrice = useMemo(() => parseCurrency(packagePrice), [packagePrice]);
    const addonsTotal = useMemo(
        () => parsedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0),
        [parsedAddons]
    );
    const subTotal = basePrice + addonsTotal;
    const taxRate = 0.08;
    const taxAmount = subTotal * taxRate;
    const totalAmount = subTotal + taxAmount;

    const [selectedMethod, setSelectedMethod] = useState("card");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const paymentMethods = [
        {
            id: "card",
            title: "Credit Card",
            subtitle: "Visa, Mastercard, Amex",
            icon: "credit-card",
        },
        {
            id: "apple",
            title: "Apple Pay",
            subtitle: "Use your linked Apple Wallet",
            icon: "smartphone",
        },
        {
            id: "google",
            title: "Google Pay",
            subtitle: "Pay with Google Wallet",
            icon: "smartphone",
        },
        {
            id: "cod",
            title: "Cash on Delivery",
            subtitle: "Pay when service is delivered",
            icon: "dollar-sign",
        },
    ];

    const orderDate = selectedDate ? new Date(selectedDate) : null;

    const API_URL = "https://your-api.example.com/bookings";

    const showPopup = (status) => {
        setPaymentStatus(status);
        setTimeout(() => setPaymentStatus(null), 500);
    };

    const saveBooking = async (paymentData) => {
        // Mock API save - remove this condition to enable real API calls
        console.log("Booking saved (mock):", {
            packageName: packageName || "Selected Package",
            packagePrice: packagePrice || "",
            selectedDate: selectedDate || "",
            selectedTime: selectedTime || "",
            addons: parsedAddons,
            subTotal,
            taxAmount,
            totalAmount,
            paymentMethod: selectedMethod,
            paymentData,
        });
        
        // Uncomment below when you have a real API endpoint
        /*
        const API_URL = "https://your-api.example.com/bookings";
        await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        */
    };

    const buildRazorpayOptions = () => {
        const baseOptions = {
            description: "Booking Payment",
            image: "https://i.imgur.com/3g7nmJC.png",
            currency: "INR",
            key: "rzp_test_1234567890",
            amount: Math.round(totalAmount * 100),
            name: "Photo Studio",
            prefill: {
                email: "user@example.com",
                contact: "9999999999",
                name: "Guest",
            },
            theme: { color: colors.gold },
        };

        if (selectedMethod === "card") {
            return {
                ...baseOptions,
                method: { card: true, upi: false, wallet: false, netbanking: false },
            };
        }
        if (selectedMethod === "apple") {
            return {
                ...baseOptions,
                method: { card: true, upi: false, wallet: false, netbanking: false },
                receipt: "receipt_" + Date.now(),
            };
        }
        if (selectedMethod === "google") {
            return {
                ...baseOptions,
                method: { card: true, upi: true, wallet: true, netbanking: true },
                upi: {
                    flow: "intent",
                },
                receipt: "receipt_" + Date.now(),
            };
        }
        return {
            ...baseOptions,
            method: { card: true, upi: true, wallet: true, netbanking: true },
        };
    };

    const handleConfirmPayment = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (selectedMethod === "cod") {
            try {
                await saveBooking({ status: "pending", mode: "cod" });
                showPopup("success");
            } catch (e) {
                showPopup("failed");
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        const options = buildRazorpayOptions();

        try {
            const data = await mockRazorpayCheckout.open(options);
            await saveBooking({ status: "paid", gateway: "razorpay", ...data });
            showPopup("success");
        } catch (error) {
            console.log("Payment error:", error);
            if (typeof error === "string" && error.includes("cancelled")) {
                setIsProcessing(false);
                return;
            }
            showPopup("failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="chevron-left" size={25} color={colors.primarybtn} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Complete Payment</Text>
                </View>
            </View>
            <ScreenWrapper scroll={true} backgroundColor="#000000">
                <View style={styles.container}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardTitle}>Order Summary</Text>

                        <View style={styles.orderRow}>
                            <Text style={styles.orderItem} numberOfLines={1}>
                                {packageName || "Selected Package"}
                            </Text>
                            <Text style={styles.orderPrice}>
                                {formatCurrency(basePrice)}
                            </Text>
                        </View>

                        {parsedAddons.map((addon) => (
                            <View key={addon.id || addon.label} style={styles.orderRowMuted}>
                                <Text style={styles.orderAddon}>{addon.label}</Text>
                                <Text style={styles.orderAddonPrice}>
                                    {formatCurrency(addon.price || 0)}
                                </Text>
                            </View>
                        ))}

                        <View style={styles.cardDivider} />

                        <View style={styles.orderRowMuted}>
                            <Text style={styles.orderAddon}>Subtotal</Text>
                            <Text style={styles.orderAddonPrice}>
                                {formatCurrency(subTotal)}
                            </Text>
                        </View>
                        <View style={styles.orderRowMuted}>
                            <Text style={styles.orderAddon}>Tax (8%)</Text>
                            <Text style={styles.orderAddonPrice}>
                                {formatCurrency(taxAmount)}
                            </Text>
                        </View>
                        <View style={styles.cardDivider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>

                    <View style={styles.metaCard}>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Date</Text>
                            <Text style={styles.metaValue}>
                                {orderDate ? orderDate.toDateString() : ""}
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Time</Text>
                            <Text style={styles.metaValue}>{selectedTime || ""}</Text>
                        </View>
                    </View>

                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                    </View>

                    {paymentMethods.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodCard,
                                    isSelected && styles.methodCardSelected,
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.methodLeft}>
                                    <View
                                        style={[
                                            styles.methodIcon,
                                            isSelected && styles.methodIconSelected,
                                        ]}
                                    >
                                        <Feather
                                            name={method.icon}
                                            size={18}
                                            color={isSelected ? colors.background : colors.subheading}
                                        />
                                    </View>
                                    <View style={styles.methodTextWrapper}>
                                        <Text style={styles.methodTitle}>{method.title}</Text>
                                        <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.methodCheck,
                                        isSelected && styles.methodCheckSelected,
                                    ]}
                                >
                                    {isSelected && (
                                        <Feather
                                            name="check"
                                            size={14}
                                            color={colors.background}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={styles.secureCard}>
                        <Feather name="lock" size={16} color={colors.subheading} />
                        <Text style={styles.secureText}>
                            Your payment is securely processed and encrypted.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.confirmPaymentButton}
                        onPress={handleConfirmPayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={styles.confirmPaymentText}>Confirm Payment</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>

            <Modal transparent visible={!!paymentStatus} animationType="fade">
                <View style={styles.popupBackdrop}>
                    <View style={styles.popupCard}>
                        <Feather
                            name={paymentStatus === "success" ? "check-circle" : "x-circle"}
                            size={32}
                            color={paymentStatus === "success" ? colors.gold : "#ef4444"}
                        />
                        <Text style={styles.popupTitle}>
                            {paymentStatus === "success" ? "Payment Successful" : "Payment Failed"}
                        </Text>
                        <Text style={styles.popupSubtitle}>
                            {paymentStatus === "success"
                                ? "Your booking has been confirmed."
                                : "Please try again or choose another method."}
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default CompletePayment;


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.topbardark,
        marginTop: 30,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    headerTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 20,
    },
    summaryCard: {
        backgroundColor: colors.fill,
        borderRadius: 18,
        padding: spacing.lg,
        gap: spacing.md,
        marginTop: spacing.md,
    },
    cardTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
    },
    orderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderRowMuted: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderItem: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
        maxWidth: "70%",
    },
    orderPrice: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
    },
    orderAddon: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
        maxWidth: "70%",
    },
    orderAddonPrice: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 13,
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#2a3442",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: spacing.xs,
    },
    totalLabel: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
        fontWeight: "700",
    },
    totalValue: {
        color: colors.base,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
    },
    metaCard: {
        backgroundColor: colors.fill,
        borderRadius: 16,
        padding: spacing.md,
        gap: spacing.sm,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metaLabel: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
    },
    metaValue: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
    },
    sectionTitleRow: {
        paddingTop: spacing.xs,
    },
    sectionTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
        fontWeight: "700",
    },
    methodCard: {
        backgroundColor: colors.fill,
        borderRadius: 14,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "transparent",
    },
    methodCardSelected: {
        borderColor: colors.base,
        backgroundColor: "#3A1A1C",
    },
    methodLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        flex: 1,
    },
    methodIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2a3442",
    },
    methodIconSelected: {
        backgroundColor: colors.base,
    },
    methodTextWrapper: {
        flex: 1,
        gap: 2,
    },
    methodTitle: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
    },
    methodSubtitle: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.sxx,
    },
    methodCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    methodCheckSelected: {
        backgroundColor: colors.base,
        borderColor: colors.gold,
    },
    secureCard: {
        backgroundColor: colors.fill,
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    secureText: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: spacing.sxx,
        flex: 1,
    },
    confirmPaymentButton: {
        backgroundColor: colors.primarybtn,
        borderRadius: 14,
        paddingVertical: spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmPaymentText: {
        color: colors.background,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
        fontWeight: "700",
    },
    popupBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
    },
    popupCard: {
        backgroundColor: colors.heading2,
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: "center",
        gap: spacing.sm,
    },
    popupTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 16,
        textAlign: "center",
    },
    popupSubtitle: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: 12,
        textAlign: "center",
        maxWidth: 220,
    },
});