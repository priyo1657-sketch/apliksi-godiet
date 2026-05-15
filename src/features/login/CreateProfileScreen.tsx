// src/screens/CreateProfileScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateProfile">;
};

type Gender = "Laki-laki" | "Perempuan" | "Tidak Diketahui";

export default function CreateProfileScreen({ navigation }: Props) {
  const [gender, setGender] = useState<Gender>("Perempuan");
  const [name, setName] = useState("");
  const [age, setAge] = useState("18");
  const [country, setCountry] = useState("🇲🇾 Malaysia");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const genderOptions: Gender[] = ["Laki-laki", "Perempuan", "Tidak Diketahui"];
  
  const countryOptions = [
    "🇮🇩 Indonesia",
    "🇲🇾 Malaysia",
    "🇸🇬 Singapore",
    "🇧🇳 Brunei",
    "🇹🇭 Thailand",
    "🇵🇭 Philippines",
    "🇻🇳 Vietnam",
    "🇲🇲 Myanmar",
    "🇰🇭 Cambodia",
    "🇱🇦 Laos"
  ];

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoCircle}>
            <Text style={styles.photoEmoji}>👤</Text>
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Choose your photo</Text>
        </View>

        {/* Gender */}
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {genderOptions.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderChip,
                gender === g && styles.genderChipActive,
              ]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[
                  styles.genderChipText,
                  gender === g && styles.genderChipTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.fieldLabel}>Nama Anda</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Masukkan Nama Anda"
            placeholderTextColor={Colors.gray400}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Age */}
        <View style={styles.inputWrapper}>
          <Text style={styles.fieldLabel}>Umur Anda</Text>
          <TextInput
            style={styles.inputField}
            placeholder="18"
            placeholderTextColor={Colors.gray400}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        {/* Country */}
        <View style={styles.inputWrapper}>
          <Text style={styles.fieldLabel}>Asal Negara</Text>
          <TouchableOpacity 
            style={styles.countryField}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryText}>{country}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate("GoalSelection")}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Selanjutnya</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.loginText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCountryPicker(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle}>Pilih Negara</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countryOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.countryOption,
                    country === item && styles.countryOptionSelected
                  ]}
                  onPress={() => {
                    setCountry(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.countryOptionText,
                    country === item && styles.countryOptionTextSelected
                  ]}>{item}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
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
    paddingTop: Spacing.lg,
    paddingBottom: 24,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  photoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.gray200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoEmoji: {
    fontSize: 40,
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoEditIcon: {
    fontSize: 12,
  },
  photoHint: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  genderChip: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  genderChipText: {
    fontSize: 12,
    color: Colors.gray600,
    fontWeight: "500",
  },
  genderChipTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputField: {
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  countryField: {
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dropdownIcon: {
    fontSize: 12,
    color: Colors.gray400,
  },
  spacer: { height: 16 },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: 16,
  },
  nextButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  loginText: {
    fontSize: 13,
    color: Colors.gray400,
  },
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
    maxHeight: "60%",
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  countryOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  countryOptionSelected: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 0,
    paddingHorizontal: 12,
  },
  countryOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  countryOptionTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
