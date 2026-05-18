// src/screens/HomeTabScreen.tsx
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useUser } from "../../../context/UserContext";
import Svg, { Circle, Polyline, Path } from "react-native-svg";
import { BorderRadius, Colors, Spacing } from "../../../theme/colors";

type RootStackParamList = {
  NotificationSettings: undefined;
  GetReady: undefined;
  Exercise: undefined;
  WorkoutDetail: undefined;
  RecipesList: undefined;
  RecipeDetail: { id?: string };
  TrainingPlan: undefined;
  MoodSelection: undefined;
  Scanner: undefined;
  BMRCalculator: undefined; // Tambahan rute
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

// --- Komponen Visual Bantuan --- //

function GaugeProgress({
  percent,
  size = 120,
  stroke = 12,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ height: size / 2 + stroke / 2, overflow: "hidden" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#CFA983"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation="-180"
          origin={`${cx},${cy}`}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#95D588"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-180"
          origin={`${cx},${cy}`}
        />
      </Svg>
    </View>
  );
}

function CircularProgress({
  percent,
  size = 60,
  stroke = 6,
  color = Colors.primary,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={Colors.gray200}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2},${size / 2}`}
      />
    </Svg>
  );
}

function TujuanPieChart({ size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2v10h10a10 10 0 1 1-10-10z"
        fill="none"
        stroke="#FFA726"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12L21.5 5.5"
        fill="none"
        stroke="#FFA726"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Layar Utama --- //

export const HomeTabScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, updateProfile, isDarkMode, moodEmoji } = useUser();
  const displayName = user?.nama ? user.nama.split(' ')[0] : 'Pengguna';

  // --- TEMA DINAMIS ---
  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    cardBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDarkMode ? "#A0A0A0" : "#757575",
    border: isDarkMode ? "#2C2C2C" : "#F5F5F5",
    subBg: isDarkMode ? "#242424" : "#F5F5F5",
    lightText: isDarkMode ? "#E0E0E0" : "#555555",
  };

  // State untuk modal TDEE
  const [tdeeModalVisible, setTdeeModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [genderInput, setGenderInput] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [activityInput, setActivityInput] = useState("sedentary");
  const [calculatedResult, setCalculatedResult] = useState<{ bmr: number; tdee: number } | null>(null);

  // --- LIVE HEART RATE SIMULATION ---
  const [heartRate, setHeartRate] = useState(72);
  const [ecgData, setEcgData] = useState([20, 20, 20, 20, 20, 20, 20, 20, 20, 20]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      // Fluktuasi detak jantung (68 - 78 bpm)
      setHeartRate(prev => {
        const diff = Math.random() > 0.5 ? 1 : -1;
        const next = prev + diff;
        return next < 68 ? 68 : next > 78 ? 78 : next;
      });

      // Geser data ECG untuk simulasi denyut nadi
      setEcgData(prev => {
        const nextData = [...prev.slice(1)];
        const pos = tick % 6;
        let val = 20; // baseline
        if (pos === 1) val = 4;   // Spike naik
        if (pos === 2) val = 34;  // Spike turun tajam
        if (pos === 3) val = 14;  // Pemulihan kecil
        
        nextData.push(val);
        return nextData;
      });
      tick++;
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const openTDEEModal = () => {
    // Isi otomatis berdasarkan profil yang ada
    setWeightInput(user?.berat_badan && user.berat_badan > 0 ? String(user.berat_badan) : "");
    setHeightInput(user?.tinggi_badan && user.tinggi_badan > 0 ? String(user.tinggi_badan) : "");
    setAgeInput(user?.usia && user.usia > 0 ? String(user.usia) : "");
    
    const isFemale = user?.jenis_kelamin?.toLowerCase() === "p" || user?.jenis_kelamin?.toLowerCase() === "perempuan";
    setGenderInput(isFemale ? "Perempuan" : "Laki-laki");

    const act = (user?.tingkat_aktivitas || "").toLowerCase();
    if (act.includes("ringan") || act.includes("light")) setActivityInput("light");
    else if (act.includes("sedang") || act.includes("moderate")) setActivityInput("moderate");
    else if (act.includes("aktif") || act.includes("heavy")) setActivityInput("active");
    else if (act.includes("sangat") || act.includes("extreme")) setActivityInput("very_active");
    else setActivityInput("sedentary");

    setCalculatedResult(null);
    setTdeeModalVisible(true);
  };

  const calculateTDEE = () => {
    const bb = Number(weightInput) || 0;
    const tb = Number(heightInput) || 0;
    const usia = Number(ageInput) || 0;

    if (bb <= 0 || tb <= 0 || usia <= 0) {
      Alert.alert("Input Tidak Valid", "Mohon isi berat badan, tinggi badan, dan usia dengan angka yang benar.");
      return;
    }

    // Mifflin-St Jeor Equation
    let bmr = (10 * bb) + (6.25 * tb) - (5 * usia);
    bmr += genderInput === "Laki-laki" ? 5 : -161;

    // Activity factor
    let activityFactor = 1.2;
    if (activityInput === "light") activityFactor = 1.375;
    else if (activityInput === "moderate") activityFactor = 1.55;
    else if (activityInput === "active") activityFactor = 1.725;
    else if (activityInput === "very_active") activityFactor = 1.9;

    const tdee = Math.round(bmr * activityFactor);

    setCalculatedResult({
      bmr: Math.round(bmr),
      tdee
    });
  };

  const applyCalorieTarget = async () => {
    if (!calculatedResult) return;

    try {
      // Map activity key back to Indonesian text
      let tingkatAktivitasIndo = "Sangat jarang olahraga (Sedentary)";
      if (activityInput === "light") tingkatAktivitasIndo = "Olahraga ringan (1-3 hari/minggu)";
      else if (activityInput === "moderate") tingkatAktivitasIndo = "Olahraga sedang (3-5 hari/minggu)";
      else if (activityInput === "active") tingkatAktivitasIndo = "Olahraga berat (6-7 hari/minggu)";
      else if (activityInput === "very_active") tingkatAktivitasIndo = "Sangat aktif / Atlet";

      const success = await updateProfile({
        berat_badan: Number(weightInput),
        tinggi_badan: Number(heightInput),
        usia: Number(ageInput),
        jenis_kelamin: genderInput,
        tingkat_aktivitas: tingkatAktivitasIndo,
        target_kalori_harian: calculatedResult.tdee,
      });

      if (success) {
        Alert.alert(
          "Berhasil Disinkronkan! ✅", 
          `Target kalori harian Anda berhasil diperbarui menjadi ${calculatedResult.tdee} KCAL.\n\nPerubahan ini telah disesuaikan dengan bagian "My Calories" di dashboard kalori Anda!`
        );
        setTdeeModalVisible(false);
      } else {
        Alert.alert("Error", "Gagal memperbarui target kalori di server.");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan target kalori.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {user?.foto_profil ? (
            <Image source={{ uri: user.foto_profil }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🧑‍💻</Text>
            </View>
          )}
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>Hi, {displayName}</Text>
            <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
              Siap mencapai target kalorimu hari ini?
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate("NotificationSettings")}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Plan Card */}
      <TouchableOpacity
        style={styles.planCard}
        onPress={() => navigation.navigate("Exercise")}
      >
        <View style={styles.planTextContainer}>
          <Text style={styles.planTitle}>Rencanaku{"\n"}Untuk Hari Ini</Text>
        </View>
        <View style={styles.gaugeContainer}>
          <GaugeProgress percent={70} size={140} stroke={12} />
          <Text style={styles.planPercentOverlay}>70%</Text>
        </View>
      </TouchableOpacity>

      {/* Stats Container (Baris 1 & 2 digabung dalam container) */}
      <View style={styles.statsContainer}>
        {/* Kolom Kiri */}
        <View style={{ flex: 1, gap: Spacing.md }}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Kalori</Text>
            <View
              style={{
                marginTop: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress
                percent={46}
                size={52}
                stroke={5}
                color={Colors.primary}
              />
              <Text
                style={{
                  position: "absolute",
                  fontSize: 11,
                  fontWeight: "700",
                  color: theme.text,
                }}
              >
                46%
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                paddingHorizontal: 16,
              }}
            >
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tujuan</Text>
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </View>
            <View
              style={{
                marginTop: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TujuanPieChart size={48} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>⚖️ {user?.berat_badan || 57} Kg</Text>
          </View>
        </View>

        {/* Kolom Kanan */}
        <View style={{ flex: 1.4, gap: Spacing.md }}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDarkMode ? "#2D1D1D" : "#FFF0F0",
                borderColor: isDarkMode ? "#4A1F1F" : "#FFE5E5",
                alignItems: "flex-start",
                paddingHorizontal: 16,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={{ fontSize: 16 }}>❤️</Text>
              <Text style={[styles.statLabel, { marginTop: 0, color: isDarkMode ? "#FFA0A0" : "#E53935" }]}>
                Detak Jantung
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "#E53935",
                fontWeight: "700",
                marginTop: 8,
              }}
            >
              {heartRate} bpm
            </Text>
            <Svg width="100%" height={36} style={{ marginTop: 4 }}>
              <Polyline
                points={ecgData.map((y, idx) => `${idx * 14},${y}`).join(" ")}
                fill="none"
                stroke="#E53935"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                alignItems: "flex-start",
                paddingHorizontal: 16,
              },
            ]}
          >
            <Text style={[styles.statLabel, { marginTop: 0, marginBottom: 8, color: theme.textSecondary }]}>
              Aktivitas
            </Text>
            <Svg width="100%" height={44}>
              <Polyline
                points="0,38 12,28 22,30 32,18 44,24 56,10 68,16 80,8 90,12"
                fill="none"
                stroke={Colors.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.statValue, { color: theme.text }]}>10 km • 25000 langkah</Text>
          </View>
        </View>
      </View>

      {/* --- FITUR BARU BERDASARKAN STYLE YANG TERSEDIA --- */}

      {/* Seksi Menu Rekomendasi (Random Sampling Menu) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rekomendasi Menu GO DIET</Text>
        <TouchableOpacity
          style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => navigation.navigate("RecipesList")}
        >
          <Text style={styles.menuEmoji}>🥗</Text>
          <View style={styles.menuContent}>
            <Text style={[styles.menuName, { color: theme.text }]}>Salad Ayam Panggang</Text>
            <Text style={[styles.menuKcal, { color: theme.textSecondary }]}>Tinggi Protein • 320 Kcal</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Seksi Latihan / Workout */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Latihan Fisik</Text>
        <TouchableOpacity
          style={[styles.workoutCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => navigation.navigate("WorkoutDetail")}
        >
          <Text style={styles.workoutEmoji}>🏃‍♂️</Text>
          <View style={styles.workoutContent}>
            <Text style={[styles.workoutName, { color: theme.text }]}>Latihan Pinggul & Kardio</Text>
            <Text style={[styles.workoutSets, { color: theme.textSecondary }]}>
              25% Selesai • 15 Menit tersisa
            </Text>
          </View>
          <View style={styles.startBtn}>
            <Text style={styles.startBtnText}>▶</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Seksi Aksi Cepat / Fitur Utama */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Aksi Cepat</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => navigation.navigate("Scanner")}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Scan Makanan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={openTDEEModal}>
            <Text style={styles.actionIcon}>🧮</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Hitung TDEE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => navigation.navigate("TrainingPlan")}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Jadwal Program</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => navigation.navigate("MoodSelection")}
          >
            <Text style={styles.actionIcon}>{moodEmoji || "😊"}</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Catat Jurnal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL HITUNG TDEE */}
      <Modal
        visible={tdeeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTdeeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.tdeeModalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Kalkulator TDEE 🧮</Text>
              <TouchableOpacity onPress={() => setTdeeModalVisible(false)}>
                <Text style={styles.closeModalBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              
              {/* Jenis Kelamin */}
              <Text style={styles.modalLabel}>Jenis Kelamin</Text>
              <View style={styles.genderSelectRow}>
                {["Laki-laki", "Perempuan"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderSelectChip,
                      genderInput === g && styles.genderSelectChipActive
                    ]}
                    onPress={() => setGenderInput(g as any)}
                  >
                    <Text style={[
                      styles.genderSelectText,
                      genderInput === g && styles.genderSelectTextActive
                    ]}>{g === "Laki-laki" ? "♂️ Laki-laki" : "♀️ Perempuan"}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Form Baris Berat & Tinggi */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Berat Badan (kg)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Contoh: 60"
                    keyboardType="numeric"
                    value={weightInput}
                    onChangeText={setWeightInput}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Tinggi Badan (cm)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Contoh: 165"
                    keyboardType="numeric"
                    value={heightInput}
                    onChangeText={setHeightInput}
                  />
                </View>
              </View>

              {/* Usia */}
              <Text style={styles.modalLabel}>Usia (Tahun)</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Contoh: 23"
                keyboardType="numeric"
                value={ageInput}
                onChangeText={setAgeInput}
              />

              {/* Tingkat Aktivitas */}
              <Text style={styles.modalLabel}>Tingkat Aktivitas Harian</Text>
              <View style={styles.activityOptionsColumn}>
                {[
                  { key: "sedentary", label: "Sangat jarang olahraga (Sedentary)" },
                  { key: "light", label: "Olahraga ringan (1-3 hari/minggu)" },
                  { key: "moderate", label: "Olahraga sedang (3-5 hari/minggu)" },
                  { key: "active", label: "Olahraga berat (6-7 hari/minggu)" },
                  { key: "very_active", label: "Sangat aktif / Atlet" },
                ].map((act) => (
                  <TouchableOpacity
                    key={act.key}
                    style={[
                      styles.activityOptionRow,
                      activityInput === act.key && styles.activityOptionRowActive
                    ]}
                    onPress={() => setActivityInput(act.key)}
                  >
                    <Text style={[
                      styles.activityOptionText,
                      activityInput === act.key && styles.activityOptionTextActive
                    ]}>{act.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.calculateBtn} onPress={calculateTDEE}>
                <Text style={styles.calculateBtnText}>Hitung TDEE</Text>
              </TouchableOpacity>

              {/* TAMPILAN HASIL */}
              {calculatedResult && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultBmrText}>BMR Anda: {calculatedResult.bmr} kcal/hari</Text>
                  <Text style={styles.resultTdeeVal}>🔥 {calculatedResult.tdee} kcal/hari</Text>
                  <Text style={styles.resultTdeeDesc}>
                    Ini adalah jumlah kalori ideal yang Anda bakar setiap hari berdasarkan aktivitas Anda.
                  </Text>

                  <TouchableOpacity style={styles.syncBtn} onPress={applyCalorieTarget}>
                    <Text style={styles.syncBtnText}>Jadikan Target Kalori Saya 🎯</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: { fontSize: 22 },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subGreeting: { fontSize: 13, color: Colors.textSecondary },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: { fontSize: 20 },

  planCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  planTextContainer: { flex: 1, height: 80, justifyContent: "flex-start" },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 26,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    height: 80,
  },
  planPercentOverlay: {
    position: "absolute",
    bottom: -5,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
  },

  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    paddingVertical: Spacing.md,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  statEmoji: { fontSize: 20 },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 8,
    fontWeight: "500",
  },

  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  menuEmoji: { fontSize: 32 },
  menuContent: { flex: 1 },
  menuName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  menuKcal: { fontSize: 13, color: Colors.textSecondary },
  menuArrow: { fontSize: 20, color: Colors.primary, fontWeight: "bold" },

  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  workoutEmoji: { fontSize: 32 },
  workoutContent: { flex: 1 },
  workoutName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  workoutSets: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  startBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: { fontSize: 14, color: Colors.white },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  actionCard: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },

  // STYLING MODAL TDEE
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  tdeeModalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeModalBtn: {
    fontSize: 20,
    color: "#888",
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginTop: 12,
  },
  genderSelectRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  genderSelectChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  genderSelectChipActive: {
    borderColor: "#00B93F",
    backgroundColor: "#E8F9EE",
  },
  genderSelectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  genderSelectTextActive: {
    color: "#00B93F",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTextInput: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#FFF",
    color: "#333",
  },
  activityOptionsColumn: {
    gap: 8,
    marginBottom: 16,
  },
  activityOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9F9",
  },
  activityOptionRowActive: {
    borderColor: "#00B93F",
    backgroundColor: "#E8F9EE",
  },
  activityOptionText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  activityOptionTextActive: {
    color: "#00B93F",
    fontWeight: "600",
  },
  calculateBtn: {
    backgroundColor: "#00B93F",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  calculateBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  resultBox: {
    backgroundColor: "#F4FDF7",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#D3F2DC",
    alignItems: "center",
  },
  resultBmrText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  resultTdeeVal: {
    fontSize: 26,
    fontWeight: "800",
    color: "#00B93F",
    marginBottom: 8,
  },
  resultTdeeDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  syncBtn: {
    backgroundColor: "#00B93F",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  syncBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
