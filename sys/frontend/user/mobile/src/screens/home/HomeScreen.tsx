import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/config/api';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorView from '@/components/common/ErrorView';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { ContentTypeSlug, OverallProgress, StreakInfo } from '@learn-ai/shared-types';
import type { RootStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const navigation = useNavigation<NavProp>();
  const { data: progress, loading: progressLoading, error: progressError, refetch: refetchProgress } = useApi<OverallProgress>(() => apiClient.getProgress());
  const { data: streaks, loading: streaksLoading } = useApi<StreakInfo>(() => apiClient.getStreaks());

  if (progressLoading || streaksLoading) return <LoadingScreen />;
  if (progressError) return <ErrorView message={progressError} onRetry={refetchProgress} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome back, {user?.name ?? 'Learner'}!</Text>

      {/* Streak Card */}
      <Card style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streaks?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streaks?.longestStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      </Card>

      {/* Overall Progress */}
      <Card style={styles.progressCard}>
        <Text style={styles.cardTitle}>Overall Progress</Text>
        <ProgressBar progress={progress?.overallPercent ?? 0} />
        <Text style={styles.progressText}>
          {progress?.completedLessons ?? 0} of {progress?.totalLessons ?? 0} lessons completed ({progress?.overallPercent ?? 0}%)
        </Text>
      </Card>

      {/* Per-content-type progress */}
      {progress?.byContentType && progress.byContentType.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>ツール別進捗</Text>
          {progress.byContentType.map((ctp) => {
            const ct = CONTENT_TYPES[ctp.contentType as ContentTypeSlug];
            if (!ct) return null;
            return (
              <TouchableOpacity
                key={ctp.contentType}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Main', {
                    screen: 'ModulesTab',
                    params: {
                      screen: 'ModuleList',
                      params: { contentType: ctp.contentType },
                    },
                  })
                }
              >
                <Card style={styles.ctCard}>
                  <View style={styles.ctRow}>
                    <Text style={styles.ctIcon}>{ct.icon}</Text>
                    <View style={styles.ctInfo}>
                      <Text style={styles.ctName}>{ct.nameJa}</Text>
                      <ProgressBar
                        progress={ctp.overallPercent}
                        style={styles.ctProgress}
                        color={ct.color}
                      />
                      <Text style={styles.ctStat}>
                        {ctp.completedLessons}/{ctp.totalLessons} lessons - {ctp.overallPercent}%
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      )}
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
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  streakCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  streakValue: {
    ...typography.h1,
    color: colors.textInverse,
  },
  streakLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  progressCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  ctCard: {
    marginBottom: spacing.sm,
  },
  ctRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  ctInfo: {
    flex: 1,
  },
  ctName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ctProgress: {
    marginBottom: spacing.xs,
  },
  ctStat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
