import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from '@/navigation/types';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/config/api';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorView from '@/components/common/ErrorView';
import MultipleChoiceCard from '@/components/quiz/MultipleChoiceCard';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { QuizDetail } from '@learn-ai/shared-types';

type Props = NativeStackScreenProps<ModuleStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { contentType, quizId } = route.params;
  const { data: quiz, loading, error, refetch } = useApi<QuizDetail>(() => apiClient.getQuiz(quizId));
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  React.useEffect(() => {
    if (quiz) {
      navigation.setOptions({ title: quiz.title });
    }
  }, [quiz, navigation]);

  const handleSelect = useCallback((questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSubmit = async () => {
    if (!quiz) return;

    // Filter to MC and TF questions only
    const supportedQuestions = quiz.questions.filter(
      (q) => q.questionType === 'multiple_choice' || q.questionType === 'true_false',
    );

    const unanswered = supportedQuestions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const timeSpentSeconds = Math.floor((Date.now() - startTime.current) / 1000);
      const submission = {
        answers: supportedQuestions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
        })),
        timeSpentSeconds,
      };

      const res = await apiClient.submitQuiz(quizId, submission);
      navigation.replace('QuizResults', {
        ...res.data,
        moduleId: quiz.module.id,
        contentType,
      });
    } catch {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;
  if (!quiz) return <ErrorView message="Quiz not found" />;

  // Only show MC and TF questions
  const questions = quiz.questions.filter(
    (q) => q.questionType === 'multiple_choice' || q.questionType === 'true_false',
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.moduleName}>
          Module {quiz.module.number}: {quiz.module.title}
        </Text>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <Text style={styles.quizMeta}>
          {quiz.difficulty} - {quiz.points} points - {questions.length} questions
        </Text>

        {questions.map((question, index) => {
          const options =
            question.questionType === 'true_false'
              ? ['True', 'False']
              : Array.isArray(question.options)
                ? (question.options as string[])
                : [];

          return (
            <MultipleChoiceCard
              key={question.id}
              questionNumber={index + 1}
              questionText={question.questionText}
              codeSnippet={question.codeSnippet}
              options={options}
              selectedIndex={answers[question.id] as number | null ?? null}
              onSelect={(i) => handleSelect(question.id, i)}
            />
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Quiz'}</Text>
        </TouchableOpacity>
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
  quizTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quizMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: spacing.lg,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
