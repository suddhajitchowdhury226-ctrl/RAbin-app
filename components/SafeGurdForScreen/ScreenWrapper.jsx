import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";

export default function ScreenWrapper({ children, scroll = true, backgroundColor = colors.background }) {
  const Content = scroll ? ScrollView : SafeAreaView;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom', 'left', 'right']}>
      <Content contentContainerStyle={styles.content}>
        {children}
      </Content>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
});
