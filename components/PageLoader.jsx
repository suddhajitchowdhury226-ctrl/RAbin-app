import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const { width: W } = Dimensions.get("window");

// Tracks which page IDs have already completed their first load.
// Lives at module level so it persists across tab navigation remounts.
const loadedPages = new Set();

/**
 * PageWrapper — wraps page content with a 1.8s loader on FIRST visit only.
 * 
 * Pass a unique `id` prop so the loader is skipped on subsequent tab visits:
 *   <PageWrapper id="dashboard">
 *     <YourContent />
 *   </PageWrapper>
 * 
 * Without an `id` it shows the loader every mount (legacy behaviour).
 */
export function PageWrapper({ children, id, duration = 1800 }) {
    // If this page has been seen before, skip loader immediately.
    const alreadyLoaded = id ? loadedPages.has(id) : false;

    const [ready, setReady] = useState(alreadyLoaded);
    const fadeIn = useRef(new Animated.Value(alreadyLoaded ? 1 : 0)).current;

    useEffect(() => {
        if (alreadyLoaded) return; // nothing to do

        const t = setTimeout(() => {
            if (id) loadedPages.add(id); // mark as loaded
            setReady(true);
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, duration);
        return () => clearTimeout(t);
    }, []);

    if (!ready) return <LoaderScreen />;

    return (
        <Animated.View style={{ flex: 1, opacity: fadeIn }}>
            {children}
        </Animated.View>
    );
}

/**
 * LoaderScreen — animated skeleton loader.
 */
export function LoaderScreen() {
    const bar1    = useRef(new Animated.Value(0)).current;
    const bar2    = useRef(new Animated.Value(0)).current;
    const bar3    = useRef(new Animated.Value(0)).current;
    const dot1    = useRef(new Animated.Value(0.3)).current;
    const dot2    = useRef(new Animated.Value(0.3)).current;
    const dot3    = useRef(new Animated.Value(0.3)).current;
    const shimmer = useRef(new Animated.Value(-W)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmer, {
                toValue: W * 2, duration: 1100,
                easing: Easing.linear, useNativeDriver: true,
            })
        ).start();

        Animated.stagger(140, [
            Animated.timing(bar1, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(bar2, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(bar3, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        const dotLoop = (dot, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1,   duration: 320, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: true }),
                ])
            );
        dotLoop(dot1, 0).start();
        dotLoop(dot2, 160).start();
        dotLoop(dot3, 320).start();
    }, []);

    const shimmerStyle = { transform: [{ translateX: shimmer }] };

    return (
        <View style={styles.container}>
            <View style={styles.logoPlaceholder}>
                <Animated.View style={[styles.shimmerBar, shimmerStyle]} />
            </View>
            {[[bar1, '88%'], [bar2, '68%'], [bar3, '48%']].map(([bar, w], i) => (
                <Animated.View key={i} style={[styles.skeletonLine, { width: w, opacity: bar }]}>
                    <Animated.View style={[styles.shimmerBar, shimmerStyle]} />
                </Animated.View>
            ))}
            <View style={styles.dotsRow}>
                {[dot1, dot2, dot3].map((dot, i) => (
                    <Animated.View key={i} style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: "#0b0d14",
        alignItems: "center", justifyContent: "center",
        gap: 14, paddingHorizontal: 40,
    },
    logoPlaceholder: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginBottom: 20, overflow: "hidden",
    },
    skeletonLine: {
        height: 13, borderRadius: 7,
        backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
    },
    shimmerBar: {
        position: "absolute", top: 0, left: 0,
        width: 100, height: "100%",
        backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999,
    },
    dotsRow: { flexDirection: "row", gap: 10, marginTop: 28 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF8E3C" },
});
