import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { rf, rh, rs } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Linking, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { deliveryApi } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";

// ─── Stage Input Field — user can respond to admin's request ─────────────────
const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=919038858523&text&type=phone_number&app_absent=0";

const StageInputField = ({ field, bookingId, stageId, onResponded }) => {
  const [value, setValue]     = useState(field.userResponse || "");
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [saving, setSaving]   = useState(false);
  const isDone = !!field.userResponse;

  const handleSubmit = async (responseValue) => {
    const val = responseValue !== undefined ? responseValue : value.trim();
    if (field.type === "approval") {
      if (!selectedApproval || isDone) return;
    } else {
      if (!value.trim() || isDone) return;
    }
    setSaving(true);
    try {
      const submitVal = field.type === "approval" ? selectedApproval : value.trim();
      await deliveryApi.submitStageResponse(bookingId, {
        stageId, fieldId: field._id, response: submitVal,
      });
      onResponded();
    } catch (_) {}
    finally { setSaving(false); }
  };

  const isApproval = field.type === "approval";
  const pillColor = isApproval
    ? "rgba(74, 222, 128, 0.15)"
    : field.type === "link"
    ? "rgba(96,165,250,0.15)"
    : "rgba(167,139,250,0.15)";
  const pillTextColor = isApproval
    ? "#4ade80"
    : field.type === "link"
    ? "#60a5fa"
    : "#a78bfa";
  const pillIcon = isApproval ? "checkmark-done-circle" : field.type === "link" ? "link" : "type";
  const pillLabel = isApproval ? "Approval" : field.type === "link" ? "Link" : "Text";

  const renderDoneResponse = () => {
    if (field.type === "link") {
      return (
        <View style={fStyles.doneBg}>
          <Feather name="check-circle" size={rf(13)} color="#4ade80" />
          <Text style={[fStyles.doneText, { color: "#60a5fa", textDecorationLine: "underline" }]} numberOfLines={3}>{field.userResponse}</Text>
        </View>
      );
    }
    if (field.type === "approval") {
      const isApproved = field.userResponse === "approved";
      return (
        <View>
          <View style={[fStyles.doneBg, !isApproved && { backgroundColor: "rgba(248, 113, 113, 0.08)", borderLeftColor: "#f87171" }]}>
            <Ionicons
              name={isApproved ? "checkmark-circle" : "close-circle"}
              size={rf(15)}
              color={isApproved ? "#4ade80" : "#f87171"}
            />
            <Text style={[fStyles.doneText, { color: isApproved ? "#4ade80" : "#f87171" }]}>
              {isApproved ? "Approved" : "Need Changes"}
            </Text>
          </View>
          {!isApproved && (
            <TouchableOpacity
              style={fStyles.whatsappBtn}
              onPress={() => Linking.openURL(WHATSAPP_URL)}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={rf(15)} color="#fff" />
              <Text style={fStyles.whatsappBtnText}>Chat on WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return (
      <View style={fStyles.doneBg}>
        <Feather name="check-circle" size={rf(13)} color="#4ade80" />
        <Text style={fStyles.doneText} numberOfLines={3}>{field.userResponse}</Text>
      </View>
    );
  };

  const renderApprovalButtons = () => {
    return (
      <View>
        <View style={fStyles.approvalRow}>
          <TouchableOpacity
            style={[
              fStyles.approvalBtn,
              fStyles.approveBtn,
              selectedApproval === "approved" && fStyles.approveBtnSelected,
            ]}
            onPress={() => setSelectedApproval("approved")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle"
              size={rf(16)}
              color={selectedApproval === "approved" ? "#fff" : "#4ade80"}
            />
            <Text
              style={[
                fStyles.approvalBtnText,
                { color: selectedApproval === "approved" ? "#fff" : "#4ade80" },
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              fStyles.approvalBtn,
              fStyles.rejectBtn,
              selectedApproval === "need_changes" && fStyles.rejectBtnSelected,
            ]}
            onPress={() => setSelectedApproval("need_changes")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close-circle"
              size={rf(16)}
              color={selectedApproval === "need_changes" ? "#fff" : "#f87171"}
            />
            <Text
              style={[
                fStyles.approvalBtnText,
                { color: selectedApproval === "need_changes" ? "#fff" : "#f87171" },
              ]}
            >
              Need Changes
            </Text>
          </TouchableOpacity>
        </View>

        {selectedApproval === "need_changes" && (
          <TouchableOpacity
            style={fStyles.whatsappHint}
            onPress={() => Linking.openURL(WHATSAPP_URL)}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={rf(14)} color="#25D366" />
            <Text style={fStyles.whatsappHintText}>
              Tap here to chat about needed changes on WhatsApp
            </Text>
            <Feather name="external-link" size={rf(12)} color="#25D366" />
          </TouchableOpacity>
        )}

        {selectedApproval && (
          <TouchableOpacity
            style={[fStyles.submitBtn, saving && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Feather name="send" size={rf(13)} color="#000" />
            <Text style={fStyles.submitText}>{saving ? "Submitting…" : "Submit Response"}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[fStyles.card, isDone && fStyles.cardDone]}>
      <View style={fStyles.header}>
        <View style={[fStyles.pill, { backgroundColor: pillColor }]}>
          <Ionicons name={pillIcon} size={rf(10)} color={pillTextColor} />
          <Text style={[fStyles.pillText, { color: pillTextColor }]}>
            {pillLabel}
          </Text>
        </View>
        <Text style={fStyles.label} numberOfLines={2}>
          {field.label}{field.required ? <Text style={{ color: "#f87171" }}> *</Text> : ""}
        </Text>
      </View>

      {isDone ? (
        renderDoneResponse()
      ) : isApproval ? (
        renderApprovalButtons()
      ) : (
        <View>
          <TextInput
            style={fStyles.input}
            placeholder={field.placeholder || (field.type === "link" ? "https://…" : "Type your response…")}
            placeholderTextColor={colors.subheading}
            value={value}
            onChangeText={setValue}
            keyboardType={field.type === "link" ? "url" : "default"}
            autoCapitalize={field.type === "link" ? "none" : "sentences"}
            autoCorrect={field.type !== "link"}
          />
          {value.trim().length > 0 && (
            <TouchableOpacity
              style={[fStyles.submitBtn, saving && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Feather name="send" size={rf(13)} color="#000" />
              <Text style={fStyles.submitText}>{saving ? "Submitting…" : "Submit"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const fStyles = StyleSheet.create({
  card: { backgroundColor: "rgba(96,165,250,0.05)", borderRadius: rs(10), padding: rs(10), borderWidth: 1, borderColor: "rgba(96,165,250,0.18)", marginTop: rs(8) },
  cardDone: { backgroundColor: "rgba(74,222,128,0.05)", borderColor: "rgba(74,222,128,0.2)" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: rs(8), marginBottom: rs(8) },
  pill: { flexDirection: "row", alignItems: "center", gap: rs(4), paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20), flexShrink: 0 },
  pillText: { fontFamily: fonts.bold, fontSize: rf(9), fontWeight: "700" },
  label: { flex: 1, fontFamily: fonts.bold, fontSize: rf(12), color: "#F3F4F6" },
  input: { backgroundColor: "#111318", borderRadius: rs(8), paddingHorizontal: rs(12), paddingVertical: rs(10), color: "#F3F4F6", fontFamily: fonts.text, fontSize: rf(13), borderWidth: 1.5, borderColor: "#2a2e39" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(6), backgroundColor: colors.primarybtn, borderRadius: rs(8), paddingVertical: rs(10), marginTop: rs(8) },
  submitText: { fontFamily: fonts.bold, fontSize: rf(13), color: "#000", fontWeight: "700" },
  doneBg: { flexDirection: "row", alignItems: "flex-start", gap: rs(8), backgroundColor: "rgba(74,222,128,0.08)", borderRadius: rs(8), padding: rs(8), borderLeftWidth: 3, borderLeftColor: "#4ade80" },
  doneText: { flex: 1, fontFamily: fonts.text, fontSize: rf(12), color: "#4ade80" },

  approvalRow: { flexDirection: "row", gap: rs(8), marginTop: rs(4) },
  approvalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    borderRadius: rs(10),
    paddingVertical: rs(12),
    paddingHorizontal: rs(8),
    borderWidth: 1.5,
  },
  approvalBtnText: { fontFamily: fonts.bold, fontSize: rf(12), fontWeight: "700" },
  approveBtn: { backgroundColor: "rgba(74, 222, 128, 0.08)", borderColor: "rgba(74, 222, 128, 0.35)" },
  approveBtnSelected: { backgroundColor: "#4ade80", borderColor: "#4ade80" },
  rejectBtn: { backgroundColor: "rgba(248, 113, 113, 0.08)", borderColor: "rgba(248, 113, 113, 0.35)" },
  rejectBtnSelected: { backgroundColor: "#f87171", borderColor: "#f87171" },

  whatsappHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    marginTop: rs(10),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    backgroundColor: "rgba(37, 211, 102, 0.08)",
    borderRadius: rs(8),
    borderWidth: 1,
    borderColor: "rgba(37, 211, 102, 0.3)",
  },
  whatsappHintText: {
    flex: 1,
    fontFamily: fonts.text,
    fontSize: rf(11),
    color: "#25D366",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    marginTop: rs(8),
    backgroundColor: "#25D366",
    borderRadius: rs(8),
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
  },
  whatsappBtnText: {
    fontFamily: fonts.bold,
    fontSize: rf(12),
    color: "#fff",
    fontWeight: "700",
  },
});

// ─── Main Tracking Page ────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { bookingId, packageName } = useLocalSearchParams();

  const [tracking, setTracking]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryApi.getTracking(bookingId);
      setTracking(data);
    } catch (_) {
      setTracking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const activeMedia = (tracking?.mediaPreviews || []).filter(m => {
    if (m.validUntil && new Date(m.validUntil) < now) return false;
    if (m.validFrom  && new Date(m.validFrom)  > now) return false;
    return true;
  });

  const stages = tracking ? [...tracking.stages].reverse() : [];

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.topbardark} />

      <AppHeader
        title="Order Tracking"
        subtitle={packageName || "Booked"}
        onBack={() => router.back()}
        right={
          activeMedia.length > 0 ? (
            <TouchableOpacity style={styles.previewBadge} onPress={() => setShowPreviewModal(true)} activeOpacity={0.8}>
              <Feather name="image" size={rf(13)} color="#60a5fa" />
              <Text style={styles.previewBadgeText}>{activeMedia.length} Preview{activeMedia.length > 1 ? "s" : ""}</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScreenWrapper scroll backgroundColor="#0a0a0a">

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primarybtn} />
            <Text style={styles.loadingText}>Loading tracking…</Text>
          </View>
        )}

        {!loading && !tracking && (
          <View style={styles.center}>
            <Feather name="map-pin" size={rf(40)} color="#2a2e39" />
            <Text style={styles.emptyTitle}>No tracking yet</Text>
            <Text style={styles.emptySubtitle}>Your photographer will update progress here soon.</Text>
          </View>
        )}

        {!loading && tracking && (
          <View style={styles.content}>

            {/* ── Current Stage Banner ── */}
            <View style={[styles.statusBanner, tracking.isDelivered && styles.statusBannerDelivered]}>
              <View style={[styles.statusIconBg, tracking.isDelivered && styles.statusIconBgDelivered]}>
                <Feather
                  name={tracking.isDelivered ? "check-circle" : "activity"}
                  size={rf(22)}
                  color={tracking.isDelivered ? "#4ade80" : colors.primarybtn}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>
                  {tracking.isDelivered ? "Delivered" : "Current Status"}
                </Text>
                <Text style={[styles.statusValue, tracking.isDelivered && { color: "#4ade80" }]}>
                  {tracking.currentStage || "Not started yet"}
                </Text>
              </View>
              {tracking.isDelivered && (
                <View style={styles.deliveredBadge}>
                  <Feather name="check" size={rf(11)} color="#4ade80" />
                  <Text style={styles.deliveredBadgeText}>Done</Text>
                </View>
              )}
            </View>

            {/* ── Progress Flow ── */}
            {stages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Timeline</Text>
                {stages.map((s, i) => {
                  const isLatest = i === 0;
                  const hasPendingInputs = (s.userInputFields || []).some(f => !f.userResponse);
                  return (
                    <View key={s._id || i} style={styles.stageRow}>
                      {/* Left: dot + line */}
                      <View style={styles.stageLeft}>
                        <View style={[
                          styles.stageDot,
                          isLatest && styles.stageDotActive,
                          tracking.isDelivered && styles.stageDotDone,
                        ]}>
                          {isLatest && !tracking.isDelivered
                            ? <View style={styles.stageDotInner} />
                            : <Feather name="check" size={rf(9)} color="#0a0a0a" />
                          }
                        </View>
                        {i < stages.length - 1 && (
                          <View style={[styles.stageLine, (!isLatest || tracking.isDelivered) && styles.stageLineDone]} />
                        )}
                      </View>

                      {/* Right: content card */}
                      <View style={[styles.stageCard, isLatest && !tracking.isDelivered && styles.stageCardActive, { marginBottom: i < stages.length - 1 ? rs(4) : 0 }]}>
                        <View style={styles.stageCardHeader}>
                          <Text style={[styles.stageName, isLatest && !tracking.isDelivered && styles.stageNameActive]}>
                            {s.stage}
                          </Text>
                          {isLatest && !tracking.isDelivered && (
                            <View style={styles.currentPill}>
                              <Text style={styles.currentPillText}>Current</Text>
                            </View>
                          )}
                          {hasPendingInputs && (
                            <View style={styles.actionNeededPill}>
                              <Feather name="alert-circle" size={rf(9)} color="#f59e0b" />
                              <Text style={styles.actionNeededText}>Action needed</Text>
                            </View>
                          )}
                        </View>
                        {!!s.note && <Text style={styles.stageNote}>{s.note}</Text>}
                        <Text style={styles.stageDate}>
                          {new Date(s.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </Text>

                        {/* User input fields */}
                        {(s.userInputFields || []).map(f => (
                          <StageInputField
                            key={f._id}
                            field={f}
                            bookingId={bookingId}
                            stageId={s._id}
                            onResponded={load}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── No stages yet ── */}
            {stages.length === 0 && (
              <View style={styles.center}>
                <Feather name="clock" size={rf(32)} color="#2a2e39" />
                <Text style={styles.emptySubtitle}>Your photographer will update stages here.</Text>
              </View>
            )}

            {/* ── Feedback prompt after delivery ── */}
            {tracking.isDelivered && (
              <View style={styles.feedbackCard}>
                <Feather name="star" size={rf(18)} color="#facc15" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedbackTitle}>
                    {tracking.feedback?.rating ? "Thanks for your feedback!" : "How was your experience?"}
                  </Text>
                  {tracking.feedback?.rating ? (
                    <View style={{ flexDirection: "row", gap: rs(3), marginTop: rs(4) }}>
                      {[1,2,3,4,5].map(n => (
                        <Feather key={n} name="star" size={rf(13)} color={n <= tracking.feedback.rating ? "#facc15" : "#2a2e39"} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.feedbackSub}>Tap to rate your session</Text>
                  )}
                </View>
                <Feather name="chevron-right" size={rf(16)} color={colors.subheading} />
              </View>
            )}

          </View>
        )}
      </ScreenWrapper>

      {/* ── Preview Modal — triggered by top-right badge ── */}
      <Modal visible={showPreviewModal} animationType="slide" transparent onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview Links</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.modalClose}>
                <Feather name="x" size={rf(18)} color={colors.subheading} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {activeMedia.length} preview{activeMedia.length > 1 ? "s" : ""} shared by your photographer
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeMedia.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.previewRow}
                  onPress={() => { setShowPreviewModal(false); Linking.openURL(m.url); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.previewIconBg, { backgroundColor: m.type === "VIDEO" ? "rgba(96,165,250,0.12)" : "rgba(167,139,250,0.12)" }]}>
                    <Feather name={m.type === "VIDEO" ? "film" : "image"} size={rf(18)} color={m.type === "VIDEO" ? "#60a5fa" : "#a78bfa"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewCaption} numberOfLines={1}>{m.caption || "View Preview"}</Text>
                    {m.validUntil && (
                      <Text style={styles.previewExpiry}>
                        Expires {new Date(m.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    )}
                  </View>
                  <Feather name="external-link" size={rf(16)} color={colors.primarybtn} />
                </TouchableOpacity>
              ))}
              <View style={{ height: rs(20) }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Preview badge top-right
  previewBadge: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    backgroundColor: "rgba(96,165,250,0.12)", borderRadius: rs(20),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
    borderWidth: 1, borderColor: "rgba(96,165,250,0.3)",
  },
  previewBadgeText: { fontFamily: fonts.bold, fontSize: rf(11), color: "#60a5fa", fontWeight: "700" },

  content: { paddingHorizontal: rs(16), paddingTop: rs(16), paddingBottom: rh(40), gap: rs(20) },

  // Status banner
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: rs(14),
    backgroundColor: "rgba(255,142,60,0.06)", borderRadius: rs(16),
    padding: rs(14), borderWidth: 1, borderColor: "rgba(255,142,60,0.2)",
  },
  statusBannerDelivered: { backgroundColor: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" },
  statusIconBg: { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: "rgba(255,142,60,0.12)", alignItems: "center", justifyContent: "center" },
  statusIconBgDelivered: { backgroundColor: "rgba(74,222,128,0.12)" },
  statusLabel: { fontFamily: fonts.text, fontSize: rf(11), color: colors.subheading, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: rs(2) },
  statusValue: { fontFamily: fonts.heading, fontSize: rf(15), color: colors.primarybtn },
  deliveredBadge: { flexDirection: "row", alignItems: "center", gap: rs(4), backgroundColor: "rgba(74,222,128,0.12)", borderRadius: rs(20), paddingHorizontal: rs(10), paddingVertical: rs(5), borderWidth: 1, borderColor: "rgba(74,222,128,0.25)" },
  deliveredBadgeText: { fontFamily: fonts.bold, fontSize: rf(11), color: "#4ade80" },

  section: { gap: rs(0) },
  sectionTitle: { fontFamily: fonts.bold, fontSize: rf(11), color: colors.subheading, textTransform: "uppercase", letterSpacing: 1, marginBottom: rs(16) },

  // Stage row
  stageRow: { flexDirection: "row", gap: rs(12) },
  stageLeft: { alignItems: "center", width: rs(22) },
  stageDot: { width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: "#2a2e39", borderWidth: 2, borderColor: "#3a3e4a", alignItems: "center", justifyContent: "center" },
  stageDotActive: { backgroundColor: colors.primarybtn, borderColor: colors.primarybtn, shadowColor: colors.primarybtn, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  stageDotDone: { backgroundColor: "#4ade80", borderColor: "#4ade80" },
  stageDotInner: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: "#0a0a0a" },
  stageLine: { width: 2, flex: 1, backgroundColor: "#2a2e39", marginVertical: rs(3), minHeight: rs(20) },
  stageLineDone: { backgroundColor: "#4ade80" },

  // Stage card
  stageCard: { flex: 1, backgroundColor: "#1E2128", borderRadius: rs(14), padding: rs(12), borderWidth: 1, borderColor: "#2a2e39", marginBottom: rs(8) },
  stageCardActive: { borderColor: "rgba(255,142,60,0.4)", backgroundColor: "rgba(255,142,60,0.04)" },
  stageCardHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: rs(6), marginBottom: rs(4) },
  stageName: { fontFamily: fonts.bold, fontSize: rf(14), color: colors.subheading, flex: 1 },
  stageNameActive: { color: "#F3F4F6" },
  stageNote: { fontFamily: fonts.text, fontSize: rf(12), color: colors.subheading, fontStyle: "italic", marginBottom: rs(4) },
  stageDate: { fontFamily: fonts.text, fontSize: rf(10), color: "#3a3e4a" },
  currentPill: { backgroundColor: "rgba(255,142,60,0.15)", borderRadius: rs(20), paddingHorizontal: rs(8), paddingVertical: rs(2), borderWidth: 1, borderColor: "rgba(255,142,60,0.35)" },
  currentPillText: { fontFamily: fonts.bold, fontSize: rf(9), color: colors.primarybtn, fontWeight: "700" },
  actionNeededPill: { flexDirection: "row", alignItems: "center", gap: rs(3), backgroundColor: "rgba(245,158,11,0.12)", borderRadius: rs(20), paddingHorizontal: rs(8), paddingVertical: rs(2), borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  actionNeededText: { fontFamily: fonts.bold, fontSize: rf(9), color: "#f59e0b" },

  // Feedback card
  feedbackCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    backgroundColor: "rgba(250,204,21,0.05)", borderRadius: rs(14),
    padding: rs(14), borderWidth: 1, borderColor: "rgba(250,204,21,0.2)",
  },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: rf(13), color: "#F3F4F6" },
  feedbackSub: { fontFamily: fonts.text, fontSize: rf(12), color: colors.subheading, marginTop: rs(2) },

  // Empty / loading
  center: { alignItems: "center", marginTop: rh(60), gap: rs(12), paddingHorizontal: rs(24) },
  loadingText: { fontFamily: fonts.text, fontSize: rf(13), color: colors.subheading, marginTop: rs(8) },
  emptyTitle: { fontFamily: fonts.heading, fontSize: rf(18), color: "#F3F4F6" },
  emptySubtitle: { fontFamily: fonts.text, fontSize: rf(13), color: colors.subheading, textAlign: "center", lineHeight: rf(20) },

  // Preview modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#1E2128", borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), padding: rs(20), paddingTop: rs(12), maxHeight: "70%", borderWidth: 1, borderColor: "#2a2e39" },
  modalHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: "#3a3e4a", alignSelf: "center", marginBottom: rs(16) },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: rs(4) },
  modalTitle: { fontFamily: fonts.heading, fontSize: rf(16), color: "#F3F4F6" },
  modalClose: { padding: rs(4) },
  modalSubtitle: { fontFamily: fonts.text, fontSize: rf(12), color: colors.subheading, marginBottom: rs(16) },
  previewRow: { flexDirection: "row", alignItems: "center", gap: rs(12), backgroundColor: "#111318", borderRadius: rs(12), padding: rs(12), marginBottom: rs(10), borderWidth: 1, borderColor: "#2a2e39" },
  previewIconBg: { width: rs(44), height: rs(44), borderRadius: rs(10), alignItems: "center", justifyContent: "center" },
  previewCaption: { fontFamily: fonts.bold, fontSize: rf(14), color: "#F3F4F6" },
  previewExpiry: { fontFamily: fonts.text, fontSize: rf(11), color: colors.subheading, marginTop: rs(2) },
});
