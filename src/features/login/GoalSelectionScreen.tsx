// src/screens/GoalSelectionScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "GoalSelection">;
};

interface Goal {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const goals: Goal[] = [
  { id: "1", label: "Menurunkan Berat Badan", emoji: "⚖️", color: "#FFF3E0" },
  { id: "2", label: "Tetap Bugar", emoji: "💚", color: "#E8F5E9" },
  { id: "3", label: "Menjadi Lebih kuat", emoji: "💪", color: "#FFF8E1" },
  { id: "4", label: "Meningkatkan Massa Otot", emoji: "🏋️", color: "#E3F2FD" },
];

export default function GoalSelectionScreen({ navigation }: Props) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["1"]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat akun</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.stepLabel}>Langkah 3 dari 5</Text>
        <Text style={styles.title}>Pilih Tujuan Utama</Text>
        <Text style={styles.subtitle}>
          Pilih satu atau lebih tujuan untuk perjalanan sehatmu
        </Text>

        <View style={styles.goalsGrid}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: isSelected
                      ? Colors.primaryBg
                      : Colors.gray100,
                  },
                  isSelected && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.goalIconBox, { backgroundColor: goal.color }]}
                >
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.goalLabel,
                    isSelected && styles.goalLabelSelected,
                  ]}
                >
                  {goal.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedGoals.length === 0 && styles.nextButtonDisabled,
          ]}
          onPress={() => navigation.navigate("ActivityLevel")}
          disabled={selectedGoals.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Selanjutnya</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.levelText}>Lewati</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.gray400,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 21,
    marginBottom: 28,
  },
  goalsGrid: {
    gap: 14,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 14,
  },
  goalCardSelected: {
    borderColor: Colors.primary,
  },
  goalIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gray800,
  },
  goalLabelSelected: {
    color: Colors.primary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: 16,
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  nextButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  levelText: {
    fontSize: 13,
    color: Colors.gray400,
  },
});
