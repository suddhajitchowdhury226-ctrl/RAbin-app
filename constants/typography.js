import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;

export const typography = {
  small: scale(12),
  medium: scale(14),
  large: scale(18),
  title: scale(24),
  heading: scale(32),
};
