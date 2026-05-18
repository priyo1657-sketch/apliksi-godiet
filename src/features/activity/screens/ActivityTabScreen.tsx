import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { RootStackParamList } from "../../../../App";
import { useUser } from "../../../context/UserContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Komponen Lingkaran Progress (Untuk Workout Goals)
function ProgressCircle({
  percent,
  size = 46,
}: {
  percent: number;
  size?: number;
}) {
  const { isDarkMode } = useUser();
  const sw = 3; // Stroke width
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={isDarkMode ? "#333" : "#E0E0E0"}
          strokeWidth={sw}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#00B93F" // Hijau
          strokeWidth={sw}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (percent / 100) * c}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 12, fontWeight: "700", color: isDarkMode ? "#FFF" : "#333" }}>
        {percent}%
      </Text>
    </View>
  );
}

export const ActivityTabScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, workoutHistory, deleteWorkoutHistory, isDarkMode } = useUser();
  const displayName = user?.nama ? user.nama.split(' ')[0] : 'Pengguna';

  // --- TEMA DINAMIS ---
  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDarkMode ? "#A0A0A0" : "#757575",
    border: isDarkMode ? "#2C2C2C" : "#F0F0F0",
    cardBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    circleBg: isDarkMode ? "#2C2C2C" : "#E0E0E0",
  };

  const handleDeleteHistory = (id: string) => {
    Alert.alert(
      "Hapus Riwayat 🗑️",
      "Apakah Anda yakin ingin menghapus catatan latihan ini? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: () => deleteWorkoutHistory(id) 
        }
      ]
    );
  };

  // Calculate totals from history
  const totalBurned = workoutHistory.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
  const totalWorkouts = workoutHistory.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: user?.foto_profil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={[styles.name, { color: theme.text }]}>Hi, {displayName}</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>Today, 4 Aug</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          {/* 🔴 Ganti emoji dengan Feather Icons */}
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="search" size={24} color={isDarkMode ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={24} color={isDarkMode ? "#FFF" : "#333"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Progress Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly prosess</Text>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Berat 👏</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user?.berat_badan || 0} kg</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Kalori{"\n"}Terbakar 🔥</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{totalBurned}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Olahraga 🏃</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{totalWorkouts}</Text>
          </View>
        </View>

        {/* Green Progress Card */}
        <TouchableOpacity
          style={styles.greenCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WorkoutDetail")}
        >
          <View style={styles.greenCardHeader}>
            <View>
              <Text style={styles.greenCardTitle}>Latihan Pinggul</Text>
              <Text style={styles.greenCardSubtitle}>25% Completed</Text>
            </View>
            <View style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Start</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "25%" }]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Today's Workout Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today workout</Text>
          <TouchableOpacity>
            <Feather name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={{ paddingRight: 40 }} // 🔴 Mencegah kartu terakhir terpotong di ujung kanan
        >
          {[1, 2].map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("GetReady")}
            >
              <ImageBackground
                source={{
                  uri: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=500&fit=crop",
                }}
                style={styles.workoutCard}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.workoutCardOverlay}>
                  <Text style={styles.workoutCardTitle}>Pemanasan</Text>
                  <View style={styles.workoutCardInfo}>
                    <Text style={styles.workoutCardInfoText}>⏱ 25 min</Text>
                    <Text style={styles.workoutCardInfoText}>🔥 230 kcal</Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Workout History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Riwayat Olahraga</Text>
        </View>

        {workoutHistory.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ color: "#888" }}>Belum ada riwayat olahraga.</Text>
          </View>
        ) : (
          workoutHistory.map((item) => {
            const d = new Date(item.date);
            const dateString = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
            const timeString = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            
            return (
              <View key={item.id} style={[styles.goalItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.historyIconWrapper, { backgroundColor: isDarkMode ? "#1A2E20" : "#E8FDF0" }]}>
                  <Feather name="activity" size={24} color="#00B93F" />
                </View>
                <View style={styles.goalTextContainer}>
                  <Text style={[styles.goalTitle, { color: theme.text }]}>{dateString} - {timeString}</Text>
                  <Text style={[styles.goalTime, { color: theme.textSecondary }]}>
                    {item.totalTimeSeconds} dtk • {item.caloriesBurned} kcal
                  </Text>
                  <Text style={[styles.historyDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                    Selesai s.d: {item.exercisesCompleted[item.exercisesCompleted.length - 1]}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteHistory(item.id)} 
                  activeOpacity={0.7}
                  style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}
                >
                  <Feather name="trash-2" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Bottom Banner */}
      <View style={styles.section}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("GetReady")}
        >
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop",
            }}
            style={styles.bannerCard}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Day 01 - Pemanasan</Text>
              <Text style={styles.bannerTime}>07.00 - 08.00 AM</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 16, // Sedikit diperlebar jarak antar icon
  },
  iconBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    minHeight: 34,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  greenCard: {
    backgroundColor: "#00B93F",
    borderRadius: 16,
    padding: 16,
    // 🔴 Tambahan Shadow agar kartu terlihat sedikit mengambang
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greenCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greenCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  greenCardSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  nextBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  nextBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00B93F",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  workoutCard: {
    width: 160,
    height: 180,
    marginRight: 16,
    justifyContent: "flex-end",
  },
  workoutCardOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
  },
  workoutCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  workoutCardInfo: {
    flexDirection: "row",
    gap: 8,
  },
  workoutCardInfoText: {
    color: "#E0E0E0",
    fontSize: 10,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  goalImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
  },
  historyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0F2E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  historyDetails: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  goalTime: {
    fontSize: 12,
    color: "#888",
  },
  bannerCard: {
    width: "100%",
    height: 120,
    justifyContent: "flex-end",
  },
  bannerOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  bannerTime: {
    color: "#E0E0E0",
    fontSize: 12,
  },
});
