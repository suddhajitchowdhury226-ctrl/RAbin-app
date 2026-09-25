import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { useFonts } from 'expo-font';
import {
  DancingScript_400Regular,
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import {
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const TOPBAR_COLOR = '#1A0D0E';

// ─── Notification Context ─────────────────────────────────────────────────────
// Provides unreadCount so the bell icon in dashboard can show a badge,
// and resetCount so the notification screen can clear it on open.
export const NotificationCtx = createContext({ unreadCount: 0, resetCount: () => {}, bumpCount: () => {} });
export const useNotifications = () => useContext(NotificationCtx);

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    DancingScript_700Bold,
    CormorantGaramond_600SemiBold_Italic,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const resetCount = useCallback(() => setUnreadCount(0), []);
  const bumpCount  = useCallback(() => setUnreadCount((c) => c + 1), []);

  if (!fontsLoaded) return null;

  return (
    <NotificationCtx.Provider value={{ unreadCount, resetCount, bumpCount }}>
      <SafeAreaProvider style={{ backgroundColor: TOPBAR_COLOR }}>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} />
        <View style={{ flex: 1, backgroundColor: '#181B20' }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#181B20' } }}>
            <Stack.Screen name="(auth)/login" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)/otp"   options={{ animation: 'slide_from_right' }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </NotificationCtx.Provider>
  );
}
