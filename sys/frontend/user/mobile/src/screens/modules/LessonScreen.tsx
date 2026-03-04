import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from '@/navigation/types';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/config/api';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorView from '@/components/common/ErrorView';
import MarkdownRenderer from '@/components/content/MarkdownRenderer';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { LessonDetail } from '@learn-ai/shared-types';

type Props = NativeStackScreenProps<ModuleStackParamList, 'Lesson'>;

export default function LessonScreen({ route, navigation }: Props) {
  const { contentType, moduleId, lessonId } = route.params;
  const { data: lesson, loading, error, refetch } = useApi<LessonDetail>(() => apiClient.getLesson(moduleId, lessonId));
  const [completing, setCompleting] = useState(false);

  React.useEffect(() => {
    if (lesson) {
      navigation.setOptions({ title: lesson.title });
    }
  }, [lesson, navigation]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await apiClient.completeLesson(lessonId);
      Alert.alert('Lesson Complete!', 'Great job finishing this lesson.');
    } catch {
      Alert.alert('Error', 'Failed to mark lesson as complete.');
    } finally {
      setCompleting(false);
    }
  };

  const handlePrev = () => {
    if (lesson?.prevLesson) {
      navigation.replace('Lesson', { contentType, moduleId, lessonId: lesson.prevLesson.id });
    }
  };

  const handleNext = () => {
    if (lesson?.nextLesson) {
      navigation.replace('Lesson', { contentType, moduleId, lessonId: lesson.nextLesson.id });
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;
  if (!lesson) return <ErrorView message="Lesson not found" />;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.moduleName}>
          Module {lesson.module.number}: {lesson.module.title}
        </Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonType}>{lesson.lessonType}</Text>

        <View style={styles.markdownContainer}>
          <MarkdownRenderer content={lesson.contentMd} />
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, !lesson.prevLesson && styles.navButtonDisabled]}
            onPress={handlePrev}
            disabled={!lesson.prevLesson}
          >
            <Text
              style={[styles.navButtonText, !lesson.prevLesson && styles.navButtonTextDisabled]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {lesson.status !== 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              disabled={completing}
            >
              <Text style={styles.completeButtonText}>
                {completing ? 'Completing...' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.navButton, !lesson.nextLesson && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={!lesson.nextLesson}
          >
            <Text
              style={[styles.navButtonText, !lesson.nextLesson && styles.navButtonTextDisabled]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  moduleName: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  lessonTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lessonType: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'capitalize',
    marginBottom: spacing.lg,
  },
  markdownContainer: {
    flex: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 14,
  },
  navButtonTextDisabled: {
    color: colors.textTertiary,
  },
  completeButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  completeButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 14,
  },
});
