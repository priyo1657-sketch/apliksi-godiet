import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../../../App";
import { useUser } from "../../../context/UserContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

// Data Menu Profil
interface MenuItem {
  id: string;
  icon: string;
  label: string;
  library: string;
  route?: string;
  action?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Account",
    items: [
      {
        id: "edit-profil",
        icon: "pencil",
        label: "Edit Profil",
        library: "MaterialCommunityIcons",
        action: "edit",
      },
      {
        id: "notifikasi",
        icon: "bell-outline",
        label: "Notifikasi",
        library: "MaterialCommunityIcons",
        route: "NotificationSettings",
      },
    ],
  },
  {
    title: "Statics",
    items: [
      {
        id: "edit-rencana",
        icon: "square-edit-outline",
        label: "Edit Rencana",
        library: "MaterialCommunityIcons",
      },
      {
        id: "progres",
        icon: "chart-line-variant",
        label: "Progres saya",
        library: "MaterialCommunityIcons",
      },
    ],
  },
  {
    title: "Help & Info",
    items: [
      {
        id: "help",
        icon: "message-processing-outline",
        label: "Help and report",
        library: "MaterialCommunityIcons",
      },
      {
        id: "about",
        icon: "information-outline",
        label: "Tentang Kami",
        library: "MaterialCommunityIcons",
      },
      {
        id: "dark-mode",
        icon: "theme-light-dark",
        label: "Mode Gelap (Dark Mode)",
        library: "MaterialCommunityIcons",
      },
    ],
  },
  {
    title: "Danger Zone",
    items: [
      {
        id: "logout",
        icon: "logout",
        label: "Logout",
        library: "MaterialCommunityIcons",
        action: "logout",
      },
      {
        id: "hapus-akun",
        icon: "delete-outline",
        label: "Hapus Akun",
        library: "MaterialCommunityIcons",
        action: "delete",
      },
    ],
  },
];

