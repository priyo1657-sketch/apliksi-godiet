// src/screens/TrainingPlanScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TrainingPlan">;
};

const CIRCLE_SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TrainingPlanScreen({ navigation }: Props) {
  const [progress, setProgress] = useState(0);
  const animProgress = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(animProgress, {
      toValue: 100,
      duration: 2000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    animProgress.addListener(({ value }) => {
      setProgress(Math.round(value));
    });

    return () => animProgress.removeAllListeners();
  }, [animProgress, opacityAnim]);

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
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
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "80%" }]} />
        </View>
        <Text style={styles.stepLabel}>Langkah 4 dari 5</Text>

        <Text style={styles.title}>
          Kami menyusun{"\n"}rencana pelatihan{"\n"}Anda
        </Text>
        <Text style={styles.subtitle}>
          Kami menyusun program latihan berdasarkan profil demografis, tingkat
          aktivitas, dan minat
        </Text>

        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
            {/* Background circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.gray200}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.progressLabel}>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
        </View>

        <Text style={styles.processingText}>
          {progress < 100 ? "Sedang memproses data Anda..." : "Selesai! ✓"}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.startButton,
            progress < 100 && styles.startButtonDisabled,
          ]}
          onPress={() => navigation.navigate("MoodSelection")}
          disabled={progress < 100}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Mulai</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.levelText}>Lewati</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 21,
    marginBottom: 40,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  svg: { position: "absolute" },
  progressLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercent: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.primary,
  },
  processingText: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.gray600,
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
  startButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  levelText: { fontSize: 13, color: Colors.gray400 },
});
