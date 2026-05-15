// src/screens/ActivityLevelScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ActivityLevel">;
};

// ── Data Ranges ─────────────────────────────────────────────────────
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 210;
const heights = Array.from({ length: HEIGHT_MAX - HEIGHT_MIN + 1 }, (_, i) => i + HEIGHT_MIN);

const WEIGHT_MIN = 30;
const WEIGHT_MAX = 150;
const weights = Array.from({ length: WEIGHT_MAX - WEIGHT_MIN + 1 }, (_, i) => i + WEIGHT_MIN);

// ── Pilihan Aktivitas ───────────────────────────────────────────────
const activityOptions = [
  {
    key: "sedentary",
    label: "Jarang Olahraga",
    description: "Duduk seharian, tidak ada olahraga",
    emoji: "🪑",
  },
  {
    key: "light",
    label: "Aktivitas Ringan",
    description: "Olahraga ringan 1-3 kali/minggu",
    emoji: "🚶",
  },
  {
    key: "moderate",
    label: "Aktivitas Sedang",
    description: "Olahraga sedang 3-5 kali/minggu",
    emoji: "🏃",
  },
  {
    key: "active",
    label: "Aktivitas Berat",
    description: "Olahraga berat 5-7 kali/minggu",
    emoji: "🏋️",
  },
  {
    key: "very_active",
    label: "Sangat Aktif",
    description: "Latihan sangat berat / atlet profesional",
    emoji: "⚡",
  },
];

// ── Konstanta UI ruler ──────────────────────────────────────────────
const TICK_WIDTH = 12; // lebar per tick di ruler (height & weight)
const TICK_GAP = 4;
const TICK_TOTAL = TICK_WIDTH + TICK_GAP;

