import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { clearUser } from '@/store/authSlice';
import { apiClient } from '@/config/api';
import { authService } from '@/services/auth.service';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { OAuthProvider } from '@learn-ai/shared-types';

const allProviders: { id: OAuthProvider; label: string; color: string }[] = [
  { id: 'google', label: 'Google', color: colors.google },
  { id: 'github', label: 'GitHub', color: colors.github },
  { id: 'microsoft', label: 'Microsoft', color: colors.microsoft },
  { id: 'apple', label: 'Apple', color: colors.apple },
  { id: 'line', label: 'LINE', color: colors.line },
];

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const linkedProviders = user?.providers ?? [];
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleUnlink = async (provider: OAuthProvider) => {
    Alert.alert('Unlink Provider', 'Unlinking will log you out. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          setLoadingProvider(provider);
          try {
            await apiClient.unlinkProvider(provider);
            await authService.clearTokens();
            dispatch(clearUser());
          } catch {
            Alert.alert('Error', 'Failed to unlink provider.');
            setLoadingProvider(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Linked Accounts</Text>
      <Text style={styles.sectionDescription}>
        Manage the sign-in providers linked to your account.
      </Text>

      {allProviders.map(({ id, label, color }) => {
        const isLinked = linkedProviders.includes(id);
        const hasLinkedProvider = linkedProviders.length > 0;
        return (
          <Card key={id} style={styles.providerCard}>
            <View style={styles.providerRow}>
              <View style={[styles.providerDot, { backgroundColor: color }]} />
              <Text style={styles.providerName}>{label}</Text>
              {isLinked ? (
                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={() => handleUnlink(id)}
                  disabled={loadingProvider !== null}
                >
                  <Text style={styles.unlinkText}>
                    {loadingProvider === id ? '...' : 'Unlink'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.linkButton, hasLinkedProvider && styles.disabledButton]}
                  disabled={hasLinkedProvider || loadingProvider !== null}
                >
                  <Text style={[styles.linkText, hasLinkedProvider && styles.disabledText]}>
                    Link
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  providerCard: {
    marginBottom: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm + 4,
  },
  providerName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  linkButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
  unlinkButton: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  unlinkText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.6,
  },
});
