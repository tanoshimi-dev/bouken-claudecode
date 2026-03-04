import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from '@/navigation/types';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Props = NativeStackScreenProps<ModuleStackParamList, 'QuizResults'>;

export default function QuizResultsScreen({ route, navigation }: Props) {
  const { score, maxScore, percentage, results, moduleId, contentType } = route.params;
  const passed = percentage >= 70;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score Card */}
      <Card style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail]}>
        <Text style={styles.scoreEmoji}>{passed ? 'Great job!' : 'Keep practicing!'}</Text>
        <Text style={styles.scoreValue}>
          {score}/{maxScore}
        </Text>
        <Text style={styles.scorePercent}>{percentage}%</Text>
      </Card>

      {/* Per-question results */}
      <Text style={styles.sectionTitle}>Question Results</Text>
      {results.map((result, index) => (
        <Card
          key={result.questionId}
          style={[styles.resultCard, result.correct ? styles.resultCorrect : styles.resultWrong]}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultNumber}>Q{index + 1}</Text>
            <Text style={[styles.resultStatus, result.correct ? styles.correctText : styles.wrongText]}>
              {result.correct ? 'Correct' : 'Incorrect'}
            </Text>
          </View>
          <Text style={styles.explanation}>{result.explanation}</Text>
        </Card>
      ))}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ModuleDetail', { contentType, moduleId })}
        >
          <Text style={styles.primaryButtonText}>Back to Module</Text>
        </TouchableOpacity>
      </View>
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
  scoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  scoreCardPass: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  scoreCardFail: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  scoreEmoji: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 40,
  },
  scorePercent: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  resultCorrect: {
    borderLeftColor: colors.success,
  },
  resultWrong: {
    borderLeftColor: colors.error,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultNumber: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultStatus: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  correctText: {
    color: colors.success,
  },
  wrongText: {
    color: colors.error,
  },
  explanation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