export default function ActivityLevelScreen({ navigation }: Props) {
  const [selectedHeight, setSelectedHeight] = useState(170);
  const [selectedWeight, setSelectedWeight] = useState(64);
  const [selectedActivity, setSelectedActivity] = useState(activityOptions[2]);
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  const heightScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);

  // ── Scroll handler untuk height ruler ─────────────────────────────
  const handleHeightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / TICK_TOTAL);
    const clamped = Math.max(0, Math.min(index, heights.length - 1));
    setSelectedHeight(heights[clamped]);
  };

  // ── Scroll handler untuk weight ruler ─────────────────────────────
  const handleWeightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / TICK_TOTAL);
    const clamped = Math.max(0, Math.min(index, weights.length - 1));
    setSelectedWeight(weights[clamped]);
  };

  // ── Konversi cm → ft'in" untuk display ────────────────────────────
  const cmToFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  // ── Konversi kg → lbs ─────────────────────────────────────────────
  const kgToLbs = (kg: number) => {
    return Math.round(kg * 2.20462);
  };

  return (
    <View style={styles.container}>
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
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "40%" }]} />
        </View>
        <Text style={styles.stepLabel}>Langkah 2 dari 5</Text>

        {/* ═══════ Tinggi Badan ═══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tinggi Badan</Text>
          </View>

          {/* Nilai utama cm + konversi ft */}
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>{selectedHeight}</Text>
            <Text style={styles.mainUnit}>cm</Text>
          </View>
          <Text style={styles.subConversion}>≈ {cmToFtIn(selectedHeight)}</Text>

          {/* Horizontal scroll ruler */}
          <View style={styles.rulerWrapper}>
            <View style={styles.rulerCenter} />
            <ScrollView
              ref={heightScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={TICK_TOTAL}
              decelerationRate="fast"
              onMomentumScrollEnd={handleHeightScroll}
              onScrollEndDrag={handleHeightScroll}
              contentContainerStyle={[
                styles.rulerContent,
                { paddingHorizontal: 150 }, // center offset
              ]}
            >
              {heights.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.rulerTick, { width: TICK_TOTAL }]}
                  onPress={() => {
                    setSelectedHeight(h);
                    const idx = h - HEIGHT_MIN;
                    heightScrollRef.current?.scrollTo({
                      x: idx * TICK_TOTAL,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.tickLine,
                      {
                        height: h % 10 === 0 ? 32 : h % 5 === 0 ? 22 : 14,
                        backgroundColor:
                          h === selectedHeight ? Colors.primary : Colors.gray200,
                        width: h === selectedHeight ? 3 : h % 10 === 0 ? 2 : 1.5,
                      },
                    ]}
                  />
                  {h % 10 === 0 && <Text style={styles.tickLabel}>{h}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ═══════ Berat Badan ═══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Berat Badan</Text>
          </View>

          {/* Nilai utama kg + konversi lbs */}
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>{selectedWeight}</Text>
            <Text style={styles.mainUnit}>kg</Text>
          </View>
          <Text style={styles.subConversion}>≈ {kgToLbs(selectedWeight)} lbs</Text>

          {/* Horizontal scroll ruler untuk berat */}
          <View style={styles.rulerWrapper}>
            <View style={styles.rulerCenter} />
            <ScrollView
              ref={weightScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={TICK_TOTAL}
              decelerationRate="fast"
              onMomentumScrollEnd={handleWeightScroll}
              onScrollEndDrag={handleWeightScroll}
              contentContainerStyle={[
                styles.rulerContent,
                { paddingHorizontal: 150 },
              ]}
            >
              {weights.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.rulerTick, { width: TICK_TOTAL }]}
                  onPress={() => {
                    setSelectedWeight(w);
                    const idx = w - WEIGHT_MIN;
                    weightScrollRef.current?.scrollTo({
                      x: idx * TICK_TOTAL,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.tickLine,
                      {
                        height: w % 10 === 0 ? 32 : w % 5 === 0 ? 22 : 14,
                        backgroundColor:
                          w === selectedWeight ? Colors.primary : Colors.gray200,
                        width: w === selectedWeight ? 3 : w % 10 === 0 ? 2 : 1.5,
                      },
                    ]}
                  />
                  {w % 10 === 0 && <Text style={styles.tickLabel}>{w}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ═══════ Aktivitas ═══════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih aktivitas Anda</Text>
          <TouchableOpacity
            style={styles.activityPicker}
            onPress={() => setShowActivityPicker(true)}
          >
            <Text style={styles.activityEmoji}>{selectedActivity.emoji}</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>{selectedActivity.label}</Text>
              <Text style={styles.activityDesc} numberOfLines={1}>
                {selectedActivity.description}
              </Text>
            </View>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate("TrainingPlan")}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Selanjutnya</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.levelText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* ═══════ Modal Pilih Aktivitas ═══════ */}
      <Modal
        visible={showActivityPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActivityPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActivityPicker(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle}>Pilih Level Aktivitas</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activityOptions.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.activityOption,
                    selectedActivity.key === item.key &&
                      styles.activityOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedActivity(item);
                    setShowActivityPicker(false);
                  }}
                >
                  <Text style={styles.activityOptionEmoji}>{item.emoji}</Text>
                  <View style={styles.activityOptionInfo}>
                    <Text
                      style={[
                        styles.activityOptionLabel,
                        selectedActivity.key === item.key &&
                          styles.activityOptionLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.activityOptionDesc}>
                      {item.description}
                    </Text>
                  </View>
                  {selectedActivity.key === item.key && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
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
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // ── Value display ─────────────────────────────────────────────────
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.primary,
    textAlign: "center",
  },
  mainUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray400,
  },
  subConversion: {
    fontSize: 13,
    color: Colors.gray400,
    textAlign: "center",
    marginBottom: 12,
  },

  // ── Ruler (shared height & weight) ────────────────────────────────
  rulerWrapper: {
    position: "relative",
    height: 65,
    marginHorizontal: -Spacing.lg,
  },
  rulerCenter: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 20,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    zIndex: 10,
  },
  rulerContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
  },
  rulerTick: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  tickLine: { borderRadius: 2 },
  tickLabel: { fontSize: 10, color: Colors.gray400, marginTop: 4 },

  // ── Activity Picker ───────────────────────────────────────────────
  activityPicker: {
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  activityDesc: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 2,
  },
  dropdownIcon: { fontSize: 12, color: Colors.gray400 },

  // ── Bottom ────────────────────────────────────────────────────────
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
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  levelText: { fontSize: 13, color: Colors.gray400 },

  // ── Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: "100%",
    maxHeight: "70%",
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  activityOptionSelected: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 0,
  },
  activityOptionEmoji: {
    fontSize: 28,
  },
  activityOptionInfo: {
    flex: 1,
  },
  activityOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  activityOptionLabelSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  activityOptionDesc: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "700",
  },
});
