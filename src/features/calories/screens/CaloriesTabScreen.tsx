// src/screens/CaloriesDashboardScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useUser } from "../../../context/UserContext";
import { getTodayMeals } from "../../../services/api";

// Komponen Gauge Setengah Lingkaran
const SemiCircleGauge = ({ percent, targetKcal }: { percent: number; targetKcal: number }) => {
  const size = 200,
    sw = 12,
    r = (size - sw) / 2,
    cy = r + sw / 2;
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const d = `M ${sw / 2} ${cy} A ${r} ${r} 0 0 1 ${size - sw / 2} ${cy}`;

  return (
    <View style={{ width: size, height: cy + 10, alignItems: "center" }}>
      <Svg width={size} height={cy + 10}>
        <Path
          d={d}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={d}
          stroke="#FFCA28"
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={{ position: "absolute", bottom: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFF" }}>
          {targetKcal}
        </Text>
        <Text style={{ fontSize: 12, color: "#FFF", fontWeight: "600" }}>
          KCAL
        </Text>
      </View>
    </View>
  );
};

// Komponen Lingkaran Penuh Makro
const MacroCircle = ({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) => {
  const size = 56,
    sw = 4,
    r = (size - sw) / 2,
    c = 2 * Math.PI * r;
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={sw}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (percent / 100) * c}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFF" }}>
        {percent}%
      </Text>
    </View>
  );
};

export const CaloriesTabScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isDarkMode } = useUser();
  const displayName = user?.nama ? user.nama.split(' ')[0] : 'Pengguna';

  const [loading, setLoading] = useState(false);
  const [totalNutrisi, setTotalNutrisi] = useState({
    total_kalori: 0,
    total_karbohidrat: 0,
    total_protein: 0,
    total_lemak: 0
  });
  const [mealsToday, setMealsToday] = useState<any[]>([]);

  const fetchMealsToday = useCallback(async () => {
    if (!user?.id_user) return;
    try {
      setLoading(true);
      const res = await getTodayMeals(user.id_user);
      if (res.success) {
        setTotalNutrisi(res.summary);
        setMealsToday(res.meals);
      }
    } catch (e: any) {
      console.log('[CaloriesTabScreen] Gagal memuat data kalori:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchMealsToday();
    }, [fetchMealsToday])
  );

  const getCategoryCalories = (category: string) => {
    return mealsToday
      .filter((m) => m.kategori_waktu === category)
      .reduce((sum, m) => sum + m.kalori, 0);
  };

  // --- TEMA DINAMIS ---
  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDarkMode ? "#A0A0A0" : "#757575",
    border: isDarkMode ? "#2C2C2C" : "#F0F0F0",
    cardBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    imgBg: isDarkMode ? "#2C2C2C" : "#F5F5F5",
  };
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <Feather name="bell" size={24} color={isDarkMode ? "#FFFFFF" : "#333"} />
      </View>

      <View style={styles.greenCard}>
        <Text style={styles.cardTitle}>My Calories </Text>
        {(() => {
          const targetKcal = user?.target_kalori_harian && user.target_kalori_harian > 0 
            ? Math.round(user.target_kalori_harian) 
            : 2000;

          const targetCarbs = Math.round((targetKcal * 0.5) / 4);
          const targetProtein = Math.round((targetKcal * 0.3) / 4);
          const targetFats = Math.round((targetKcal * 0.2) / 9);

          const consumedKcal = totalNutrisi.total_kalori;
          const consumedCarbs = totalNutrisi.total_karbohidrat;
          const consumedProtein = totalNutrisi.total_protein;
          const consumedFats = totalNutrisi.total_lemak;

          const percentKcal = Math.min(100, Math.round((consumedKcal / targetKcal) * 100));
          const percentCarbs = Math.min(100, Math.round((consumedCarbs / targetCarbs) * 100));
          const percentProtein = Math.min(100, Math.round((consumedProtein / targetProtein) * 100));
          const percentFats = Math.min(100, Math.round((consumedFats / targetFats) * 100));

          return (
            <>
              {/* Progress Ring Utama */}
              <View style={styles.gaugeContainer}>
                <SemiCircleGauge percent={percentKcal} targetKcal={targetKcal} />
              </View>

              {/* Detail Makronutrisi */}
              <View style={styles.macrosRow}>
                <View style={styles.macroItem}>
                  <MacroCircle percent={percentCarbs} color="#FFE082" />
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>
                    {consumedCarbs}/{targetCarbs}g
                  </Text>
                </View>

                <View style={styles.macroItem}>
                  <MacroCircle percent={percentProtein} color="#81C784" />
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroVal}>
                    {consumedProtein}/{targetProtein}g
                  </Text>
                </View>

                <View style={styles.macroItem}>
                  <MacroCircle percent={percentFats} color="#FF8A65" />
                  <Text style={styles.macroLabel}>Fats</Text>
                  <Text style={styles.macroVal}>
                    {consumedFats}/{targetFats}g
                  </Text>
                </View>
              </View>
            </>
          );
        })()}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Meals today</Text>
        <Text style={styles.seeAll}>All</Text>
      </View>

      {["Sarapan", "Makan Siang", "Makan Malam"].map((catName, index) => {
        const kcal = getCategoryCalories(catName);
        return (
          <TouchableOpacity
            key={index}
            style={[styles.mealCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("RecipesList")} 
          >
            <View style={[styles.mealImagePlaceholder, { backgroundColor: theme.imgBg }]}>
              <Text style={{ fontSize: 20 }}>
                {index === 0 ? "🌅" : index === 1 ? "☀️" : "🌙"}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.mealName, { color: theme.text }]}>
                {catName}
              </Text>
              <Text style={styles.mealKcal}>{Math.round(kcal)} Kcal</Text>
            </View>

            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { fontSize: 16, fontWeight: "700", color: "#333" },
  date: { fontSize: 12, color: "#888" },
  greenCard: {
    backgroundColor: "#00B93F",
    borderRadius: 20,
    margin: 20,
    padding: 20,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  gaugeContainer: { alignItems: "center", marginBottom: 20 },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  macroItem: { alignItems: "center" },
  macroLabel: { fontSize: 11, color: "#FFF", fontWeight: "600", marginTop: 8 },
  macroVal: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  seeAll: { fontSize: 12, color: "#888" },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  mealImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  mealName: { fontSize: 15, fontWeight: "600", color: "#333" },
  mealKcal: { fontSize: 13, color: "#FFCA28", marginTop: 4, fontWeight: "500" },
});
