import { colors } from "@/constants/colors";
import { PageWrapper } from "@/components/PageLoader";
import AppHeader from "@/components/AppHeader/AppHeader";
import { rf, rs, SCREEN_W } from "@/constants/rs";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://app-server-maaw.onrender.com/api/v1";
const SCREEN_H = Dimensions.get("window").height;
const GAP = rs(2);
const NUM_COLS = 3;
const THUMB = Math.floor((SCREEN_W - GAP * (NUM_COLS + 1)) / NUM_COLS);

const CATEGORIES_FALLBACK = [
  "All",
  "General",
  "Wedding",
  "Portrait",
  "Event",
  "Corporate",
  "Maternity",
];

export default function PortfolioScreen() {
  const [photos, setPhotos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(CATEGORIES_FALLBACK);
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/portfolio`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.data);
        setFiltered(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/portfolio-categories`);
      const data = await res.json();
      if (data.success && data.data?.length) {
        setCategories(["All", ...data.data]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, [fetchPhotos, fetchCategories]);

  useEffect(() => {
    setFiltered(
      activeCategory === "All"
        ? photos
        : photos.filter((p) => p.category === activeCategory),
    );
  }, [activeCategory, photos]);

  return (
    <PageWrapper>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <StatusBar style="light" backgroundColor="#1A0D0E" />

        <AppHeader
          title="Our Work"
          onBack={() => router.back()}
          bgColor="#1A0D0E"
        />

        {/* Category pills */}
        <View style={styles.catWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catBtn,
                  activeCategory === cat && styles.catBtnActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.catText,
                    activeCategory === cat && styles.catTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primarybtn} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Feather name="image" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            numColumns={NUM_COLS}
            renderItem={({ item, index }) => {
              // item is null when FlatList pads the last row — render nothing
              if (!item || !item.imageUrl) return <View style={styles.thumbPlaceholder} />;
              return (
                <TouchableOpacity
                  style={styles.thumb}
                  onPress={() => setLightboxIndex(index)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumbImg}
                    resizeMode="cover"
                    defaultSource={require("@/assets/images/icon.png")}
                  />
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            style={{ flex: 1 }}
          />
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <Lightbox
            photos={filtered}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </SafeAreaView>
    </PageWrapper>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(onClose);
  };

  const photo = photos[index];

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.lbBg, { opacity: fade }]}>
        {/* Tap outside to close */}
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Image */}
        <Image
          source={{ uri: photo.imageUrl }}
          style={styles.lbImg}
          resizeMode="contain"
        />

        {/* Caption */}
        {(photo.caption || photo.category) && (
          <View style={styles.lbCaption}>
            {!!photo.caption && (
              <Text style={styles.lbCaptionText}>{photo.caption}</Text>
            )}
            <Text style={styles.lbCatText}>{photo.category}</Text>
          </View>
        )}

        {/* Prev */}
        {index > 0 && (
          <TouchableOpacity
            style={[styles.lbArrow, { left: rs(12) }]}
            onPress={() => setIndex((i) => i - 1)}
          >
            <Feather name="chevron-left" size={28} color="white" />
          </TouchableOpacity>
        )}
        {/* Next */}
        {index < photos.length - 1 && (
          <TouchableOpacity
            style={[styles.lbArrow, { right: rs(12) }]}
            onPress={() => setIndex((i) => i + 1)}
          >
            <Feather name="chevron-right" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Counter */}
        <View style={styles.lbCounter}>
          <Text style={styles.lbCounterText}>
            {index + 1} / {photos.length}
          </Text>
        </View>

        {/* Close */}
        <TouchableOpacity style={styles.lbClose} onPress={close}>
          <Feather name="x" size={22} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  catWrapper: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  catRow: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    flexDirection: "row",
    gap: rs(8),
    alignItems: "center",
  },
  catBtn: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: rs(36),
  },
  catBtnActive: {
    backgroundColor: colors.primarybtn,
    borderColor: colors.primarybtn,
  },
  catText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: rf(13),
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  catTextActive: { color: "#000", fontWeight: "700" },

  grid: { paddingHorizontal: GAP, paddingBottom: rs(20) },
  row: { gap: GAP, marginBottom: GAP },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: rs(6),
    overflow: "hidden",
    backgroundColor: "#1a1d24",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: { width: THUMB, height: THUMB },  // invisible filler for incomplete last row

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: rs(12),
  },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: rf(14) },

  // Lightbox
  lbBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  lbImg: { width: SCREEN_W, height: SCREEN_H * 0.72 },
  lbCaption: {
    position: "absolute",
    bottom: rs(80),
    left: rs(20),
    right: rs(20),
    alignItems: "center",
  },
  lbCaptionText: {
    color: "white",
    fontSize: rf(14),
    fontWeight: "600",
    textAlign: "center",
  },
  lbCatText: { color: colors.primarybtn, fontSize: rf(12), marginTop: rs(4) },
  lbArrow: {
    position: "absolute",
    top: "45%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: rs(24),
    padding: rs(10),
  },
  lbCounter: {
    position: "absolute",
    bottom: rs(40),
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: rs(14),
    paddingVertical: rs(6),
    borderRadius: rs(20),
  },
  lbCounterText: { color: "white", fontSize: rf(13) },
  lbClose: {
    position: "absolute",
    top: rs(50),
    right: rs(16),
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: rs(20),
    padding: rs(8),
  },
});
