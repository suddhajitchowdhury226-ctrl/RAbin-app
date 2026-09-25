/**
 * useGoogleAuth — Google Sign-In via expo-auth-session.
 *
 * Flow:
 *  1. Opens Google consent screen
 *  2. Gets accessToken from Google
 *  3. Fetches user profile from Google's userinfo endpoint
 *  4. Sends { googleId, email, name, picture } to POST /auth/google on backend
 *  5. Backend finds/creates user, returns our own JWT pair
 *  6. Stores tokens locally, calls onSuccess()
 *
 * This avoids the nonce requirement of id_token flow, which causes
 * "invalid_request" errors with expo-auth-session on Android.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { storeToken, storeUser, storeRefreshToken, storeLoginTime, API_BASE } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth({ onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const accessToken = response.authentication?.accessToken;
      if (accessToken) {
        handleGoogleAccessToken(accessToken);
      } else {
        onError?.('No access token returned from Google.');
      }
    } else if (response.type === 'error') {
      onError?.(response.error?.message || 'Google Sign-In failed.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGoogleAccessToken = async (accessToken) => {
    try {
      setLoading(true);

      // 1. Fetch the user's profile from Google
      const profileRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) throw new Error('Failed to fetch Google profile');
      const profile = await profileRes.json();

      // 2. Send profile to our backend → get our own JWT
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: profile.id,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Google login failed');

      const data = json.data;
      await storeToken(data.accessToken);
      if (data.refreshToken) await storeRefreshToken(data.refreshToken);
      if (data.user) await storeUser(data.user);
      await storeLoginTime();

      onSuccess?.();
    } catch (err) {
      onError?.(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { promptAsync, loading, request };
}
