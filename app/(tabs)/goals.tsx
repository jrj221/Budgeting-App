import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/app/(tabs)/goals.styles';
import { GoalCard } from '@/components/goal-card';
import { GoalEditorSheet } from '@/components/goal-editor-sheet';
import { Palette } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useGoals } from '@/contexts/goals-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function GoalsScreen() {
  const { scheme } = useAppTheme();
  const { goals } = useGoals();
  const { getCategory } = useCategories();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const editingGoal = editingGoalId
    ? goals.find((g) => g.id === editingGoalId) ?? null
    : null;

  const openEditor = (goalId?: string) => {
    setEditingGoalId(goalId ?? null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingGoalId(null);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: scheme.background }]}
      edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: scheme.text }]}>Goals</Text>
            <Text style={[styles.subtitle, { color: scheme.textMuted }]}>
              Save toward something specific.
            </Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => openEditor()} hitSlop={6}>
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={28} color={Palette.iconMuted} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyBody}>
              Set a target amount and either a deadline or a weekly contribution. Each goal
              creates its own category so any transaction you log against it counts.
            </Text>
            <Pressable style={styles.emptyCta} onPress={() => openEditor()}>
              <Text style={styles.emptyCtaText}>Create a goal</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map((goal) => {
              const cat = getCategory(goal.categoryId);
              const color = cat?.color ?? Palette.brand;
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  color={color}
                  onEdit={() => openEditor(goal.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <GoalEditorSheet visible={editorOpen} goal={editingGoal} onClose={closeEditor} />
    </SafeAreaView>
  );
}
