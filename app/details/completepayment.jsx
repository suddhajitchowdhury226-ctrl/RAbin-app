import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { PageWrapper } from "@/components/PageLoader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { bookingsApi } from "../../services/api";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";

// ─── Razorpay success URL patterns ───────────────────────────────────────────
// When payment completes, Razorpay redirects the WebView to a success/thank-you URL.
// We detect these to know payment went through without needing a postMessage.
const SUCCESS_URL_PATTERNS = [
  "razorpay.com/payment-link/",
  "pages.razorpay.com",
  "api.razorpay.com",
  "rzp.io",
  "payment_success",
  "payment-success",
  "order_success",
  "/success",
  "thank",
  "thankyou",
  "thank-you",
  "confirmed",
  "paid",
];

const CompletePayment = () => {
  const {
    serviceId,
    packageId,
    packageName,
    packagePrice,
    selectedDate,
    selectedTime,
    outTime,
    additionalDates,
    venue,
    specialNotes,
    selectedAddons,
    totalAmount: totalAmountParam,
    razorpayButtonId,
  } = useLocalSearchParams();

  // ── Parse add-ons ─────────────────────────────────────────────────────────
  const parsedAddons = useMemo(() => {
    if (!selectedAddons) return [];
    try {
      const parsed = JSON.parse(selectedAddons);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [selectedAddons]);

  const parseCurrency = (v) => {
    if (!v) return 0;
    const n = Number(String(v).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };
  const fmt = (n) => `₹${Number(n).toFixed(2)}`;

  const basePrice = useMemo(() => parseCurrency(packagePrice), [packagePrice]);
  const addonsTotal = useMemo(
    () => parsedAddons.reduce((s, a) => s + (a.price || 0), 0),
    [parsedAddons],
  );
  const subTotal = basePrice + addonsTotal;

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState(null);

  const totalAmount = Math.max(0, subTotal - appliedDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const coupon = data.data;
        const discount = Math.min(
          subTotal * (coupon.discountPercent / 100),
          coupon.maxDiscount || Infinity,
        );
        setAppliedDiscount(discount);
        setCouponMessage({
          type: "success",
          text: `${coupon.discountPercent}% off applied! Saved ₹${discount.toFixed(2)}`,
        });
      } else {
        setAppliedDiscount(0);
        setCouponMessage({
          type: "error",
          text: data.message || "Invalid or expired coupon code.",
        });
      }
    } catch {
      setCouponMessage({
        type: "error",
        text: "Could not validate coupon. Try again.",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedDiscount(0);
    setCouponMessage(null);
  };

  // ── Payment state ─────────────────────────────────────────────────────────
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false); // "did it go through?"
  const webViewRef = useRef(null);
  const paymentHandledRef = useRef(false); // prevent double-firing

  const orderDate = selectedDate ? new Date(selectedDate) : null;

  // ── Create booking record on server after payment confirmed ───────────────
  const createBookingAfterPayment = async () => {
    try {
      const addons = parsedAddons.map((a) => ({
        addonId: a.addonId || a._id || "",
        name: a.name || "",
        price: a.price || 0,
      }));
      const extraDates = (() => {
        try {
          return JSON.parse(additionalDates || "[]");
        } catch {
          return [];
        }
      })();

      const booking = await bookingsApi.create({
        serviceId: serviceId || undefined,
        packageId: packageId || undefined,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime || "",
        outTime: outTime || "",
        additionalDates: extraDates,
        venue: venue || "",
        specialNotes: specialNotes || "",
        addons,
        totalAmount: totalAmount, // fallback for custom bookings
      });
      // Return the short booking reference (last 6 chars of _id, uppercased)
      return booking?._id ? booking._id.slice(-6).toUpperCase() : null;
    } catch (err) {
      console.error(
        "[completepayment] bookingsApi.create FAILED:",
        err.message,
        err,
      );
      return null;
    }
  };

  // ── Full-screen result state ──────────────────────────────────────────────
  // null | 'creating' | 'success' | 'failed'
  const [resultScreen, setResultScreen] = useState(null);
  const [bookingRef, setBookingRef] = useState(null); // e.g. "ABC123"

  // ── Handle payment success ────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    if (paymentHandledRef.current) return;
    paymentHandledRef.current = true;
    setShowPayment(false);
    setResultScreen("creating");
    const ref = await createBookingAfterPayment();
    setBookingRef(ref);
    setResultScreen("success");
  };

  // ── WebView URL watcher — detects Razorpay redirect after payment ─────────
  const onNavigationStateChange = (navState) => {
    if (paymentHandledRef.current) return;
    const url = (navState.url || "").toLowerCase();
    const title = (navState.title || "").toLowerCase();
    const isSuccess =
      SUCCESS_URL_PATTERNS.some((p) => url.includes(p)) ||
      title.includes("success") ||
      title.includes("thank");
    if (isSuccess) handlePaymentSuccess();
  };

  // ── postMessage listener (custom integrations / fallback) ─────────────────
  const onWebViewMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "PAYMENT_SUCCESS") {
        handlePaymentSuccess();
      } else if (msg.type === "PAYMENT_FAILED") {
        if (paymentHandledRef.current) return;
        paymentHandledRef.current = true;
        setShowPayment(false);
        setResultScreen("failed");
      }
    } catch (_) {}
  };

  // ── Razorpay Payment Button HTML ──────────────────────────────────────────
  const razorpayHtml = useMemo(() => {
    const btnId = (razorpayButtonId || "").trim();
    if (!btnId) return null;
    if (btnId === "RAZORPAY_ME") return "RAZORPAY_ME";
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d0d0d;display:flex;flex-direction:column;align-items:center;
         justify-content:flex-start;min-height:100vh;padding:24px 20px;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .card{background:#1a1a1a;border-radius:16px;padding:20px;width:100%;
          max-width:420px;border:1px solid #2a2a2a;margin-bottom:24px}
    .label{color:#888;font-size:12px;margin-bottom:4px}
    .value{color:#fff;font-size:16px;font-weight:700}
    .amount{color:#ff8e3c;font-size:28px;font-weight:800;margin-top:8px}
    .divider{height:1px;background:#2a2a2a;margin:14px 0}
    h3{color:#fff;font-size:13px;font-weight:600;margin-bottom:16px;
       letter-spacing:.5px;text-transform:uppercase}
    .rzp-btn-wrap form{width:100%}
    .rzp-btn-wrap form button,
    .rzp-btn-wrap form input[type=button],
    .rzp-btn-wrap form input[type=submit]{
      width:100%!important;padding:16px!important;font-size:16px!important;
      font-weight:700!important;border-radius:12px!important;
      background:#ff8e3c!important;color:#000!important;border:none!important;cursor:pointer!important}
    .secure{color:#555;font-size:11px;text-align:center;margin-top:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="label">Package</div>
    <div class="value">${(packageName || "Selected Package").replace(/</g, "&lt;")}</div>
    <div class="amount">₹${Number(totalAmount).toLocaleString("en-IN")}</div>
    <div class="divider"></div>
    <div class="label">Date</div>
    <div class="value" style="font-size:14px">${selectedDate ? new Date(selectedDate).toDateString() : ""}</div>
  </div>
  <div style="width:100%;max-width:420px">
    <h3>Pay Securely</h3>
    <div class="rzp-btn-wrap">
      <form>
        <script src="https://checkout.razorpay.com/v1/payment-button.js"
                data-payment_button_id="${btnId}" async></script>
      </form>
    </div>
    <div class="secure">🔒 Secured by Razorpay · SSL Encrypted</div>
  </div>
</body>
</html>`;
  }, [razorpayButtonId, packageName, totalAmount, selectedDate]);

  const handlePayNow = () => {
    if (!razorpayButtonId?.trim()) {
      return;
    }
    paymentHandledRef.current = false; // reset for a fresh attempt
    setShowPayment(true);
  };

  // ── Called when user taps ✕ on the WebView modal ──────────────────────────
  // If payment was already auto-detected, do nothing.
  // Otherwise show the confirmation sheet so user can tell us what happened.
  const handleWebViewClose = () => {
    if (paymentHandledRef.current) {
      // Already handled (success/failure auto-detected) — just close
      setShowPayment(false);
      return;
    }
    // Payment outcome unknown — ask the user
    setShowPayment(false);
    setShowConfirmSheet(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <>
        <StatusBar style="light" backgroundColor={colors.topbardark} />
        <AppHeader
          title="Complete Payment"
          onBack={() => router.back()}
          bgColor={colors.topbardark}
        />

        <ScreenWrapper scroll backgroundColor="#000000">
          <View style={styles.container}>
            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <View style={styles.orderRow}>
                <Text style={styles.orderItem} numberOfLines={1}>
                  {packageName || "Selected Package"}
                </Text>
                <Text style={styles.orderPrice}>{fmt(basePrice)}</Text>
              </View>
              {parsedAddons.map((addon, i) => (
                <View key={addon._id || i} style={styles.orderRowMuted}>
                  <Text style={styles.orderAddon}>
                    {addon.name || addon.label}
                  </Text>
                  <Text style={styles.orderAddonPrice}>
                    {fmt(addon.price || 0)}
                  </Text>
                </View>
              ))}
              <View style={styles.cardDivider} />
              <View style={styles.orderRowMuted}>
                <Text style={styles.orderAddon}>Subtotal</Text>
                <Text style={styles.orderAddonPrice}>{fmt(subTotal)}</Text>
              </View>
              {appliedDiscount > 0 && (
                <View style={styles.orderRowMuted}>
                  <Text style={[styles.orderAddon, { color: colors.gold }]}>
                    Discount
                  </Text>
                  <Text
                    style={[styles.orderAddonPrice, { color: colors.gold }]}
                  >
                    -{fmt(appliedDiscount)}
                  </Text>
                </View>
              )}
              <View style={styles.cardDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{fmt(totalAmount)}</Text>
              </View>
            </View>

            {/* Date / Time meta */}
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {orderDate ? orderDate.toDateString() : "—"}
                </Text>
              </View>
              {!!selectedTime && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Time</Text>
                  <Text style={styles.metaValue}>{selectedTime}</Text>
                </View>
              )}
              {!!venue && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Venue</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>
                    {venue}
                  </Text>
                </View>
              )}
            </View>

            {/* Coupon */}
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
            <View style={styles.couponContainer}>
              <View style={styles.couponInputWrapper}>
                <Feather name="tag" size={18} color={colors.subheading} />
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor={colors.subheading}
                  value={couponCode}
                  onChangeText={(t) => {
                    setCouponCode(t);
                    if (couponMessage) setCouponMessage(null);
                  }}
                  editable={appliedDiscount === 0}
                  autoCapitalize="characters"
                />
              </View>
              {appliedDiscount > 0 ? (
                <TouchableOpacity
                  style={styles.removeCouponBtn}
                  onPress={handleRemoveCoupon}
                >
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.applyCouponBtn}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyCouponText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
            {!!couponMessage && (
              <Text
                style={[
                  styles.couponMsg,
                  couponMessage.type === "error"
                    ? styles.couponError
                    : styles.couponSuccess,
                ]}
              >
                {couponMessage.text}
              </Text>
            )}

            {/* Pay button */}
            {!razorpayButtonId ? (
              <View style={styles.noKeyCard}>
                <Feather name="alert-circle" size={20} color="#f87171" />
                <Text style={styles.noKeyText}>
                  Payment not configured for this package yet. Please contact
                  support.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePayNow}
                activeOpacity={0.85}
              >
                <Feather name="credit-card" size={18} color="#000" />
                <Text style={styles.payBtnText}>Pay Now</Text>
              </TouchableOpacity>
            )}

            <View style={styles.secureCard}>
              <Feather name="lock" size={14} color={colors.subheading} />
              <Text style={styles.secureText}>
                Secured by Razorpay · SSL Encrypted
              </Text>
            </View>
          </View>
        </ScreenWrapper>

        {/* ── Razorpay WebView Modal ── */}
        <Modal
          visible={showPayment}
          animationType="slide"
          onRequestClose={handleWebViewClose}
        >
          <View style={styles.webviewContainer}>
            <View style={styles.webviewHeader}>
              <TouchableOpacity
                onPress={handleWebViewClose}
                style={styles.webviewClose}
              >
                <Feather name="x" size={22} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.webviewTitle}>Complete Payment</Text>
              <View style={{ width: 40 }} />
            </View>
            {razorpayHtml ? (
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={
                  razorpayHtml === "RAZORPAY_ME"
                    ? { uri: "https://razorpay.me/@nozzearteprivatelimited" }
                    : { html: razorpayHtml }
                }
                onNavigationStateChange={onNavigationStateChange}
                onMessage={onWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.webviewLoader}>
                    <ActivityIndicator size="large" color={colors.primarybtn} />
                    <Text style={styles.webviewLoaderText}>
                      Loading payment…
                    </Text>
                  </View>
                )}
                style={{ flex: 1, backgroundColor: "#0d0d0d" }}
              />
            ) : (
              <View style={styles.webviewLoader}>
                <Text style={styles.webviewLoaderText}>
                  No payment button configured.
                </Text>
              </View>
            )}
          </View>
        </Modal>

        {/* ── Payment Confirmation Sheet ── */}
        {/* Shows when WebView is closed but payment outcome wasn't auto-detected */}
        <Modal
          transparent
          visible={showConfirmSheet}
          animationType="slide"
          onRequestClose={() => setShowConfirmSheet(false)}
        >
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />

              <Feather
                name="help-circle"
                size={44}
                color={colors.primarybtn}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.sheetTitle}>
                Did your payment go through?
              </Text>
              <Text style={styles.sheetSubtitle}>
                Please confirm whether your payment was completed in Razorpay.
              </Text>

              {/* YES — payment done */}
              <TouchableOpacity
                style={styles.sheetBtnYes}
                activeOpacity={0.85}
                onPress={() => {
                  setShowConfirmSheet(false);
                  handlePaymentSuccess();
                }}
              >
                <Feather name="check-circle" size={18} color="#000" />
                <Text style={styles.sheetBtnYesText}>Yes, Payment Done</Text>
              </TouchableOpacity>

              {/* NO — payment not done */}
              <TouchableOpacity
                style={styles.sheetBtnNo}
                activeOpacity={0.85}
                onPress={() => {
                  setShowConfirmSheet(false);
                  setResultScreen("failed");
                }}
              >
                <Feather name="x-circle" size={18} color="#ef4444" />
                <Text style={styles.sheetBtnNoText}>No, Payment Failed</Text>
              </TouchableOpacity>

              {/* RETRY — go back to payment screen */}
              <TouchableOpacity
                style={styles.sheetBtnRetry}
                activeOpacity={0.85}
                onPress={() => {
                  setShowConfirmSheet(false);
                  paymentHandledRef.current = false;
                  setShowPayment(true);
                }}
              >
                <Text style={styles.sheetBtnRetryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Full-screen Payment Result ── */}
        <Modal
          visible={!!resultScreen}
          animationType="fade"
          statusBarTranslucent
        >
          {resultScreen === "creating" ? (
            // ── Processing spinner ──────────────────────────────────
            <View style={styles.resultScreen}>
              <ActivityIndicator size="large" color={colors.primarybtn} />
              <Text style={styles.resultTitle}>Processing…</Text>
              <Text style={styles.resultSubtitle}>
                Recording your booking, please wait.
              </Text>
            </View>
          ) : resultScreen === "success" ? (
            // ── Payment Done (green) ────────────────────────────────
            <View style={[styles.resultScreen, styles.resultScreenSuccess]}>
              <View style={styles.resultIconRing}>
                <Feather name="check-circle" size={72} color="#4ade80" />
              </View>
              <Text style={[styles.resultTitle, { color: "#4ade80" }]}>
                Payment Done!
              </Text>
              {!!bookingRef && (
                <View style={styles.resultRefCard}>
                  <Text style={styles.resultRefLabel}>Booking ID</Text>
                  <Text style={styles.resultRefValue}>#{bookingRef}</Text>
                </View>
              )}
              <Text style={styles.resultSubtitle}>
                Your booking is confirmed and sent to the admin for approval.
                You will be notified once it's approved.
              </Text>
              <TouchableOpacity
                style={[styles.resultBtn, styles.resultBtnSuccess]}
                activeOpacity={0.85}
                onPress={() => {
                  setResultScreen(null);
                  router.replace("/bookings");
                }}
              >
                <Feather name="calendar" size={18} color="#000" />
                <Text style={styles.resultBtnText}>Go to My Bookings</Text>
              </TouchableOpacity>
            </View>
          ) : resultScreen === "failed" ? (
            // ── Payment Not Done (red) ──────────────────────────────
            <View style={[styles.resultScreen, styles.resultScreenFailed]}>
              <View style={styles.resultIconRing}>
                <Feather name="x-circle" size={72} color="#ef4444" />
              </View>
              <Text style={[styles.resultTitle, { color: "#ef4444" }]}>
                Payment Failed
              </Text>
              <Text style={styles.resultSubtitle}>
                Something went wrong and the payment could not be processed. No
                amount has been deducted.
              </Text>
              <TouchableOpacity
                style={[styles.resultBtn, styles.resultBtnFailed]}
                activeOpacity={0.85}
                onPress={() => {
                  setResultScreen(null);
                  router.replace("/");
                }}
              >
                <Feather name="home" size={18} color="#fff" />
                <Text style={[styles.resultBtnText, { color: "#fff" }]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Modal>
      </>
    </PageWrapper>
  );
};

export default CompletePayment;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  // Order summary card
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
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
    maxWidth: "70%",
  },
  orderAddonPrice: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  cardDivider: { height: 1, backgroundColor: "#2a3442" },
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
  },
  totalValue: { color: colors.base, fontFamily: fonts.bold, fontSize: 20 },

  // Meta card
  metaCard: {
    backgroundColor: colors.fill,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaLabel: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: spacing.md,
  },
  metaValue: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: spacing.md,
    maxWidth: "60%",
    textAlign: "right",
  },

  // Coupon
  sectionTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: spacing.md,
    paddingTop: spacing.xs,
  },
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: "#2a3442",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  applyCouponBtn: {
    backgroundColor: colors.base,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyCouponText: {
    color: colors.background,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  removeCouponBtn: {
    backgroundColor: "#3A1A1C",
    borderColor: "#ef4444",
    borderWidth: 1,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeCouponText: { color: "#ef4444", fontFamily: fonts.bold, fontSize: 14 },
  couponMsg: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  couponError: { color: "#ef4444" },
  couponSuccess: { color: colors.gold },

  // Pay button
  payBtn: {
    backgroundColor: colors.primarybtn,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  payBtnText: {
    color: "#000",
    fontFamily: fonts.bold,
    fontSize: spacing.md,
    fontWeight: "700",
  },

  // No key
  noKeyCard: {
    backgroundColor: "#2a1010",
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#ef444430",
  },
  noKeyText: {
    color: "#f87171",
    fontFamily: fonts.medium,
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },

  // Secure badge
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

  // WebView modal
  webviewContainer: { flex: 1, backgroundColor: "#0d0d0d" },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.topbardark,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  webviewClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  webviewTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  webviewLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: "#0d0d0d",
  },
  webviewLoaderText: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  // Confirmation sheet (payment outcome unknown)
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#1E2128",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingTop: spacing.md,
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a3e4a",
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.xs,
  },
  sheetBtnYes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 14,
    paddingVertical: 16,
  },
  sheetBtnYesText: {
    color: "#000",
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: "700",
  },
  sheetBtnNo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  sheetBtnNoText: {
    color: "#ef4444",
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: "700",
  },
  sheetBtnRetry: { paddingVertical: 12, paddingHorizontal: spacing.lg },
  sheetBtnRetryText: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
    textDecorationLine: "underline",
  },

  resultRefCard: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
  },
  resultRefLabel: {
    color: "rgba(74,222,128,0.7)",
    fontFamily: fonts.medium,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  resultRefValue: {
    color: "#4ade80",
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  // Full-screen result
  resultScreen: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  resultScreenSuccess: { backgroundColor: "#061510" },
  resultScreenFailed: { backgroundColor: "#100606" },
  resultIconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },
  resultTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 28,
    textAlign: "center",
    fontWeight: "800",
  },
  resultSubtitle: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  resultBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  resultBtnSuccess: { backgroundColor: "#4ade80" },
  resultBtnFailed: { backgroundColor: "#ef4444" },
  resultBtnText: {
    color: "#000",
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: "700",
  },
});
