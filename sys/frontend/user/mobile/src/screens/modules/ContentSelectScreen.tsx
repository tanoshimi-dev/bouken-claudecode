import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from '@/navigation/types';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/config/api';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorView from '@/components/common/ErrorView';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ContentTypeWithCount } from '@learn-ai/shared-types';

type Props = NativeStackScreenProps<ModuleStackParamList, 'ContentSelect'>;

export default function ContentSelectScreen({ navigation }: Props) {
  const { data: contentTypes, loading, error, refetch } = useApi<ContentTypeWithCount[]>(() =>
    apiClient.getContentTypes(),
  );

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={contentTypes ?? []}
      keyExtractor={(item) => item.slug}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>AIツールを選択</Text>
          <Text style={styles.subtitle}>学習したいツールを選んでください</Text>
        </View>
      }
      renderItem={({ item }) => {
        if (!item.hasContent) {
          return (
            <Card style={[styles.card, styles.cardDisabled]}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.nameJa}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>準備中</Text>
                </View>
              </View>
            </Card>
          );
        }

        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ModuleList', { contentType: item.slug })}
          >
            <Card style={styles.card}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.nameJa}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.moduleCount}>{item.moduleCount} モジュール</Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      }}
    />
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  moduleCount: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
