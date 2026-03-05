import { useWindowDimensions } from "react-native";

export const useResponsive = () => {
  const { width } = useWindowDimensions();

  const scale = (size) => (width / 375) * size;

  return {
    small: scale(12),
    medium: scale(14),
    large: scale(18),
    title: scale(24),
    heading: scale(32),
  };
};
