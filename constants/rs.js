/**
 * rs.js — Responsive Scale utility
 * Scales sizes relative to a 375px baseline (iPhone SE / small phone).
 * Works for fonts, spacing, dimensions.
 *
 * Usage:
 *   import { rs, rf, rh } from '@/constants/rs';
 *   fontSize: rf(14)   → scales font
 *   padding: rs(16)    → scales spacing
 *   height: rh(180)    → scales height relative to screen height
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const BASE_W = 375;
const BASE_H = 812;

// Scale a size relative to screen width
export const rs = (size) => {
  const scale = W / BASE_W;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Scale font — slightly less aggressive than rs to avoid huge text on tablets
export const rf = (size) => {
  const scale = W / BASE_W;
  const newSize = size * Math.min(scale, 1.3); // cap at 1.3x for large screens
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Scale relative to screen height
export const rh = (size) => {
  const scale = H / BASE_H;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// Screen dimensions (use these instead of Dimensions.get everywhere)
export const SCREEN_W = W;
export const SCREEN_H = H;

// Responsive spacing object — drop-in replacement for spacing.js values
export const rsp = {
  xs: rs(4),
  sm: rs(8),
  sx: rs(12),
  sxx: rs(14),
  md: rs(16),
  mf: rs(18),
  mx: rs(20),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(40),
};
