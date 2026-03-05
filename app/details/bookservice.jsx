import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BookService = () => {
    const {
        image,
        title,
        badge,
        packageName,
        packagePrice,
        packageFeatures,
    } = useLocalSearchParams();

    const parsedFeatures = useMemo(() => {
        if (!packageFeatures) return [];
        try {
            const parsed = JSON.parse(packageFeatures);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }, [packageFeatures]);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState([]);

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timeSlots = [
        "9:00 AM",
        "9:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "12:30 PM",
        "1:00 PM",
    ];
    const addons = [
        { id: "retouch", label: "Extra Retouches (10 photos)", price: 75 },
        { id: "location", label: "Additional Location", price: 150 },
        { id: "album", label: "Premium Photo Album", price: 200 },
        { id: "prints", label: "Large Format Prints (5 pcs)", price: 90 },
        { id: "drone2", label: "Extra Drone Coverage (2 drones)", price: 250 },
        { id: "drone5", label: "Extra Drone Coverage (5+ drones)", price: 450 },
        { id: "video8k", label: "8K Camera Video Recording", price: 500 },
        { id: "video4k", label: "4K Video Recording", price: 300 },
        { id: "express", label: "Express Delivery (48 hours)", price: 120 },
        { id: "makeup", label: "Professional Makeup Artist", price: 180 },
        { id: "hair", label: "Professional Hair Stylist", price: 150 },
        { id: "lighting", label: "Advanced Lighting Setup", price: 220 },
        { id: "wardrobe", label: "Wardrobe Consultation", price: 130 },
    ];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const totalCells = 42;
        const days = [];
        for (let i = 0; i < totalCells; i += 1) {
            const dayNumber = i - firstDayOfMonth + 1;
            if (dayNumber > 0 && dayNumber <= daysInMonth) {
                days.push(dayNumber);
            } else {
                days.push(null);
            }
        }
        return days;
    }, [daysInMonth, firstDayOfMonth]);

    const handlePrevMonth = () => {
        const prev = new Date(year, month - 1, 1);
        setCurrentMonth(prev);
    };

    const handleNextMonth = () => {
        const next = new Date(year, month + 1, 1);
        setCurrentMonth(next);
    };

    const handleSelectDate = (day) => {
        if (!day) return;
        setSelectedDate(new Date(year, month, day));
    };

    const isSameDay = (date, day) => {
        if (!day) return false;
        return (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        );
    };

    const toggleAddon = (id) => {
        setSelectedAddons((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        const numeric = String(value).replace(/[^0-9.]/g, "");
        const parsed = Number(numeric);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

    const addonsTotal = useMemo(() => {
        return addons
            .filter((addon) => selectedAddons.includes(addon.id))
            .reduce((sum, addon) => sum + addon.price, 0);
    }, [addons, selectedAddons]);

    const basePrice = useMemo(() => parseCurrency(packagePrice), [packagePrice]);
    const subTotal = basePrice + addonsTotal;
    const taxRate = 0.08;
    const taxAmount = subTotal * taxRate;
    const totalAmount = subTotal + taxAmount;

    const handleContinuePayment = () => {
        const selectedAddonDetails = addons.filter((addon) =>
            selectedAddons.includes(addon.id)
        );

        router.push({
            pathname: "/details/completepayment",
            params: {
                packageName: packageName || "Selected Package",
                packagePrice: packagePrice || "",
                selectedDate: selectedDate.toISOString(),
                selectedTime: selectedTime || "",
                selectedAddons: JSON.stringify(selectedAddonDetails),
            },
        });
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="chevron-left" size={25} color={colors.primarybtn} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Service</Text>
                </View>
            </View>

            <ScreenWrapper scroll={true} backgroundColor="#000000">
                <View style={styles.container}>
                    <View style={styles.summaryCard}>
                        {!!image && (
                            <Image
                                source={{ uri: image }}
                                style={styles.summaryImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryTitle} numberOfLines={1}>
                                {title || "Selected Service"}
                            </Text>
                            {!!badge && (
                                <Text style={styles.summaryBadge}>{badge}</Text>
                            )}
                            <Text style={styles.summaryPackage} numberOfLines={1}>
                                {packageName || "Package"}
                            </Text>
                            <Text style={styles.summaryPrice}>
                                {packagePrice || ""}
                            </Text>
                        </View>
                    </View>

                    {/* {!!parsedFeatures.length && (
                        <View style={styles.featuresCard}>
                            {parsedFeatures.map((feature, index) => (
                                <View key={`${feature}-${index}`} style={styles.featureRow}>
                                    <View style={styles.featureDot} />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    )} */}

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity
                                style={styles.calendarArrow}
                                onPress={handlePrevMonth}
                            >
                                <Feather name="chevron-left" size={20} color={colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.calendarMonth}>
                                {monthNames[month]} {year}
                            </Text>
                            <TouchableOpacity
                                style={styles.calendarArrow}
                                onPress={handleNextMonth}
                            >
                                <Feather name="chevron-right" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekRow}>
                            {weekDays.map((day) => (
                                <Text key={day} style={styles.weekDay}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.daysGrid}>
                            {calendarDays.map((day, index) => {
                                const isSelected = isSameDay(selectedDate, day);
                                return (
                                    <TouchableOpacity
                                        key={`${day}-${index}`}
                                        style={styles.dayCell}
                                        disabled={!day}
                                        onPress={() => handleSelectDate(day)}
                                    >
                                        <View
                                            style={
                                                day
                                                    ? [
                                                          styles.dayCircle,
                                                          isSelected && styles.dayCircleSelected,
                                                      ]
                                                    : styles.dayCircle
                                            }
                                        >
                                            <Text
                                                style={
                                                    day
                                                        ? [
                                                              styles.dayText,
                                                              isSelected && styles.dayTextSelected,
                                                          ]
                                                        : styles.dayText
                                                }
                                            >
                                                {day || ""}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Select Time</Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((time) => {
                                const isSelected = selectedTime === time;
                                return (
                                    <TouchableOpacity
                                        key={time}
                                        style={[
                                            styles.timeSlot,
                                            isSelected && styles.timeSlotSelected,
                                        ]}
                                        onPress={() => setSelectedTime(time)}
                                    >
                                        <Text
                                            style={[
                                                styles.timeText,
                                                isSelected && styles.timeTextSelected,
                                            ]}
                                        >
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Package Add-ons</Text>
                        <View style={styles.addonList}>
                            {addons.map((addon) => {
                                const checked = selectedAddons.includes(addon.id);
                                return (
                                    <TouchableOpacity
                                        key={addon.id}
                                        style={styles.addonRow}
                                        onPress={() => toggleAddon(addon.id)}
                                    >
                                        <View style={styles.addonLeft}>
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    checked && styles.checkboxChecked,
                                                ]}
                                            >
                                                {checked && (
                                                    <Feather
                                                        name="check"
                                                        size={14}
                                                        color={colors.background}
                                                    />
                                                )}
                                            </View>
                                            <Text style={styles.addonLabel}>{addon.label}</Text>
                                        </View>
                                        <Text style={styles.addonPrice}>₹{addon.price.toFixed(2)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Booking Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Package</Text>
                            <Text style={styles.summaryValue} numberOfLines={1}>
                                {packageName || "Selected Package"}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Date</Text>
                            <Text style={styles.summaryValue}>
                                {selectedDate.toDateString()}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Time</Text>
                            <Text style={styles.summaryValue}>
                                {selectedTime || "Select time"}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subTotal)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax (8%)</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryTotalRow}>
                            <Text style={styles.summaryTotalLabel}>Total</Text>
                            <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.paymentButton,
                            !selectedTime && styles.paymentButtonDisabled,
                        ]}
                        disabled={!selectedTime}
                        onPress={handleContinuePayment}
                    >
                        <Text style={styles.paymentButtonText}>Continue Payment</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        </>
    );
};

export default BookService;

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
    addonList: {
        gap: spacing.md,
    },
    addonRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "#2a3442",
    },
    addonLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
        paddingRight: spacing.md,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.subheading,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    checkboxChecked: {
        backgroundColor: colors.base,
        borderColor: colors.base,
    },
    addonLabel: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: 13,
        flex: 1,
    },
    addonPrice: {
        color: colors.base,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
    },
    headerTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 20,
    },
    confirmAddonTotal: {
        color: colors.base,
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        marginTop: 4,
    },
    summaryCard: {
        flexDirection: "row",
        backgroundColor: colors.fill,
        borderRadius: 16,
        padding: spacing.md,
        gap: spacing.md,
        alignItems: "center",
    },
    summaryImage: {
        width: 70,
        height: 70,
        borderRadius: 14,
    },
    summaryContent: {
        flex: 1,
        gap: 4,
    },
    summaryTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 16,
    },
    summaryBadge: {
        color: colors.gold,
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    summaryPackage: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: 14,
    },
    summaryPrice: {
        color: colors.gold,
        fontFamily: fonts.bold,
        fontSize: 14,
    },
    featuresCard: {
        backgroundColor: colors.fill,
        borderRadius: 16,
        padding: spacing.md,
        gap: 8,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    featureDot: {
        width: 6,
        height: 6,
        borderRadius: 6,
        backgroundColor: colors.gold,
    },
    featureText: {
        color: colors.subheading,
        fontFamily: fonts.regular,
        fontSize: 13,
    },
    sectionCard: {
        backgroundColor: colors.fill,
        borderRadius: 18,
        padding: spacing.md,
        gap: spacing.md,
    },
    sectionTitle: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 16,
    },
    calendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    calendarArrow: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.base,
    },
    calendarMonth: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 14,
    },
    weekRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: spacing.xs,
    },
    weekDay: {
        width: "14.28%",
        textAlign: "center",
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: spacing.sm,
    },
    dayCell: {
        width: "14.28%",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleSelected: {
        backgroundColor: colors.base,
    },
    dayText: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    dayTextSelected: {
        color: colors.background,
        fontFamily: fonts.bold,
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    timeSlot: {
        backgroundColor: colors.fill,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
    },
    timeSlotSelected: {
        backgroundColor: colors.base,
    },
    timeText: {
        color: colors.subheading,
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    timeTextSelected: {
        color: colors.background,
        fontFamily: fonts.bold,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryDivider: {
        height: 1,
        backgroundColor: colors.fill,
    },
    summaryLabel: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: spacing.md,
    },
    summaryValue: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 13,
        maxWidth: "60%",
        textAlign: "right",
    },
    summaryTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: spacing.xs,
    },
    summaryTotalLabel: {
        color: colors.subheading2,
        fontFamily: fonts.bold,
        fontSize: 15,
    },
    summaryTotalValue: {
        color: colors.base,
        fontFamily: fonts.bold,
        fontSize: 15,
    },
    confirmCard: {
        backgroundColor: colors.fill,
        borderRadius: 16,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    confirmLabel: {
        color: colors.white,
        fontFamily: fonts.heading,
        fontSize: 12,
    },
    confirmValue: {
        color: colors.textbtn,
        fontFamily: fonts.heading,
        fontSize: 13,
    },
    confirmButton: {
        backgroundColor: colors.primarybtn,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: colors.textbtn,
        fontFamily: fonts.bold,
        fontSize: spacing.md,
    },
    paymentButton: {
        backgroundColor: colors.primarybtn,
        paddingVertical: spacing.md,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    paymentButtonDisabled: {
        opacity: 0.5,
    },
    paymentButtonText: {
        color: "#000",
        fontFamily: fonts.text,
        fontSize: spacing.md,
        fontWeight: "700",
    },
})