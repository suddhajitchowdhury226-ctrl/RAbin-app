import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { getToken, isSessionValid, silentRefresh } from '../services/api';

/**
 * App entry point.
 *
 * Flow:
 *  1. Check if a session exists (loginTime within 30 days + refresh token present)
 *  2. If valid  → silently refresh the access token → go to /dashboard
 *  3. If expired / missing → go to /(auth)/login
 */
export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const valid = await isSessionValid();

        if (!valid) {
          // No session or session older than 30 days → force login
          router.replace('/(auth)/login');
          return;
        }

        // Session is within 30 days — try to get a fresh access token
        const accessToken = await getToken();
        if (accessToken) {
          // Access token already present — go straight to dashboard
          router.replace('/dashboard');
          return;
        }

        // No access token but session is valid → try silent refresh
        const refreshed = await silentRefresh();
        if (refreshed) {
          router.replace('/dashboard');
        } else {
          // Refresh token expired — force login
          router.replace('/(auth)/login');
        }
      } catch {
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  // Show a minimal loading screen while checking
  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0614', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return null;
}
