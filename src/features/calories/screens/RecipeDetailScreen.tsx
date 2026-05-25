// src/screens/RecipeDetailScreen.tsx
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useUser } from "../../../context/UserContext";
import { logMeal } from "../../../services/api";

type RootStackParamList = {
  RecipeDetail: { id?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "RecipeDetail">;

const MacroCircle = ({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) => {
  const size = 60,
    sw = 4,
    r = (size - sw) / 2,
    c = 2 * Math.PI * r;
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
          stroke="#E0E0E0"
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
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#333" }}>
        {percent}%
      </Text>
    </View>
  );
};

const ingredients = [
  { id: 1, name: "Lettuce Chopped", weight: "150 gr", img: "🥬" },
  { id: 2, name: "Diced Tomatoes", weight: "150 gr", img: "🍅" },
  { id: 3, name: "Cheddar Cheese", weight: "150 gr", img: "🧀" },
  { id: 4, name: "Frozen Avocado", weight: "150 gr", img: "🥑" },
];

export default function RecipeDetailScreen({ navigation, route }: Props) {
  const { user } = useUser();

  const handleAddToDietPlan = () => {
    if (!user) return;

    Alert.alert(
      "Add to Diet Plan",
      "Pilih waktu makan untuk resep ini:",
      [
        {
          text: "Sarapan 🌅",
          onPress: () => saveMealToBackend("Sarapan")
        },
        {
          text: "Makan Siang ☀️",
          onPress: () => saveMealToBackend("Makan Siang")
        },
        {
          text: "Makan Malam 🌙",
          onPress: () => saveMealToBackend("Makan Malam")
        },
        {
          text: "Batal",
          style: "cancel"
        }
      ],
      { cancelable: true }
    );
  };

  const saveMealToBackend = async (kategoriWaktu: 'Sarapan' | 'Makan Siang' | 'Makan Malam') => {
    if (!user) return;
    try {
      await logMeal({
        id_user: user.id_user,
        nama_makanan: "Avocado Chicken Salad",
        kalori: 485,
        karbohidrat: 55,
        protein: 35,
        lemak: 10,
        kategori_waktu: kategoriWaktu
      });
      Alert.alert("Sukses", `Resep "Avocado Chicken Salad" berhasil dicatat sebagai ${kategoriWaktu}!`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal", e.message || "Gagal mencatat asupan makanan");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.headerBackground}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="heart" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
            }}
            style={styles.foodImage}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Avocado Chicken{"\n"}Salad</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>⏱ 20 min</Text>
              <Text style={styles.infoText}>🔥 485 kcal</Text>
              <Text style={styles.infoText}>📊 Easy</Text>
              <Text style={styles.infoText}>⭐ 4.5</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              Dibuat segar setiap hari dengan campuran selada khas kami, keju
              cheddar, tomat potong dadu, serta alpukat yang segar dan lembut.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <View style={styles.ingredientIconBox}>
                  <Text style={{ fontSize: 24 }}>{item.img}</Text>
                </View>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientWeight}>{item.weight}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { marginBottom: 100 }]}>
            <View style={styles.macroHeader}>
              <View>
                <Text style={styles.sectionTitle}>Salad Mix</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  1 Bowl (300 gr)
                </Text>
              </View>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#00B93F" }}
              >
                See Details
              </Text>
            </View>
            <View style={styles.macroGrid}>
              <View style={{ alignItems: "center" }}>
                <MacroCircle percent={46} color="#D1C4E9" />
                <Text style={styles.macroLabel}>Carbohydrates</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <MacroCircle percent={74} color="#8BC34A" />
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <MacroCircle percent={14} color="#FFCC80" />
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToDietPlan}>
          <Text style={styles.addButtonText}>Add to diet plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#00B93F" },
  headerBackground: {
    backgroundColor: "#00B93F",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    alignItems: "center",
    zIndex: 1,
  },
  headerNav: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  foodImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: -100,
    zIndex: 2,
  },
  contentContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 110,
    paddingHorizontal: 24,
    minHeight: "100%",
  },
  titleSection: { alignItems: "center", marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  infoRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  infoText: { fontSize: 12, color: "#666", fontWeight: "500" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  description: { fontSize: 13, color: "#666", lineHeight: 20 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ingredientIconBox: {
    width: 48,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  ingredientName: { flex: 1, fontSize: 14, fontWeight: "500", color: "#333" },
  ingredientWeight: { fontSize: 14, fontWeight: "600", color: "#333" },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  macroLabel: { fontSize: 11, color: "#666", marginTop: 8, fontWeight: "500" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  addButton: {
    backgroundColor: "#00B93F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  addButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
