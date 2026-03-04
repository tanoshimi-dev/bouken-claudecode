import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setUser, setLoading } from '@/store/authSlice';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/config/api';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { OAuthProvider } from '@learn-ai/shared-types';

const providers: { id: OAuthProvider; label: string; color: string }[] = [
  { id: 'google', label: 'Continue with Google', color: colors.google },
  { id: 'github', label: 'Continue with GitHub', color: colors.github },
  { id: 'microsoft', label: 'Continue with Microsoft', color: colors.microsoft },
  { id: 'apple', label: 'Continue with Apple', color: colors.apple },
  { id: 'line', label: 'Continue with LINE', color: colors.line },
];

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLogin = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    try {
      const tokens = await authService.loginWithProvider(provider);
      if (tokens) {
        await authService.saveTokens(tokens.accessToken, tokens.refreshToken);
        dispatch(setLoading(true));
        const res = await apiClient.getMe();
        dispatch(setUser(res.data));
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Login Failed', message);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AI学習</Text>
          <Text style={styles.subtitle}>
            AIコーディングツールの使い方をインタラクティブに学べる教育アプリ
          </Text>
        </View>

        <View style={styles.providers}>
          {providers.map(({ id, label, color }) => (
            <TouchableOpacity
              key={id}
              style={[styles.providerButton, { backgroundColor: color }]}
              onPress={() => handleLogin(id)}
              disabled={loadingProvider !== null}
              activeOpacity={0.8}
            >
              <Text style={styles.providerText}>
                {loadingProvider === id ? 'Signing in...' : label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  providers: {
    gap: spacing.sm + 4,
  },
  providerButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  providerText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
