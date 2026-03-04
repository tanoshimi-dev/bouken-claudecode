import React from 'react';
import { FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from '@/navigation/types';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/config/api';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorView from '@/components/common/ErrorView';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ModuleWithProgress } from '@learn-ai/shared-types';

type Props = NativeStackScreenProps<ModuleStackParamList, 'ModuleList'>;

export default function ModuleListScreen({ route, navigation }: Props) {
  const { contentType } = route.params;
  const { data: modules, loading, error, refetch } = useApi<ModuleWithProgress[]>(() =>
    apiClient.getModules(contentType),
  );

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={modules ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ModuleDetail', { contentType, moduleId: item.id })}
        >
          <Card style={styles.card}>
            <Text style={styles.moduleNumber}>Module {item.number}</Text>
            <Text style={styles.moduleTitle}>{item.title}</Text>
            <Text style={styles.moduleDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <ProgressBar progress={item.progressPercent} style={styles.progress} />
            <Text style={styles.progressLabel}>
              {item.completedLessons}/{item.totalLessons} lessons - {item.progressPercent}%
            </Text>
            <Text style={styles.duration}>{item.estimatedMinutes} min</Text>
          </Card>
        </TouchableOpacity>
      )}
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
  card: {
    marginBottom: spacing.sm,
  },
  moduleNumber: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  moduleDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progress: {
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  duration: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
