import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ModuleStackParamList } from './types';
import ContentSelectScreen from '@/screens/modules/ContentSelectScreen';
import ModuleListScreen from '@/screens/modules/ModuleListScreen';
import ModuleDetailScreen from '@/screens/modules/ModuleDetailScreen';
import LessonScreen from '@/screens/modules/LessonScreen';
import QuizScreen from '@/screens/quiz/QuizScreen';
import QuizResultsScreen from '@/screens/quiz/QuizResultsScreen';
import { colors } from '@/theme/colors';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { ContentTypeSlug } from '@learn-ai/shared-types';

const Stack = createNativeStackNavigator<ModuleStackParamList>();

export default function ModuleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ContentSelect"
        component={ContentSelectScreen}
        options={{ title: 'AIツール' }}
      />
      <Stack.Screen
        name="ModuleList"
        component={ModuleListScreen}
        options={({ route }) => {
          const ct = CONTENT_TYPES[route.params.contentType as ContentTypeSlug];
          return { title: ct ? `${ct.nameJa} モジュール` : 'モジュール' };
        }}
      />
      <Stack.Screen
        name="ModuleDetail"
        component={ModuleDetailScreen}
        options={{ title: 'Module' }}
      />
      <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: 'Lesson' }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
      <Stack.Screen
        name="QuizResults"
        component={QuizResultsScreen}
        options={{ title: 'Results', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
