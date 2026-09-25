import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { PageWrapper } from "@/components/PageLoader";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { rf, rs, rh, rsp } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";
const TAX_RATE = 0.08;

const MODES = ["Single", "Multiple", "Check-in / Check-out"];
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
const fmt = (a) =>
  `₹${Number(a).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

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
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const FALLBACK_SERVICES = [
  { _id: "wedding", name: "Wedding Photography", price: 15000 },
  { _id: "prewedding", name: "Pre-Wedding Shoot", price: 8000 },
  { _id: "maternity", name: "Maternity Session", price: 6000 },
  { _id: "family", name: "Family Portraits", price: 4999 },
  { _id: "corporate", name: "Corporate Event Coverage", price: 10000 },
  { _id: "birthday", name: "Birthday Party", price: 5000 },
  { _id: "drone", name: "Drone Photography", price: 3000 },
  { _id: "video", name: "Cinematic Videography", price: 12000 },
];

export default function CustomBooking() {
  // ── Event info ───────────────────────────────────────────────────
  const [eventName, setEventName] = useState("");

  // ── Selected services ────────────────────────────────────────────
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesList, setServicesList] = useState(FALLBACK_SERVICES);
  const [servicesLoading, setServicesLoading] = useState(false);

  // ── Calendar ─────────────────────────────────────────────────────
  const [calMode, setCalMode] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [singleDate, setSingleDate] = useState(null);
  const [multiDates, setMultiDates] = useState(new Set());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  // ── Time per date ────────────────────────────────────────────────
  const [dateTimes, setDateTimes] = useState({});
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  // ── Venue & notes ────────────────────────────────────────────────
  const [venueSameForAll, setVenueSameForAll] = useState(true);
  const [venueShared, setVenueShared] = useState("");
  const [venuePerDay, setVenuePerDay] = useState({});
  const [specialNotes, setSpecialNotes] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const res = await fetch(`${API_BASE}/pricing/custom-services`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) setServicesList(data.data);
      } catch (_) {
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
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

  const isPast = (day) => {
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < today;
  };

  const handleDayPress = (day) => {
    if (!day || isPast(day)) return;
    const key = toKey(year, month, day);
    if (calMode === 0) {
      setSingleDate(key);
    } else if (calMode === 1) {
      setMultiDates((prev) => {
        const n = new Set(prev);
        n.has(key) ? n.delete(key) : n.add(key);
        return n;
      });
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(key);
        setRangeEnd(null);
      } else {
        const s = keyToDate(rangeStart),
          e = new Date(year, month, day);
        e < s ? (setRangeStart(key), setRangeEnd(null)) : setRangeEnd(key);
      }
    }
  };

  const isDaySelected = (day) => {
    if (!day) return false;
    const key = toKey(year, month, day);
    if (calMode === 0) return singleDate === key;
    if (calMode === 1) return multiDates.has(key);
    if (!rangeStart) return false;
    if (!rangeEnd) return rangeStart === key;
    const d = new Date(year, month, day);
    return d >= keyToDate(rangeStart) && d <= keyToDate(rangeEnd);
  };
  const isDayRangeEdge = (day) => {
    if (!day || calMode !== 2) return false;
    const key = toKey(year, month, day);
    return key === rangeStart || key === rangeEnd;
  };
  const isDayInRange = (day) => {
    if (!day || calMode !== 2 || !rangeStart || !rangeEnd) return false;
    const d = new Date(year, month, day);
    return d > keyToDate(rangeStart) && d < keyToDate(rangeEnd);
  };

  const selectedKeys = useMemo(() => {
    if (calMode === 0) return singleDate ? [singleDate] : [];
    if (calMode === 1) return Array.from(multiDates).sort();
    if (calMode === 2 && rangeStart && rangeEnd) {
      const keys = [],
        cur = new Date(keyToDate(rangeStart)),
        end = keyToDate(rangeEnd);
      while (cur <= end) {
        keys.push(toKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 1);
      }
      return keys;
    }
    if (calMode === 2 && rangeStart) return [rangeStart];
    return [];
  }, [calMode, singleDate, multiDates, rangeStart, rangeEnd]);

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
    setDateTimes((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: dateToTimeStr(selected) },
    }));
    setPickerTarget(null);
  };

  const toggleService = (id) =>
    setSelectedServices((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const servicesAmount = useMemo(
    () =>
      servicesList
        .filter((s) => selectedServices.includes(s._id))
        .reduce((sum, s) => sum + s.price, 0),
    [servicesList, selectedServices],
  );
  const preTax = servicesAmount;
  const taxAmount = preTax * TAX_RATE;
  const totalAmount = preTax + taxAmount;

  const canContinue =
    selectedServices.length > 0 &&
    selectedKeys.length > 0 &&
    selectedKeys.every((k) => dateTimes[k]?.inTime);

  const handleContinue = () => {
    const firstKey = selectedKeys[0];
    router.push({
      pathname: "/details/completepayment",
      params: {
        packageName: eventName || "Custom Event",
        packagePrice: String(servicesAmount),
        selectedDate: firstKey,
        selectedTime: dateTimes[firstKey]?.inTime || "",
        outTime: dateTimes[firstKey]?.outTime || "",
        additionalDates: JSON.stringify(selectedKeys.slice(1)),
        venue: venueSameForAll
          ? venueShared
          : selectedKeys
              .map((k) => venuePerDay[k] || "")
              .filter(Boolean)
              .join(" | "),
        specialNotes,
        selectedAddons: JSON.stringify([]),
        totalAmount: String(Math.round(totalAmount)),
        razorpayButtonId: "RAZORPAY_ME",
      },
    });
  };

  return (
    <PageWrapper>
      <>
        <StatusBar style="light" backgroundColor={colors.topbardark} />
        <AppHeader title="Customize Booking" onBack={() => router.back()} />

        <ScreenWrapper scroll backgroundColor="#000000">
          <View style={styles.container}>
            {/* ── Event Info ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="info" size={rf(16)} color={colors.primarybtn} />
                <Text style={styles.sectionTitle}>Event Info</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter event name (e.g. My Birthday)"
                placeholderTextColor={colors.subheading}
                value={eventName}
                onChangeText={setEventName}
              />
            </View>

            {/* ── Select Services ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather
                  name="package"
                  size={rf(16)}
                  color={colors.primarybtn}
                />
                <Text style={styles.sectionTitle}>Select Services</Text>
              </View>
              {servicesLoading ? (
                <ActivityIndicator color={colors.primarybtn} />
              ) : (
                servicesList.map((svc) => {
                  const checked = selectedServices.includes(svc._id);
                  return (
                    <TouchableOpacity
                      key={svc._id}
                      style={styles.addonRow}
                      onPress={() => toggleService(svc._id)}
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
                              size={rf(13)}
                              color={colors.background}
                            />
                          )}
                        </View>
                        <Text style={styles.addonLabel}>{svc.name}</Text>
                      </View>
                      <Text style={styles.addonPrice}>{fmt(svc.price)}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* ── Select Date ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather
                  name="calendar"
                  size={rf(16)}
                  color={colors.primarybtn}
                />
                <Text style={styles.sectionTitle}>Select Date</Text>
              </View>

              <View style={styles.modeRow}>
                {MODES.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modeBtn,
                      calMode === i && styles.modeBtnActive,
                    ]}
                    onPress={() => {
                      setCalMode(i);
                      setSingleDate(null);
                      setMultiDates(new Set());
                      setRangeStart(null);
                      setRangeEnd(null);
                      setDateTimes({});
                    }}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        calMode === i && styles.modeBtnTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarArrow}
                  onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}
                >
                  <Feather
                    name="chevron-left"
                    size={rf(20)}
                    color={colors.white}
                  />
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
                    size={rf(20)}
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

              {calMode === 2 && (
                <Text style={styles.rangeHint}>
                  {!rangeStart
                    ? "Tap a start date"
                    : !rangeEnd
                      ? "Tap an end date"
                      : `${fmtDate(rangeStart)} → ${fmtDate(rangeEnd)}`}
                </Text>
              )}
              {calMode === 1 && multiDates.size > 0 && (
                <Text style={styles.rangeHint}>
                  {multiDates.size} day{multiDates.size > 1 ? "s" : ""} selected
                </Text>
              )}
            </View>

            {/* ── Time Selection per date ── */}
            {selectedKeys.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Feather
                    name="clock"
                    size={rf(16)}
                    color={colors.primarybtn}
                  />
                  <Text style={styles.sectionTitle}>
                    Session Time{selectedKeys.length > 1 ? " per Day" : ""}
                  </Text>
                </View>
                {selectedKeys.map((key) => {
                  const inTime = dateTimes[key]?.inTime;
                  const outTime = dateTimes[key]?.outTime;
                  return (
                    <View key={key} style={styles.timeRowWrapper}>
                      <Text style={styles.timeRowDate}>{fmtDate(key)}</Text>
                      <View style={styles.timeRowCols}>
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
                            size={rf(14)}
                            color={
                              inTime ? colors.primarybtn : colors.subheading
                            }
                          />
                        </TouchableOpacity>
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
                            size={rf(14)}
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
              <View style={styles.venueTitleRow}>
                <View style={styles.sectionHeader}>
                  <Feather
                    name="map-pin"
                    size={rf(16)}
                    color={colors.primarybtn}
                  />
                  <Text style={styles.sectionTitle}>Venue</Text>
                </View>
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

              {selectedKeys.length > 1 &&
                !venueSameForAll &&
                selectedKeys.map((key) => (
                  <View key={key} style={styles.venuePerDayRow}>
                    <View style={styles.venueDateLabel}>
                      <Feather
                        name="map-pin"
                        size={rf(12)}
                        color={colors.primarybtn}
                      />
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

            {/* ── Special Notes ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather
                  name="edit-3"
                  size={rf(16)}
                  color={colors.primarybtn}
                />
                <Text style={styles.sectionTitle}>Special Notes</Text>
              </View>
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
              <View style={styles.sectionHeader}>
                <Feather
                  name="file-text"
                  size={rf(16)}
                  color={colors.primarybtn}
                />
                <Text style={styles.sectionTitle}>Booking Summary</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Event</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {eventName || "Custom Event"}
                </Text>
              </View>
              <View style={styles.summaryDivider} />

              {selectedServices.length > 0 && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Services ({selectedServices.length})
                    </Text>
                    <Text style={styles.summaryValue}>
                      {fmt(servicesAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                </>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{fmt(preTax)}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (8%)</Text>
                <Text style={styles.summaryValue}>{fmt(taxAmount)}</Text>
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
                  : selectedServices.length === 0
                    ? "Select at least one service"
                    : selectedKeys.length === 0
                      ? "Select a date"
                      : "Set session time for all dates"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScreenWrapper>

        {/* ── Native Time Picker ── */}
        {pickerTarget && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPickerChange}
          />
        )}
      </>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: rsp.md, paddingBottom: rsp.xxl, gap: rsp.md },

  sectionCard: {
    backgroundColor: "#1E2128",
    borderRadius: rs(18),
    padding: rsp.md,
    gap: rsp.md,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: rsp.sm },
  sectionTitle: {
    color: colors.white,
    fontFamily: fonts.heading,
    fontSize: rf(15),
  },

  textInput: {
    backgroundColor: "#111418",
    borderRadius: rs(12),
    paddingHorizontal: rsp.md,
    paddingVertical: rsp.sx,
    color: colors.white,
    fontFamily: fonts.text,
    fontSize: rf(14),
    borderWidth: 1.5,
    borderColor: "#2a2e39",
  },
  textArea: { minHeight: rh(80) },

  // Services / Add-ons
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: rsp.md,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3442",
  },
  addonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: rsp.sm,
    flex: 1,
    paddingRight: rsp.md,
  },
  checkbox: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(5),
    borderWidth: 1.5,
    borderColor: colors.subheading,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primarybtn,
    borderColor: colors.primarybtn,
  },
  addonLabel: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(13),
    flex: 1,
  },
  addonPrice: {
    color: colors.primarybtn,
    fontFamily: fonts.heading,
    fontSize: rf(13),
  },

  // Calendar
  modeRow: { flexDirection: "row", gap: rsp.sm, flexWrap: "wrap" },
  modeBtn: {
    paddingHorizontal: rsp.md,
    paddingVertical: rsp.xs,
    borderRadius: rs(20),
    backgroundColor: "#111418",
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  modeBtnActive: {
    backgroundColor: colors.primarybtn,
    borderColor: colors.primarybtn,
  },
  modeBtnText: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(12),
  },
  modeBtnTextActive: { color: "#000", fontWeight: "700" },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarArrow: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarybtn,
  },
  calendarMonth: {
    color: colors.white,
    fontFamily: fonts.heading,
    fontSize: rf(14),
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: {
    width: "14.28%",
    textAlign: "center",
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(11),
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rsp.sm,
  },
  dayCircle: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: { backgroundColor: colors.primarybtn },
  dayInRange: { backgroundColor: "rgba(245,81,95,0.15)", borderRadius: 0 },
  dayText: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(13),
  },
  dayTextSelected: { color: "#000", fontWeight: "700" },
  dayTextInRange: { color: colors.primarybtn },
  dayTextPast: { opacity: 0.25 },
  rangeHint: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(12),
    textAlign: "center",
    marginTop: rsp.xs,
  },

  // Time picker
  timeRowWrapper: { gap: rsp.xs },
  timeRowDate: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(12),
  },
  timeRowCols: { flexDirection: "row", gap: rsp.sm },
  timePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111418",
    borderRadius: rs(12),
    paddingHorizontal: rsp.md,
    paddingVertical: rsp.sx,
    borderWidth: 1,
    borderColor: "#2a2e39",
  },
  timePickerBtnActive: { borderColor: colors.primarybtn + "66" },
  timePickerLeft: { flexDirection: "row", alignItems: "center", gap: rsp.xs },
  timePickerDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  timePickerLabel: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(12),
  },
  timePickerValue: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(13),
    flex: 1,
    textAlign: "center",
  },
  timePickerValueSet: { color: colors.white, fontWeight: "600" },

  // Venue
  venueTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  venueToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: rs(10),
    padding: rs(3),
    gap: rs(3),
  },
  venueToggleBtn: {
    paddingHorizontal: rsp.md,
    paddingVertical: rsp.xs,
    borderRadius: rs(8),
  },
  venueToggleBtnActive: { backgroundColor: colors.primarybtn },
  venueToggleText: {
    color: colors.subheading,
    fontSize: rf(12),
    fontWeight: "600",
  },
  venueToggleTextActive: { color: "#000", fontWeight: "700" },
  venuePerDayRow: { gap: rsp.xs },
  venueDateLabel: { flexDirection: "row", alignItems: "center", gap: rsp.xs },
  venueDateText: {
    color: colors.subheading,
    fontSize: rf(12),
    fontWeight: "600",
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryDivider: { height: 1, backgroundColor: "#2a2e39" },
  summaryLabel: {
    color: colors.subheading,
    fontFamily: fonts.text,
    fontSize: rf(13),
  },
  summaryValue: {
    color: colors.white,
    fontFamily: fonts.text,
    fontSize: rf(13),
    maxWidth: "60%",
    textAlign: "right",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: rsp.xs,
  },
  summaryTotalLabel: {
    color: colors.white,
    fontFamily: fonts.heading,
    fontSize: rf(16),
  },
  summaryTotalValue: {
    color: colors.primarybtn,
    fontFamily: fonts.heading,
    fontSize: rf(18),
  },

  // Button
  paymentButton: {
    backgroundColor: colors.primarybtn,
    paddingVertical: rsp.md,
    borderRadius: rs(14),
    alignItems: "center",
  },
  paymentButtonDisabled: { opacity: 0.45 },
  paymentButtonText: {
    color: "#000",
    fontFamily: fonts.heading,
    fontSize: rf(15),
    fontWeight: "700",
  },
});
