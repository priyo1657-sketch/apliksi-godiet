import React, { ComponentProps } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Spacing } from "../../theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";

export type TabName = "Home" | "Calories" | "Scanner" | "Activity" | "Profile";

export interface BottomTabProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

// Mengambil tipe nama ikon langsung dari library agar TypeScript tidak protes
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Tab = {
  name: TabName;
  label: string;
  iconName: IconName;
};

const tabs: Tab[] = [
  { name: "Home", label: "Home", iconName: "home-outline" },
  { name: "Calories", label: "Calories", iconName: "pot-steam-outline" },
  { name: "Scanner", label: "Scanner", iconName: "line-scan" }, // Bisa pakai line-scan atau scan-helper
  { name: "Activity", label: "Activity", iconName: "dumbbell" },
  { name: "Profile", label: "Profile", iconName: "account-outline" },
];

export const BottomTabNavigator: React.FC<BottomTabProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { isDarkMode } = useUser();

  const theme = {
    bg: isDarkMode ? "#1A1A1A" : Colors.white,
    border: isDarkMode ? "#2C2C2C" : (Colors.gray100 || "#F0F0F0"),
    floatingBorder: isDarkMode ? "#1A1A1A" : "#FFFFFF",
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <View style={[styles.container, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;

          // ===== TAMPILAN KHUSUS UNTUK TOMBOL SCANNER (TENGAH) =====
          if (tab.name === "Scanner") {
            return (
              <View key={tab.name} style={styles.floatingButtonContainer}>
                <TouchableOpacity
                  style={[styles.floatingButton, { borderColor: theme.floatingBorder }]}
                  onPress={() => onTabChange(tab.name)}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons
                    name={tab.iconName}
                    size={28}
                    color="#FFFFFF" // Ikon warna putih
                  />
                </TouchableOpacity>
              </View>
            );
          }

          // ===== TAMPILAN UNTUK TOMBOL BIASA (HOME, CALORIES, DLL) =====
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => onTabChange(tab.name)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.iconName}
                size={26}
                color={isActive ? "#4CAF50" : (isDarkMode ? "#777777" : "#A0A0A0")} // Hijau jika aktif
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? "#4CAF50" : (isDarkMode ? "#777777" : "#A0A0A0") },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
  container: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100 || "#F0F0F0",
    paddingBottom: Spacing.sm || 8,
    paddingTop: 8,
    height: 70, // Beri height agar layout stabil
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "700",
  },

  // Styling khusus tombol Scanner yang melayang
  floatingButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    position: "absolute",
    top: -35, // Menarik tombol ke atas agar melayang
    width: 60,
    height: 60,
    borderRadius: 30, // Membuatnya bulat sempurna
    backgroundColor: "#4CAF50", // Warna latar hijau
    alignItems: "center",
    justifyContent: "center",
    // Menambahkan border putih agar terlihat terpisah dari garis navigation
    borderWidth: 4,
    borderColor: "#FFFFFF",
    // Efek bayangan (Shadow)
    elevation: 4, // Untuk Android
    shadowColor: "#000", // Untuk iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
