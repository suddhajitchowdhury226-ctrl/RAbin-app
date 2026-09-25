import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width: W, height: H } = Dimensions.get('window');

// ── Purple palette ────────────────────────────────────────────────────────────
const PURPLE       = '#7C3AED';   // vivid violet
const PURPLE_LIGHT = '#A78BFA';   // soft lavender
const PURPLE_GLOW  = '#6D28D9';   // deeper glow
const BG           = '#0D0614';   // near-black purple tint

export default function SplashScreen({ onDone }) {
  // ── Animation values ──────────────────────────────────────────────
  const bgScale       = useRef(new Animated.Value(1.15)).current;
  const logoY         = useRef(new Animated.Value(60)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;
  const ring1Scale    = useRef(new Animated.Value(0.4)).current;
  const ring1Opacity  = useRef(new Animated.Value(0)).current;
  const ring2Scale    = useRef(new Animated.Value(0.2)).current;
  const ring2Opacity  = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(40)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const tagY          = useRef(new Animated.Value(20)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const lineScale     = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowPulse     = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Glow pulse loop (breathing effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1,   duration: 1800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      // 1. BG zoom in + logo pops up with spring
      Animated.parallel([
        Animated.timing(bgScale, {
          toValue: 1, duration: 900,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(logoY,     { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),

      // 2. Ring 1 ripples outward
      Animated.parallel([
        Animated.spring(ring1Scale,  { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
        Animated.timing(ring1Opacity,{ toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.delay(150),
      ]),

      // 3. Ring 2 ripples outward
      Animated.parallel([
        Animated.spring(ring2Scale,  { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(ring2Opacity,{ toValue: 0.35, duration: 600, useNativeDriver: true }),
      ]),

      // 4. Divider line draws in
      Animated.timing(lineScale, {
        toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),

      // 5. Studio name slides up
      Animated.parallel([
        Animated.spring(textY,      { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(textOpacity,{ toValue: 1, duration: 500, useNativeDriver: true }),
      ]),

      // 6. Tagline slides up
      Animated.parallel([
        Animated.spring(tagY,      { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(tagOpacity,{ toValue: 1, duration: 400, useNativeDriver: true }),
      ]),

      // 7. Hold for 3 s total (animations above ≈ 1.8 s, so hold ~0.5 s)
      Animated.delay(500),

      // 8. Fade out + slight zoom (zoom-into-app feel)
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(bgScale, {
          toValue: 1.08, duration: 700, useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar style="light" />

      {/* Animated background scale */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
        <View style={styles.bg} />
        {/* Top-center purple glow orb */}
        <View style={styles.bgOrb} />
      </Animated.View>

      {/* Breathing glow blob */}
      <Animated.View style={[styles.glowBlob, { opacity: glowPulse }]} />

      {/* Outer ring 2 (furthest) */}
      <Animated.View style={[
        styles.ring, styles.ring2,
        { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
      ]} />

      {/* Outer ring 1 */}
      <Animated.View style={[
        styles.ring, styles.ring1,
        { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
      ]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ translateY: logoY }, { scale: logoScale }] },
      ]}>
        <Image
          source={require('../assets/images/rabins-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Divider line */}
      <Animated.View style={[styles.line, { transform: [{ scaleX: lineScale }] }]} />

      {/* Studio name */}
      <Animated.Text style={[
        styles.studioName,
        { opacity: textOpacity, transform: [{ translateY: textY }] },
      ]}>
        Rabin's Photography
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[
        styles.tagline,
        { opacity: tagOpacity, transform: [{ translateY: tagY }] },
      ]}>
        Capturing moments, crafting memories
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
  },
  bgOrb: {
    position: 'absolute',
    top: -H * 0.18,
    alignSelf: 'center',
    width: W * 1.1,
    height: W * 1.1,
    borderRadius: W * 0.55,
    backgroundColor: 'rgba(124,58,237,0.18)',
  },

  glowBlob: {
    position: 'absolute',
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.425,
    backgroundColor: 'rgba(124,58,237,0.09)',
    shadowColor: PURPLE_GLOW,
    shadowOpacity: 1,
    shadowRadius: 90,
    shadowOffset: { width: 0, height: 0 },
  },

  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 220, height: 220,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  ring2: {
    width: 310, height: 310,
    borderColor: 'rgba(124,58,237,0.15)',
  },

  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 2.5,
    borderColor: 'rgba(167,139,250,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: PURPLE,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  logo: { width: 140, height: 140 },

  line: {
    width: W * 0.55,
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.5)',
    marginBottom: 22,
  },

  studioName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(167,139,250,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.6,
  },
});