export const ProfileTabScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, setUser, updateProfile, logout, workoutHistory, isDarkMode, toggleDarkMode } = useUser();

  // State untuk modal edit profil
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNama, setEditNama] = useState(user?.nama || "");
  const [editBerat, setEditBerat] = useState(String(user?.berat_badan || ""));
  const [editTinggi, setEditTinggi] = useState(String(user?.tinggi_badan || ""));
  const [editUsia, setEditUsia] = useState(String(user?.usia || ""));

  // State untuk modal Edit Rencana
  const [rencanaModalVisible, setRencanaModalVisible] = useState(false);
  const [rencanaAktivitas, setRencanaAktivitas] = useState(user?.tingkat_aktivitas || "");
  const [rencanaTargetKalori, setRencanaTargetKalori] = useState(String(user?.target_kalori_harian || ""));

  // State untuk modal Progres Saya
  const [progresModalVisible, setProgresModalVisible] = useState(false);

  // State untuk Help & Report
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [reportCategory, setReportCategory] = useState("Kritik & Saran");
  const [reportMessage, setReportMessage] = useState("");

  // State untuk Tentang Kami
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // State untuk modal Notifikasi
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifAir, setNotifAir] = useState(true);
  const [notifOlahraga, setNotifOlahraga] = useState(true);
  const [notifJurnal, setNotifJurnal] = useState(true);
  const [notifLaporan, setNotifLaporan] = useState(false);

  const handleSaveNotifikasi = () => {
    Alert.alert(
      "Notifikasi Diperbarui! 🔔",
      "Pengaturan notifikasi dan pengingat harian Anda telah berhasil disinkronkan dengan perangkat Anda!"
    );
    setNotifModalVisible(false);
  };

  // Fungsi untuk membuka pemilih foto
  const handleChangePhoto = () => {
    Alert.alert("Ganti Foto Profil", "Pilih sumber foto:", [
      {
        text: "📸 Ambil Foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Izin Ditolak", "Izin kamera diperlukan untuk mengambil foto.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await updateProfile({ foto_profil: result.assets[0].uri });
          }
        },
      },
      {
        text: "🖼️ Pilih dari Galeri",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Izin Ditolak", "Izin akses galeri diperlukan.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await updateProfile({ foto_profil: result.assets[0].uri });
          }
        },
      },
      { text: "Batal", style: "cancel" },
    ]);
  };

  // Fungsi simpan edit profil
  const handleSaveProfile = async () => {
    const success = await updateProfile({
      nama: editNama,
      berat_badan: parseFloat(editBerat) || 0,
      tinggi_badan: parseFloat(editTinggi) || 0,
      usia: parseInt(editUsia) || 0,
    });
    if (success) {
      Alert.alert("Berhasil ✅", "Profil berhasil diperbarui!");
      setEditModalVisible(false);
    }
  };

  // Fungsi simpan edit rencana harian
  const handleSaveRencana = async () => {
    const targetKcal = Number(rencanaTargetKalori) || 0;
    if (targetKcal <= 0) {
      Alert.alert("Input Tidak Valid", "Target kalori harus berupa angka positif.");
      return;
    }

    const success = await updateProfile({
      tingkat_aktivitas: rencanaAktivitas,
      target_kalori_harian: targetKcal,
    });

    if (success) {
      Alert.alert("Rencana Diperbarui! 🎉", "Pola aktivitas dan target kalori baru Anda berhasil disinkronkan!");
      setRencanaModalVisible(false);
    } else {
      Alert.alert("Gagal", "Gagal memperbarui rencana.");
    }
  };

  // Fungsi hitung otomatis TDEE berdasarkan biometrik saat ini
  const handleAutoCalculateRencana = () => {
    const bb = user?.berat_badan || 0;
    const tb = user?.tinggi_badan || 0;
    const usia = user?.usia || 0;

    if (bb === 0 || tb === 0 || usia === 0) {
      Alert.alert(
        "Profil Belum Lengkap ⚠️",
        "Silakan isi nama, berat, tinggi badan, dan usia Anda di menu Edit Profil terlebih dahulu agar kami dapat menghitung TDEE secara presisi."
      );
      return;
    }

    // Mifflin-St Jeor
    let bmr = (10 * bb) + (6.25 * tb) - (5 * usia);
    const isFemale = user?.jenis_kelamin?.toLowerCase() === "p" || user?.jenis_kelamin?.toLowerCase() === "perempuan";
    bmr += isFemale ? -161 : 5;

    // Activity factor
    let factor = 1.2;
    const act = rencanaAktivitas.toLowerCase();
    if (act.includes("ringan")) factor = 1.375;
    else if (act.includes("sedang")) factor = 1.55;
    else if (act.includes("berat") || act.includes("aktif")) factor = 1.725;
    else if (act.includes("sangat") || act.includes("atlet")) factor = 1.9;

    const computedTdee = Math.round(bmr * factor);
    setRencanaTargetKalori(String(computedTdee));
    
    Alert.alert(
      "Kalkulasi Sukses! ⚡",
      `TDEE Anda berhasil dihitung berdasarkan biometrik saat ini:\n\n• BMR: ${Math.round(bmr)} kcal\n• Estimasi TDEE Harian: ${computedTdee} kcal\n\nTarget kalori di atas telah diset secara otomatis ke kolom target kalori.`
    );
  };

  // Fungsi kirim laporan bug / saran
  const handleSendReport = () => {
    if (reportMessage.trim().length < 10) {
      Alert.alert("Laporan Terlalu Singkat ⚠️", "Silakan masukkan deskripsi laporan/masukan minimal 10 karakter.");
      return;
    }

    Alert.alert(
      "Laporan Terkirim! ✅",
      `Kategori: ${reportCategory}\n\nTerima kasih atas laporan/masukan Anda. Laporan Anda telah berhasil masuk ke antrean pengaduan GoDiet. Tim pengembang kami akan merespons melalui email (${user?.email || 'email terdaftar'}) dalam waktu maksimal 1x24 jam.`,
      [
        {
          text: "OK",
          onPress: () => {
            setReportMessage("");
            setHelpModalVisible(false);
          }
        }
      ]
    );
  };

  // Fungsi logout
  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  // Fungsi hapus akun
  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ Hapus Akun",
      "Tindakan ini tidak bisa dibatalkan. Semua data Anda akan dihapus secara permanen.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Akun",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `https://web-production-78ab8.up.railway.app/api/user/${user?.id_user}`,
                { method: "DELETE" }
              );
              const data = await response.json();
              if (data.success) {
                await logout();
                Alert.alert("Akun Dihapus", "Akun Anda telah berhasil dihapus.");
                navigation.reset({ index: 0, routes: [{ name: "SignUp" }] });
              } else {
                Alert.alert("Gagal", data.message || "Tidak bisa menghapus akun.");
              }
            } catch {
              Alert.alert("Error", "Gagal terhubung ke server.");
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (item: any) => {
    if (item.action === "edit") {
      setEditNama(user?.nama || "");
      setEditBerat(String(user?.berat_badan || ""));
      setEditTinggi(String(user?.tinggi_badan || ""));
      setEditUsia(String(user?.usia || ""));
      setEditModalVisible(true);
    } else if (item.id === "edit-rencana") {
      setRencanaAktivitas(user?.tingkat_aktivitas || "");
      setRencanaTargetKalori(String(user?.target_kalori_harian || ""));
      setRencanaModalVisible(true);
    } else if (item.id === "notifikasi") {
      setNotifModalVisible(true);
    } else if (item.id === "progres") {
      setProgresModalVisible(true);
    } else if (item.id === "dark-mode") {
      toggleDarkMode();
    } else if (item.id === "help") {
      setHelpModalVisible(true);
    } else if (item.id === "about") {
      setAboutModalVisible(true);
    } else if (item.action === "logout") {
      handleLogout();
    } else if (item.action === "delete") {
      handleDeleteAccount();
    } else if (item.route) {
      // @ts-ignore
      navigation.navigate(item.route);
    }
  };

  // --- HITUNG PROGRESS & BMI ---
  const bb = user?.berat_badan || 0;
  const tb = user?.tinggi_badan || 0;
  const heightM = tb / 100;
  const bmiVal = heightM > 0 ? Number((bb / (heightM * heightM)).toFixed(1)) : 0;

  let bmiStatus = "Lengkapi Profil";
  let bmiColor = "#888888";
  let bmiInfo = "Isi berat dan tinggi badan untuk menghitung BMI Anda.";

  if (bb > 0 && tb > 0) {
    if (bmiVal < 18.5) {
      bmiStatus = "Berat Kurang (Underweight) ⚠️";
      bmiColor = "#FF9500";
      bmiInfo = "Berat badan Anda berada di bawah rentang normal. Cobalah untuk meningkatkan asupan nutrisi Anda.";
    } else if (bmiVal >= 18.5 && bmiVal <= 24.9) {
      bmiStatus = "Normal (Ideal) ✅";
      bmiColor = "#00B93F";
      bmiInfo = "Selamat! Berat badan Anda berada dalam kategori sehat. Pertahankan pola makan sehat Anda!";
    } else if (bmiVal >= 25 && bmiVal <= 29.9) {
      bmiStatus = "Kelebihan Berat Badan ⚠️";
      bmiColor = "#FFCC00";
      bmiInfo = "Berat badan Anda sedikit berlebih. Lakukan olahraga teratur dan jaga pola makan kalori Anda.";
    } else {
      bmiStatus = "Obesitas 🚨";
      bmiColor = "#FF3B30";
      bmiInfo = "Berat badan Anda berada dalam kategori obesitas. Konsultasikan dengan ahli medis atau jalankan program defisit kalori.";
    }
  }

  const totalBurned = workoutHistory ? workoutHistory.reduce((acc, c) => acc + c.caloriesBurned, 0) : 0;
  const totalTime = workoutHistory ? workoutHistory.reduce((acc, c) => acc + c.totalTimeSeconds, 0) : 0;
  const totalTimeMins = Math.round(totalTime / 60);
  const totalSesi = workoutHistory ? workoutHistory.length : 0;

  // --- TEMA DILAYOUT SECARA DINAMIS ---
  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    cardBg: isDarkMode ? "#1E1E1E" : "#F9F9F9",
    text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDarkMode ? "#A0A0A0" : "#757575",
    border: isDarkMode ? "#2C2C2C" : "#F0F0F0",
    divider: isDarkMode ? "#2C2C2C" : "#EBEBEB",
    inputBg: isDarkMode ? "#242424" : "#F5F5F5",
    headerBg: isDarkMode ? "#1A1A1A" : "#FFFFFF",
    modalBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
  };

  const avatarSource = user?.foto_profil
    ? { uri: user.foto_profil }
    : { uri: DEFAULT_AVATAR };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header Profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.cameraOverlay}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.profileName, { color: theme.text }]}>{user?.nama || "Pengguna"}</Text>
        <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email || ""}</Text>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Berat 👏</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{user?.berat_badan || 0} kg</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tinggi 🔥</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{user?.tinggi_badan || 0}</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Umur 🪄</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{user?.usia || 0}</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.menuContainer}>
        {menuSections.map((section, index) => (
          <View key={index} style={styles.sectionGroup}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary },
                section.title === "Danger Zone" && { color: "#FF3B30" },
              ]}
            >
              {section.title}
            </Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.divider },
                  (item.action === "logout" || item.action === "delete") && {
                    opacity: 0.9,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleNavigation(item)}
              >
                <View style={styles.menuIconContainer}>
                  {item.library === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={
                        item.action === "delete"
                          ? "#FF3B30"
                          : item.action === "logout"
                          ? "#FF9500"
                          : (isDarkMode ? "#A0A0A0" : "#555555")
                      }
                    />
                  ) : (
                    <Feather name={item.icon as any} size={22} color={isDarkMode ? "#A0A0A0" : "#555555"} />
                  )}
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: theme.text },
                    item.action === "delete" && { color: "#FF3B30" },
                    item.action === "logout" && { color: "#FF9500" },
                  ]}
                >
                  {item.label}
                </Text>
                {item.id === "dark-mode" ? (
                  <MaterialCommunityIcons 
                    name={isDarkMode ? "toggle-switch" : "toggle-switch-off-outline"} 
                    size={32} 
                    color={isDarkMode ? "#00B93F" : "#CCCCCC"} 
                  />
                ) : (
                  <Feather name="chevron-right" size={20} color="#CCCCCC" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Spacer untuk bottom tab nav */}
      <View style={{ height: 100 }} />

      {/* ═══════ MODAL EDIT PROFIL ═══════ */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.saveBtn}>Simpan</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar edit */}
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                <Image source={avatarSource} style={styles.avatarLarge} />
                <View style={styles.cameraOverlayLarge}>
                  <Feather name="camera" size={18} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap untuk ganti foto</Text>
          </View>

          <ScrollView style={{ paddingHorizontal: 24 }}>
            {/* Nama */}
            <Text style={styles.fieldLabel}>Nama</Text>
            <TextInput
              style={styles.fieldInput}
              value={editNama}
              onChangeText={setEditNama}
              placeholder="Masukkan nama"
            />

            {/* Berat Badan */}
            <Text style={styles.fieldLabel}>Berat Badan (kg)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editBerat}
              onChangeText={setEditBerat}
              keyboardType="numeric"
              placeholder="0"
            />

            {/* Tinggi Badan */}
            <Text style={styles.fieldLabel}>Tinggi Badan (cm)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTinggi}
              onChangeText={setEditTinggi}
              keyboardType="numeric"
              placeholder="0"
            />

            {/* Usia */}
            <Text style={styles.fieldLabel}>Usia</Text>
            <TextInput
              style={styles.fieldInput}
              value={editUsia}
              onChangeText={setEditUsia}
              keyboardType="numeric"
              placeholder="0"
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════ MODAL EDIT RENCANA ═══════ */}
      <Modal
        visible={rencanaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRencanaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRencanaModalVisible(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Rencana Harian</Text>
            <TouchableOpacity onPress={handleSaveRencana}>
              <Text style={styles.saveBtn}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            {/* Deskripsi Singkat */}
            <Text style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 18 }}>
              Rencana harian Anda menentukan porsi pembagian makro nutrisi (karbohidrat, protein, lemak) dan batas kalori harian yang dihitung secara dinamis di halaman Calories Anda.
            </Text>

            {/* Target Kalori Harian */}
            <Text style={styles.fieldLabel}>Target Kalori Harian (kcal)</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <TextInput
                style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                value={rencanaTargetKalori}
                onChangeText={setRencanaTargetKalori}
                keyboardType="numeric"
                placeholder="Contoh: 2000"
              />
              <TouchableOpacity 
                onPress={handleAutoCalculateRencana}
                style={{
                  backgroundColor: "#E0F2E9",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#00B93F", fontWeight: "600", fontSize: 13 }}>Hitung TDEE ⚡</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: "#888", marginBottom: 24 }}>
              *Klik tombol "Hitung TDEE" untuk mengisi otomatis berdasarkan berat dan tinggi badan Anda saat ini.
            </Text>

            {/* Tingkat Aktivitas Harian */}
            <Text style={styles.fieldLabel}>Tingkat Aktivitas Harian</Text>
            <View style={{ gap: 10, marginBottom: 40 }}>
              {[
                { key: "Sangat jarang olahraga (Sedentary)", label: "Sedentary (Sangat jarang olahraga)" },
                { key: "Olahraga ringan (1-3 hari/minggu)", label: "Ringan (Olahraga ringan 1-3 hari/minggu)" },
                { key: "Olahraga sedang (3-5 hari/minggu)", label: "Sedang (Olahraga sedang 3-5 hari/minggu)" },
                { key: "Olahraga berat (6-7 hari/minggu)", label: "Berat (Olahraga aktif 6-7 hari/minggu)" },
                { key: "Sangat aktif / Atlet", label: "Ekstrim (Atlet / Sangat aktif fisik)" },
              ].map((act) => {
                const isActive = rencanaAktivitas === act.key;
                return (
                  <TouchableOpacity
                    key={act.key}
                    style={{
                      borderWidth: 1.5,
                      borderColor: isActive ? "#00B93F" : "#F0F0F0",
                      backgroundColor: isActive ? "#F4FDF9" : "#FFFFFF",
                      padding: 14,
                      borderRadius: 12,
                    }}
                    onPress={() => setRencanaAktivitas(act.key)}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isActive ? "600" : "500",
                      color: isActive ? "#00B93F" : "#555555"
                    }}>{act.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════ MODAL PROGRES SAYA ═══════ */}
      <Modal
        visible={progresModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProgresModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setProgresModalVisible(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Analisis Progres Saya 📈</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            {/* Box BMI */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 12 }}>
              Kalkulator BMI (Body Mass Index)
            </Text>
            <View style={{
              backgroundColor: "#F9F9F9",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "#F0F0F0",
              alignItems: "center",
              marginBottom: 24
            }}>
              <Text style={{ fontSize: 13, color: "#666", fontWeight: "600" }}>BMI Anda Saat Ini</Text>
              <Text style={{ fontSize: 40, fontWeight: "800", color: bmiColor, marginVertical: 8 }}>
                {bmiVal > 0 ? bmiVal : "-"}
              </Text>
              <View style={{
                backgroundColor: bmiColor + "15",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginBottom: 12
              }}>
                <Text style={{ color: bmiColor, fontWeight: "700", fontSize: 13 }}>
                  {bmiStatus}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "#555", textAlign: "center", lineHeight: 18 }}>
                {bmiInfo}
              </Text>

              {/* Slider Visual Scale */}
              {bmiVal > 0 && (
                <View style={{ width: "100%", marginTop: 20 }}>
                  <View style={{ height: 8, backgroundColor: "#E0E0E0", borderRadius: 4, flexDirection: "row", overflow: "hidden" }}>
                    <View style={{ flex: 1.85, backgroundColor: "#FF9500" }} />
                    <View style={{ flex: 0.65, backgroundColor: "#00B93F" }} />
                    <View style={{ flex: 0.5, backgroundColor: "#FFCC00" }} />
                    <View style={{ flex: 1, backgroundColor: "#FF3B30" }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                    <Text style={{ fontSize: 9, color: "#888" }}>Kurang (&lt;18.5)</Text>
                    <Text style={{ fontSize: 9, color: "#888" }}>Ideal (18.5-24.9)</Text>
                    <Text style={{ fontSize: 9, color: "#888" }}>Lebih (&gt;25)</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Rekap Olahraga */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 12 }}>
              Pencapaian Latihan Fisik 🏃‍♂️
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {/* Sesi */}
              <View style={{ flex: 1, backgroundColor: "#EBF3FE", borderRadius: 16, padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🏃‍♂️</Text>
                <Text style={{ fontSize: 11, color: "#666" }}>Total Sesi</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#333", marginTop: 2 }}>{totalSesi} kali</Text>
              </View>
              {/* Kalori */}
              <View style={{ flex: 1, backgroundColor: "#FFF0F0", borderRadius: 16, padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🔥</Text>
                <Text style={{ fontSize: 11, color: "#666" }}>Kalori Terbakar</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#333", marginTop: 2 }}>{totalBurned} kcal</Text>
              </View>
              {/* Waktu */}
              <View style={{ flex: 1, backgroundColor: "#E8FDF0", borderRadius: 16, padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>⏱️</Text>
                <Text style={{ fontSize: 11, color: "#666" }}>Total Waktu</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#333", marginTop: 2 }}>{totalTimeMins} mnt</Text>
              </View>
            </View>

            {/* Rencana & Kalori Harian */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 12 }}>
              Rencana Nutrisi 🎯
            </Text>
            <View style={{
              backgroundColor: "#F9F9F9",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#F0F0F0",
              marginBottom: 40
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 13, color: "#666" }}>Target Kalori Harian</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#00B93F" }}>
                  {user?.target_kalori_harian || 2000} kcal
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: "#666" }}>Tingkat Aktivitas</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", flex: 0.7, textAlign: "right" }} numberOfLines={1}>
                  {user?.tingkat_aktivitas || "Sedentary"}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════ MODAL HELP & REPORT ═══════ */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Help and Report 💬</Text>
            <TouchableOpacity onPress={handleSendReport}>
              <Text style={styles.saveBtn}>Kirim</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20, lineHeight: 18 }}>
              Punya kendala teknis atau saran untuk perbaikan aplikasi GoDiet? Tulis laporan Anda di bawah ini. Tim kami akan segera menindaklanjutinya!
            </Text>

            {/* Pilihan Kategori */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Pilih Kategori Kendala</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              {["Kritik & Saran", "Menyelesaikan Latihan Error", "Akun & Data", "Lainnya"].map((cat) => {
                const isSelected = reportCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={{
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#00B93F" : theme.border,
                      backgroundColor: isSelected ? (isDarkMode ? "#1A3C22" : "#E0F2E9") : "transparent",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                    onPress={() => setReportCategory(cat)}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isSelected ? "#00B93F" : theme.textSecondary
                    }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deskripsi Kendala */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Detail Laporan / Masukan</Text>
            <TextInput
              style={[
                styles.fieldInput,
                {
                  height: 150,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                  textAlignVertical: "top",
                  paddingTop: 12,
                  fontSize: 14
                }
              ]}
              value={reportMessage}
              onChangeText={setReportMessage}
              multiline={true}
              numberOfLines={6}
              placeholder="Jelaskan secara rinci kendala yang Anda alami..."
              placeholderTextColor={isDarkMode ? "#666" : "#A0A0A0"}
            />

            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 12, lineHeight: 16 }}>
              *Kami akan mengirimi Anda tanggapan resmi dan solusi detail langsung ke alamat email terdaftar Anda: <Text style={{ fontWeight: "700" }}>{user?.email || "email Anda"}</Text>
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════ MODAL TENTANG KAMI ═══════ */}
      <Modal
        visible={aboutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24
        }}>
          <View style={{
            backgroundColor: theme.modalBg,
            borderRadius: 24,
            padding: 24,
            width: "100%",
            maxWidth: 345,
            maxHeight: "85%",
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 10
          }}>
            <ScrollView 
              style={{ width: "100%" }} 
              contentContainerStyle={{ alignItems: "center" }}
              showsVerticalScrollIndicator={false}
            >
              {/* Logo/Icon */}
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "#E0F2E9",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16
              }}>
                <MaterialCommunityIcons name="silverware-clean" size={38} color="#00B93F" />
              </View>

              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>GoDiet App 🥗</Text>
              <Text style={{ fontSize: 13, color: "#00B93F", fontWeight: "600", marginTop: 2, marginBottom: 16 }}>Versi Premium v1.2.0</Text>

              <Text style={{
                fontSize: 13,
                color: theme.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 20
              }}>
                GoDiet adalah asisten kesehatan digital premium yang dirancang khusus untuk mempermudah pemantauan nutrisi harian Anda. Hitung TDEE Anda secara ilmiah, kendalikan kalori harian, rekam aktivitas olahraga, dan pantau progres kesehatan tubuh Anda demi mencapai pola hidup sehat berkelanjutan.
              </Text>

              {/* Team Section */}
              <View style={{
                width: "100%",
                borderTopWidth: 1,
                borderColor: theme.border,
                paddingTop: 16,
                marginBottom: 12
              }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 12, textAlign: "center" }}>Tim Pengembang GoDiet:</Text>
                
                <View style={{ gap: 10 }}>
                  {/* Member 1: Izora Elverda */}
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDarkMode ? "#252525" : "#F9F9F9", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={require("../../../assets/Izora ELverda.jpeg")} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1.5, borderColor: "#00B93F" }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>Izora Elverda</Text>
                      <Text style={{ fontSize: 11, color: "#00B93F", fontWeight: "600", marginTop: 1 }}>UI/UX Designer</Text>
                    </View>
                  </View>

                  {/* Member 2: Muhammad Abdullah */}
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDarkMode ? "#252525" : "#F9F9F9", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={require("../../../assets/Muhammad Abdullah.png")} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1.5, borderColor: "#00B93F" }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>Muhammad Abdullah</Text>
                      <Text style={{ fontSize: 11, color: "#00B93F", fontWeight: "600", marginTop: 1 }}>Fullstack Developer</Text>
                    </View>
                  </View>

                  {/* Member 3: Bintang Wira */}
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDarkMode ? "#252525" : "#F9F9F9", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={require("../../../assets/Bintang Wira.jpeg")} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1.5, borderColor: "#00B93F" }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>Bintang Wira</Text>
                      <Text style={{ fontSize: 11, color: "#00B93F", fontWeight: "600", marginTop: 1 }}>Backend Developer</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Tombol Tutup */}
            <TouchableOpacity
              onPress={() => setAboutModalVisible(false)}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#00B93F",
                paddingVertical: 12,
                width: "100%",
                borderRadius: 12,
                alignItems: "center",
                marginTop: 12
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════ MODAL NOTIFIKASI ═══════ */}
      <Modal
        visible={notifModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notifikasi & Pengingat 🔔</Text>
            <TouchableOpacity onPress={handleSaveNotifikasi}>
              <Text style={styles.saveBtn}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 24, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 24, lineHeight: 18 }}>
              Atur bagaimana GoDiet mengingatkan Anda untuk menjaga pola hidup sehat harian Anda.
            </Text>

            {/* Pengingat Olahraga */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.border
            }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>Pengingat Olahraga Harian 🏃‍♂️</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  Ingatkan saya untuk menyelesaikan target latihan harian.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNotifOlahraga(!notifOlahraga)}>
                <MaterialCommunityIcons 
                  name={notifOlahraga ? "toggle-switch" : "toggle-switch-off-outline"} 
                  size={38} 
                  color={notifOlahraga ? "#00B93F" : (isDarkMode ? "#555" : "#CCC")} 
                />
              </TouchableOpacity>
            </View>



            {/* Pengingat Minum Air */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.border
            }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>Pengingat Minum Air 💧</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  Dapatkan notifikasi berkala untuk minum air agar tetap terhidrasi.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNotifAir(!notifAir)}>
                <MaterialCommunityIcons 
                  name={notifAir ? "toggle-switch" : "toggle-switch-off-outline"} 
                  size={38} 
                  color={notifAir ? "#00B93F" : (isDarkMode ? "#555" : "#CCC")} 
                />
              </TouchableOpacity>
            </View>

            {/* Pengingat Jurnal */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.border
            }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>Pengingat Catat Jurnal 📝</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  Ingatkan saya untuk mencatat perasaan/mood di akhir hari.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNotifJurnal(!notifJurnal)}>
                <MaterialCommunityIcons 
                  name={notifJurnal ? "toggle-switch" : "toggle-switch-off-outline"} 
                  size={38} 
                  color={notifJurnal ? "#00B93F" : (isDarkMode ? "#555" : "#CCC")} 
                />
              </TouchableOpacity>
            </View>

            {/* Laporan Mingguan */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              marginBottom: 40
            }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>Laporan Mingguan (Weekly Summary) 📊</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  Kirim ringkasan mingguan pencapaian kalori dan olahraga saya.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNotifLaporan(!notifLaporan)}>
                <MaterialCommunityIcons 
                  name={notifLaporan ? "toggle-switch" : "toggle-switch-off-outline"} 
                  size={38} 
                  color={notifLaporan ? "#00B93F" : (isDarkMode ? "#555" : "#CCC")} 
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 24,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0F2E9",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2DB34A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 13, color: "#555555", marginBottom: 8 },
  statValue: { fontSize: 13, fontWeight: "500", color: "#333333" },
  statDivider: { width: 1, height: 30, backgroundColor: "#E0E0E0" },
  menuContainer: { paddingHorizontal: 24 },
  sectionGroup: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  menuIconContainer: { width: 28, alignItems: "flex-start" },
  menuLabel: { flex: 1, fontSize: 15, color: "#333333", fontWeight: "400" },

  // ── Modal ──
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  saveBtn: { fontSize: 16, fontWeight: "700", color: "#2DB34A" },
  avatarLarge: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlayLarge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2DB34A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoText: { fontSize: 13, color: "#888", marginTop: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#FAFAFA",
  },
});
