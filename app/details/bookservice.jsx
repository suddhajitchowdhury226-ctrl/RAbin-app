import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { PageWrapper } from "@/components/PageLoader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";

const FALLBACK_ADDONS = [
  { _id: "retouch", name: "Extra Retouches (10 photos)", price: 750 },
  { _id: "location", name: "Additional Location", price: 1500 },
  { _id: "album", name: "Premium Photo Album", price: 2000 },
  { _id: "prints", name: "Large Format Prints (5 pcs)", price: 900 },
  { _id: "drone2", name: "Extra Drone Coverage (2 drones)", price: 2500 },
  { _id: "video4k", name: "4K Video Recording", price: 3000 },
  { _id: "express", name: "Express Delivery (48 hrs)", price: 1200 },
  { _id: "makeup", name: "Professional Makeup Artist", price: 1800 },
  { _id: "lighting", name: "Advanced Lighting Setup", price: 2200 },
];

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

const toKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const keyToDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (key) => keyToDate(key).toDateString();

// Parse "10:30 AM" into a Date object for the picker
const timeStrToDate = (str) => {
  const d = new Date();
  if (!str) return d;
  const [time, ampm] = str.split(" ");
  const [h, m] = time.split(":").map(Number);
  d.setHours(
    ampm === "PM" ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h,
    m,
    0,
    0,
  );
  return d;
};
const dateToTimeStr = (d) => {
  const h = d.getHours(),
    m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const BookService = () => {
  const {
    image,
    title,
    badge,
    packageName,
    packagePrice,
    packageTier,
    baseDays: baseDaysParam,
    razorpayButtonId,
    packageFeatures,
    serviceId,
    packageId,
  } = useLocalSearchParams();

  // Fixed number of days this package requires (admin-set)
  const fixedDays = Math.max(
    1,
    parseInt(baseDaysParam || (packageTier === "GOLD" ? 4 : 3)),
  );

  // ── Calendar state ──────────────────────────────────────────────
  // Auto-pick mode: single if fixedDays===1, range (check-in/out) if fixedDays>1
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [singleDate, setSingleDate] = useState(null);
  const [multiDates, setMultiDates] = useState(new Set());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  // ── Time state — per date ───────────────────────────────────────
  // { [dateKey]: { inTime: "10:00 AM", outTime: "2:00 PM" } }
  const [dateTimes, setDateTimes] = useState({});

  // ── Time picker state ───────────────────────────────────────────
  // pickerTarget: { key, field: 'inTime'|'outTime' } | null
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  // ── Venue & notes ───────────────────────────────────────────────
  // venueSameForAll: true = one venue for all days, false = per-day venue
  const [venueSameForAll, setVenueSameForAll] = useState(true);
  const [venueShared, setVenueShared] = useState("");
  // { [dateKey]: string }
  const [venuePerDay, setVenuePerDay] = useState({});
  const [specialNotes, setSpecialNotes] = useState("");

  // ── Add-ons ─────────────────────────────────────────────────────
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [addonsList, setAddonsList] = useState(FALLBACK_ADDONS);
  const [addonsLoading, setAddonsLoading] = useState(false);

  useEffect(() => {
    const fetchAddons = async () => {
      setAddonsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/pricing/addons`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) setAddonsList(data.data);
      } catch (_) {
        /* keep fallback */
      } finally {
        setAddonsLoading(false);
      }
    };
    fetchAddons();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = i - firstDayOfMonth + 1;
      days.push(d > 0 && d <= daysInMonth ? d : null);
    }
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const handleDayPress = (day) => {
    if (!day) return;
    const key = toKey(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(year, month, day) < today) return;

    if (fixedDays === 1) {
      // Single day mode — just pick one
      setSingleDate(key);
    } else if (fixedDays === 2) {
      // Range mode for 2 days
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(key);
        setRangeEnd(null);
      } else {
        const s = keyToDate(rangeStart);
        const e = new Date(year, month, day);
        if (e < s) {
          setRangeStart(key);
          setRangeEnd(null);
        } else {
          setRangeEnd(key);
        }
      }
    } else {
      // Multi-select for fixedDays > 2
      // If already at limit, tap deselects; otherwise adds
      setMultiDates((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else if (next.size < fixedDays) {
          next.add(key);
        }
        // If already at limit and tapping a new day → ignore (user must deselect first)
        return next;
      });
    }
  };

  const isDaySelected = (day) => {
    if (!day) return false;
    const key = toKey(year, month, day);
    if (fixedDays === 1) return singleDate === key;
    if (fixedDays === 2) {
      if (!rangeStart) return false;
      if (!rangeEnd) return rangeStart === key;
      const d = new Date(year, month, day);
      return d >= keyToDate(rangeStart) && d <= keyToDate(rangeEnd);
    }
    return multiDates.has(key);
  };

  const isDayRangeEdge = (day) => {
    if (!day || fixedDays !== 2) return false;
    const key = toKey(year, month, day);
    return key === rangeStart || key === rangeEnd;
  };

  const isDayInRange = (day) => {
    if (!day || fixedDays !== 2 || !rangeStart || !rangeEnd) return false;
    const d = new Date(year, month, day);
    return d > keyToDate(rangeStart) && d < keyToDate(rangeEnd);
  };

  const isPast = (day) => {
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < today;
  };

  const selectedKeys = useMemo(() => {
    if (fixedDays === 1) return singleDate ? [singleDate] : [];
    if (fixedDays === 2) {
      if (rangeStart && rangeEnd) {
        const keys = [];
        const cur = new Date(keyToDate(rangeStart));
        const end = keyToDate(rangeEnd);
        while (cur <= end) {
          keys.push(toKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
          cur.setDate(cur.getDate() + 1);
        }
        return keys.slice(0, fixedDays);
      }
      if (rangeStart) return [rangeStart];
      return [];
    }
    return Array.from(multiDates).sort();
  }, [fixedDays, singleDate, multiDates, rangeStart, rangeEnd]);

  // ── Open time picker ────────────────────────────────────────────
  const openPicker = (key, field) => {
    const existing = dateTimes[key]?.[field];
    setPickerValue(existing ? timeStrToDate(existing) : new Date());
    setPickerTarget({ key, field });
  };

  const onPickerChange = (event, selected) => {
    if (event.type === "dismissed" || !selected) {
      setPickerTarget(null);
      return;
    }
    const { key, field } = pickerTarget;
    const timeStr = dateToTimeStr(selected);
    setDateTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: timeStr },
    }));
    setPickerTarget(null);
  };

  // ── Pricing ─────────────────────────────────────────────────────
  const parseCurrency = (v) => {
    const n = Number(String(v || 0).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };
  const fmt = (a) =>
    `₹${Number(a).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  const basePrice = parseCurrency(packagePrice);
  const addonsAmount = useMemo(
    () =>
      addonsList
        .filter((a) => selectedAddons.includes(a._id))
        .reduce((s, a) => s + a.price, 0),
    [addonsList, selectedAddons],
  );
  const preTax = basePrice + addonsAmount;
  const totalAmount = preTax;

  const toggleAddon = (id) =>
    setSelectedAddons((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  // All selected dates must have inTime, and exactly fixedDays must be picked
  const canContinue =
    selectedKeys.length === fixedDays &&
    selectedKeys.every((k) => dateTimes[k]?.inTime);

  // Resolve final venue value for payment screen
  const resolvedVenue = venueSameForAll
    ? venueShared
    : selectedKeys
        .map((k) => venuePerDay[k] || "")
        .filter(Boolean)
        .join(" | ");

  const handleContinue = () => {
    const firstKey = selectedKeys[0];
    const addonsPayload = addonsList
      .filter((a) => selectedAddons.includes(a._id))
      .map((a) => ({
        addonId: a._id,
        name: a.name,
        price: a.price,
      }));
    router.push({
      pathname: "/details/completepayment",
      params: {
        serviceId: serviceId || "",
        packageId: packageId || "",
        packageName: packageName || "Selected Package",
        packagePrice: String(basePrice),
        selectedDate: firstKey,
        selectedTime: dateTimes[firstKey]?.inTime || "",
        outTime: dateTimes[firstKey]?.outTime || "",
        additionalDates: JSON.stringify(selectedKeys.slice(1)),
        venue: resolvedVenue,
        specialNotes,
        selectedAddons: JSON.stringify(addonsPayload),
        totalAmount: String(Math.round(totalAmount)),
        razorpayButtonId: razorpayButtonId || "",
      },
    });
  };

  return (
    <PageWrapper>
      <>
        <StatusBar style="light" backgroundColor={colors.topbardark} />
        <AppHeader
          title="Book Service"
          onBack={() => router.back()}
          bgColor={colors.topbardark}
        />

        <ScreenWrapper scroll backgroundColor="#000000">
          <View style={styles.container}>
            {/* ── Service card ── */}
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
                {!!badge && <Text style={styles.summaryBadge}>{badge}</Text>}
                <Text style={styles.summaryPackage} numberOfLines={1}>
                  {packageName || "Package"}
                </Text>
                <Text style={styles.summaryPrice}>
                  {packagePrice
                    ? `₹${parseCurrency(packagePrice).toLocaleString("en-IN")}`
                    : ""}
                </Text>
                <View style={styles.summaryDaysRow}>
                  <Feather name="calendar" size={12} color={colors.base} />
                  <Text style={styles.summaryDaysText}>
                    {fixedDays} day{fixedDays !== 1 ? "s" : ""} fixed
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Select Date ── */}
            <View style={styles.sectionCard}>
              {/* Title + day counter pill */}
              <View style={styles.calendarTitleRow}>
                <Text style={styles.sectionTitle}>Select Date</Text>
                <View
                  style={[
                    styles.dayCountPill,
                    selectedKeys.length === fixedDays &&
                      styles.dayCountPillDone,
                  ]}
                >
                  <Feather
                    name="calendar"
                    size={12}
                    color={
                      selectedKeys.length === fixedDays ? "#000" : colors.base
                    }
                  />
                  <Text
                    style={[
                      styles.dayCountText,
                      selectedKeys.length === fixedDays &&
                        styles.dayCountTextDone,
                    ]}
                  >
                    {selectedKeys.length} / {fixedDays} day
                    {fixedDays !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Instruction hint */}
              <Text style={styles.calendarHint}>
                {fixedDays === 1
                  ? "Tap a date to select your session day."
                  : fixedDays === 2
                    ? "Tap start date, then end date."
                    : `Tap exactly ${fixedDays} days. Tap again to deselect.`}
              </Text>

              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarArrow}
                  onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}
                >
                  <Feather name="chevron-left" size={20} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>
                  {monthNames[month]} {year}
                </Text>
                <TouchableOpacity
                  style={styles.calendarArrow}
                  onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}
                >
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {weekDays.map((d) => (
                  <Text key={d} style={styles.weekDay}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dayCell}
                    disabled={!day || isPast(day)}
                    onPress={() => handleDayPress(day)}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isDayInRange(day) && styles.dayInRange,
                        (isDaySelected(day) || isDayRangeEdge(day)) &&
                          styles.dayCircleSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isPast(day) && styles.dayTextPast,
                          isDayInRange(day) && styles.dayTextInRange,
                          (isDaySelected(day) || isDayRangeEdge(day)) &&
                            styles.dayTextSelected,
                        ]}
                      >
                        {day || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Range hint for 2-day mode */}
              {fixedDays === 2 && (
                <Text style={styles.rangeHint}>
                  {!rangeStart
                    ? "Tap your start date"
                    : !rangeEnd
                      ? "Now tap your end date"
                      : `${fmtDate(rangeStart)} → ${fmtDate(rangeEnd)}`}
                </Text>
              )}
              {/* Multi hint */}
              {fixedDays > 2 &&
                multiDates.size > 0 &&
                multiDates.size < fixedDays && (
                  <Text style={styles.rangeHint}>
                    {fixedDays - multiDates.size} more day
                    {fixedDays - multiDates.size !== 1 ? "s" : ""} to select
                  </Text>
                )}
              {fixedDays > 2 && multiDates.size === fixedDays && (
                <Text style={[styles.rangeHint, { color: "#4ade80" }]}>
                  ✓ All {fixedDays} days selected
                </Text>
              )}
            </View>

            {/* ── Time Selection (In + Out per date) ── */}
            {selectedKeys.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Session Time{selectedKeys.length > 1 ? " per Day" : ""}
                </Text>

                {selectedKeys.map((key) => {
                  const inTime = dateTimes[key]?.inTime;
                  const outTime = dateTimes[key]?.outTime;
                  return (
                    <View key={key} style={styles.timeRowWrapper}>
                      <Text style={styles.timeRowDate}>{fmtDate(key)}</Text>
                      <View style={styles.timeRowCols}>
                        {/* In Time */}
                        <TouchableOpacity
                          style={[
                            styles.timePickerBtn,
                            inTime && styles.timePickerBtnActive,
                          ]}
                          onPress={() => openPicker(key, "inTime")}
                        >
                          <View style={styles.timePickerLeft}>
                            <View
                              style={[
                                styles.timePickerDot,
                                { backgroundColor: "#4ade80" },
                              ]}
                            />
                            <Text style={styles.timePickerLabel}>In</Text>
                          </View>
                          <Text
                            style={[
                              styles.timePickerValue,
                              inTime && styles.timePickerValueSet,
                            ]}
                          >
                            {inTime || "Set time"}
                          </Text>
                          <Feather
                            name="clock"
                            size={14}
                            color={
                              inTime ? colors.primarybtn : colors.subheading
                            }
                          />
                        </TouchableOpacity>

                        {/* Out Time */}
                        <TouchableOpacity
                          style={[
                            styles.timePickerBtn,
                            outTime && styles.timePickerBtnActive,
                          ]}
                          onPress={() => openPicker(key, "outTime")}
                        >
                          <View style={styles.timePickerLeft}>
                            <View
                              style={[
                                styles.timePickerDot,
                                { backgroundColor: "#f87171" },
                              ]}
                            />
                            <Text style={styles.timePickerLabel}>Out</Text>
                          </View>
                          <Text
                            style={[
                              styles.timePickerValue,
                              outTime && styles.timePickerValueSet,
                            ]}
                          >
                            {outTime || "Set time"}
                          </Text>
                          <Feather
                            name="clock"
                            size={14}
                            color={
                              outTime ? colors.primarybtn : colors.subheading
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Venue ── */}
            <View style={styles.sectionCard}>
              {/* Header row with Same/Different toggle (only when multiple dates) */}
              <View style={styles.venueTitleRow}>
                <Text style={styles.sectionTitle}>Venue</Text>
                {selectedKeys.length > 1 && (
                  <View style={styles.venueToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.venueToggleBtn,
                        venueSameForAll && styles.venueToggleBtnActive,
                      ]}
                      onPress={() => setVenueSameForAll(true)}
                    >
                      <Text
                        style={[
                          styles.venueToggleText,
                          venueSameForAll && styles.venueToggleTextActive,
                        ]}
                      >
                        Same
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.venueToggleBtn,
                        !venueSameForAll && styles.venueToggleBtnActive,
                      ]}
                      onPress={() => setVenueSameForAll(false)}
                    >
                      <Text
                        style={[
                          styles.venueToggleText,
                          !venueSameForAll && styles.venueToggleTextActive,
                        ]}
                      >
                        Different
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Single date or "Same" mode — one input */}
              {(selectedKeys.length <= 1 || venueSameForAll) && (
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    selectedKeys.length > 1
                      ? "Enter venue for all dates"
                      : "Enter venue or location"
                  }
                  placeholderTextColor={colors.subheading}
                  value={venueShared}
                  onChangeText={setVenueShared}
                />
              )}

              {/* Multiple dates + "Different" mode — one input per date */}
              {selectedKeys.length > 1 &&
                !venueSameForAll &&
                selectedKeys.map((key) => (
                  <View key={key} style={styles.venuePerDayRow}>
                    <View style={styles.venueDateLabel}>
                      <Feather name="map-pin" size={13} color={colors.base} />
                      <Text style={styles.venueDateText}>{fmtDate(key)}</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter venue for this date"
                      placeholderTextColor={colors.subheading}
                      value={venuePerDay[key] || ""}
                      onChangeText={(v) =>
                        setVenuePerDay((prev) => ({ ...prev, [key]: v }))
                      }
                    />
                  </View>
                ))}
            </View>

            {/* ── Add-ons ── */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Package Add-ons</Text>
              {addonsLoading ? (
                <ActivityIndicator color={colors.primarybtn} />
              ) : (
                addonsList.map((addon) => {
                  const checked = selectedAddons.includes(addon._id);
                  return (
                    <TouchableOpacity
                      key={addon._id}
                      style={styles.addonRow}
                      onPress={() => toggleAddon(addon._id)}
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
                              size={13}
                              color={colors.background}
                            />
                          )}
                        </View>
                        <Text style={styles.addonLabel}>{addon.name}</Text>
                      </View>
                      <Text style={styles.addonPrice}>
                        ₹{Number(addon.price).toLocaleString("en-IN")}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* ── Special Notes ── */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Special Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any special requests or notes for the photographer..."
                placeholderTextColor={colors.subheading}
                value={specialNotes}
                onChangeText={setSpecialNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* ── Booking Summary ── */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Package</Text>
                <Text style={styles.summaryValue}>{packageName || "—"}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price</Text>
                <Text style={styles.summaryValue}>
                  {fmt(basePrice)} · {fixedDays} day{fixedDays !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.summaryDivider} />

              {addonsAmount > 0 && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Add-ons</Text>
                    <Text style={styles.summaryValue}>{fmt(addonsAmount)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                </>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{fmt(preTax)}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{fmt(totalAmount)}</Text>
              </View>
            </View>

            {/* ── Continue button ── */}
            <TouchableOpacity
              style={[
                styles.paymentButton,
                !canContinue && styles.paymentButtonDisabled,
              ]}
              disabled={!canContinue}
              onPress={handleContinue}
            >
              <Text style={styles.paymentButtonText}>
                {canContinue
                  ? "Continue Payment"
                  : selectedKeys.length < fixedDays
                    ? `Select ${fixedDays - selectedKeys.length} more day${fixedDays - selectedKeys.length !== 1 ? "s" : ""}`
                    : "Set session time for all dates"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScreenWrapper>

        {/* ── Native time picker ── */}
        {pickerTarget && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            onChange={onPickerChange}
          />
        )}
      </>
    </PageWrapper>
  );
};

export default BookService;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  // Service card
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.fill,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: "center",
  },
  summaryImage: { width: 70, height: 70, borderRadius: 14 },
  summaryContent: { flex: 1, gap: 4 },
  summaryTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  summaryBadge: { color: colors.gold, fontFamily: fonts.medium, fontSize: 12 },
  summaryPackage: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  summaryPrice: { color: colors.gold, fontFamily: fonts.bold, fontSize: 14 },
  summaryDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  summaryDaysText: {
    color: colors.base,
    fontFamily: fonts.medium,
    fontSize: 11,
  },

  // Section card
  sectionCard: {
    backgroundColor: colors.fill,
    borderRadius: 18,
    padding: spacing.md,
    gap: 12,
  },
  sectionTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },

  // Calendar title row + day counter
  calendarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,142,60,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,142,60,0.3)",
  },
  dayCountPillDone: { backgroundColor: colors.base, borderColor: colors.base },
  dayCountText: { color: colors.base, fontSize: 12, fontWeight: "700" },
  dayCountTextDone: { color: "#000" },
  calendarHint: { color: colors.subheading, fontSize: 12, fontStyle: "italic" },

  // Calendar
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
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: {
    width: "14.28%",
    textAlign: "center",
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: { backgroundColor: colors.base },
  dayInRange: { backgroundColor: "rgba(255,142,60,0.2)", borderRadius: 0 },
  dayText: { color: colors.subheading, fontFamily: fonts.medium, fontSize: 13 },
  dayTextSelected: { color: colors.background, fontFamily: fonts.bold },
  dayTextInRange: { color: colors.base },
  dayTextPast: { color: "rgba(255,255,255,0.18)" },
  rangeHint: {
    color: colors.base,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: "center",
  },

  // Time per day
  timeRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingBottom: 12,
    gap: 8,
  },
  timeRowDate: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  timeRowCols: { flexDirection: "row", gap: 10 },
  timePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timePickerBtnActive: {
    borderColor: colors.base,
    backgroundColor: "rgba(255,142,60,0.08)",
  },
  timePickerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  timePickerDot: { width: 7, height: 7, borderRadius: 4 },
  timePickerLabel: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  timePickerValue: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 12,
    flex: 1,
    marginHorizontal: 6,
  },
  timePickerValueSet: { color: colors.white, fontFamily: fonts.bold },

  // Inputs
  textInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
  },
  textArea: { minHeight: 80 },

  // Venue
  venueTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  venueToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  venueToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  venueToggleBtnActive: { backgroundColor: colors.base },
  venueToggleText: {
    color: colors.subheading,
    fontSize: 12,
    fontWeight: "600",
  },
  venueToggleTextActive: { color: "#000", fontWeight: "700" },
  venuePerDayRow: { gap: 6 },
  venueDateLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  venueDateText: { color: colors.subheading, fontSize: 12, fontWeight: "600" },

  // Add-ons
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  addonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.subheading,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.base, borderColor: colors.base },
  addonLabel: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 13,
    flex: 1,
  },
  addonPrice: { color: colors.base, fontFamily: fonts.bold, fontSize: 14 },

  // Booking summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  summaryLabel: {
    color: colors.subheading,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: "right",
    maxWidth: "60%",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  summaryTotalLabel: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  summaryTotalValue: {
    color: colors.base,
    fontFamily: fonts.bold,
    fontSize: 20,
  },

  // Payment button
  paymentButton: {
    backgroundColor: colors.primarybtn,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  paymentButtonDisabled: { opacity: 0.45 },
  paymentButtonText: {
    color: "#000",
    fontFamily: fonts.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
