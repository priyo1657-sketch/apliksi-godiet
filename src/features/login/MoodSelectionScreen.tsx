// src/screens/MoodSelectionScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

// Dimensions imported but not used for specific values

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "MoodSelection">;
};

interface Mood {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const moods: Mood[] = [
  { id: "1", label: "Happy", emoji: "😊", color: "#FFD700" },
  { id: "2", label: "Neutral", emoji: "😐", color: "#A8C8A0" },
  { id: "3", label: " Sad", emoji: "😔", color: "#6B9DC9" },
  { id: "4", label: "Tired", emoji: "😴", color: "#C9A87C" },
  { id: "5", label: "Angry", emoji: "😠", color: "#E07070" },
];

export default function MoodSelectionScreen({ navigation }: Props) {
  const [selectedMood, setSelectedMood] = useState<string>("1");

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

      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
        <Text style={styles.stepLabel}>Langkah 5 dari 5</Text>

        <Text style={styles.title}>
          Bagaimana kamu{"\n"}menggambarkan{"\n"}suasana hatimu?
        </Text>
        <Text style={styles.subtitle}>I Feel Happy</Text>

        {/* Selected mood large display */}
        <View style={styles.selectedMoodDisplay}>
          <Text style={styles.selectedMoodEmoji}>
            {moods.find((m) => m.id === selectedMood)?.emoji ?? "😊"}
          </Text>
          <View
            style={[
              styles.selectedMoodGlow,
              {
                backgroundColor:
                  moods.find((m) => m.id === selectedMood)?.color + "30",
              },
            ]}
          />
        </View>

        {/* Mood row */}
        <View style={styles.moodsRow}>
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodButton,
                selectedMood === mood.id && {
                  backgroundColor: mood.color + "30",
                  borderColor: mood.color,
                  transform: [{ scale: 1.15 }],
                },
              ]}
              onPress={() => setSelectedMood(mood.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Label */}
        <Text style={styles.moodLabel}>
          {moods.find((m) => m.id === selectedMood)?.label ?? "Happy"}
        </Text>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            // Navigate to Home / Dashboard after mood selection
            navigation.navigate("Home");
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Selanjutnya</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.levelText}>Lewati</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  backIcon: { fontSize: 18, color: Colors.textPrimary },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stepLabel: { fontSize: 12, color: Colors.gray400, marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray400,
    marginBottom: 32,
    fontStyle: "italic",
  },
  selectedMoodDisplay: {
    alignSelf: "center",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  selectedMoodEmoji: { fontSize: 72 },
  selectedMoodGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: -1,
  },
  moodsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  moodButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: Colors.gray100,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
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
  doneButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  levelText: { fontSize: 13, color: Colors.gray400 },
});
