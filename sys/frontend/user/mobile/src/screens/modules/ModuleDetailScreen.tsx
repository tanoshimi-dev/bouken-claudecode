import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
import type { ModuleDetail } from '@learn-ai/shared-types';

type Props = NativeStackScreenProps<ModuleStackParamList, 'ModuleDetail'>;

const statusColors: Record<string, string> = {
  completed: colors.success,
  in_progress: colors.warning,
  not_started: colors.textTertiary,
};

const difficultyColors: Record<string, string> = {
  easy: colors.success,
  medium: colors.warning,
  hard: colors.error,
};

export default function ModuleDetailScreen({ route, navigation }: Props) {
  const { contentType, moduleId } = route.params;
  const { data: module, loading, error, refetch } = useApi<ModuleDetail>(() => apiClient.getModule(moduleId));

  React.useEffect(() => {
    if (module) {
      navigation.setOptions({ title: `Module ${module.number}` });
    }
  }, [module, navigation]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;
  if (!module) return <ErrorView message="Module not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{module.title}</Text>
      <Text style={styles.description}>{module.description}</Text>
      <Text style={styles.duration}>{module.estimatedMinutes} min estimated</Text>

      {/* Lessons */}
      <Text style={styles.sectionTitle}>Lessons</Text>
      {module.lessons.map((lesson, index) => (
        <TouchableOpacity
          key={lesson.id}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Lesson', { contentType, moduleId, lessonId: lesson.id })}
        >
          <Card style={styles.lessonCard}>
            <View style={styles.lessonRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColors[lesson.status] ?? colors.textTertiary },
                ]}
              />
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>
                  {index + 1}. {lesson.title}
                </Text>
                <Text style={styles.lessonType}>{lesson.lessonType}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Quizzes */}
      {module.quizzes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Quizzes</Text>
          {module.quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Quiz', { contentType, quizId: quiz.id })}
            >
              <Card style={styles.quizCard}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <View style={styles.quizMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: difficultyColors[quiz.difficulty] ?? colors.textTertiary },
                    ]}
                  >
                    <Text style={styles.difficultyText}>{quiz.difficulty}</Text>
                  </View>
                  <Text style={styles.quizPoints}>{quiz.points} pts</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
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
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  duration: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  lessonCard: {
    marginBottom: spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm + 4,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  lessonType: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  quizCard: {
    marginBottom: spacing.sm,
  },
  quizTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  difficultyText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quizPoints: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
