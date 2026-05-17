// src/screens/SignUpScreen.tsx
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../../App";
import { Logo } from "../../components/Logo";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SignUp">;
};

// URL API backend Railway (sudah live di cloud)
const API_URL = 'https://web-production-78ab8.up.railway.app';

export default function SignUpScreen({ navigation }: Props) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validasi input
    if (!nama.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Peringatan', 'Semua kolom wajib diisi!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Peringatan', 'Password dan konfirmasi password tidak cocok!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Peringatan', 'Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          nama: nama.trim(),
          berat_badan: 0,
          tinggi_badan: 0,
          usia: 0,
          jenis_kelamin: '',
          tingkat_aktivitas: '',
          target_kalori_harian: 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Daftar Berhasil! 🎉',
          `Akun berhasil dibuat!\nSilakan lengkapi profil Anda.`,
          [{ text: 'OK', onPress: () => navigation.navigate('CreateProfile') }]
        );
      } else {
        Alert.alert('Pendaftaran Gagal', data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch (error) {
      Alert.alert(
        'Koneksi Gagal',
        'Tidak dapat terhubung ke server. Pastikan backend API sedang berjalan.\n\nJika pakai HP fisik, ubah API_URL di SignUpScreen.tsx ke IP laptop Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Green top section */}
      <View style={styles.topSection}>
        <View style={styles.circleDecor1} />
        <View style={styles.circleDecor2} />
        <View style={styles.logoRow}>
          <Logo size="medium" />
        </View>
        <Text style={styles.headline}>
          Mulai perjalanan{"\n"}
          <Text style={styles.headlineBrand}>sehatmu hari ini!</Text>
        </Text>
      </View>

      {/* Form card */}
      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Buat Akun</Text>

        {/* Nama Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Nama Lengkap</Text>
          <View style={[styles.inputBox, focused === "nama" && styles.inputBoxFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={Colors.gray400}
              value={nama}
              onChangeText={setNama}
              autoCapitalize="words"
              onFocus={() => setFocused("nama")}
              onBlur={() => setFocused(null)}
            />
            <Feather name="user" size={20} color="#888" />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <View style={[styles.inputBox, focused === "email" && styles.inputBoxFocused]}>
            <TextInput
              style={styles.input}
              placeholder="contoh@gmail.com"
              placeholderTextColor={Colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
            <Feather name="mail" size={20} color="#888" />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputBox, focused === "password" && styles.inputBoxFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Minimal 6 karakter"
              placeholderTextColor={Colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Konfirmasi Password</Text>
          <View style={[styles.inputBox, focused === "confirm" && styles.inputBoxFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Ulangi password"
              placeholderTextColor={Colors.gray400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, loading && { opacity: 0.7 }]}
          onPress={handleSignUp}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.emailIcon}>✉️</Text>
              <Text style={styles.signUpText}>Daftar Sekarang</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Tombol ke Login */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.85}
        >
          <Text style={styles.loginText}>Sudah punya akun? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Login</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.termsRow}>
          <Text style={styles.termsText}>
            Dengan mendaftar, kamu menyetujui{" "}
            <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{" "}
            <Text style={styles.termsLink}>Kebijakan Privasi</Text> kami.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 28,
    overflow: "hidden",
  },
  circleDecor1: {
    position: "absolute", top: -40, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleDecor2: {
    position: "absolute", bottom: 0, left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  headline: { fontSize: 24, fontWeight: "300", color: Colors.white, lineHeight: 34 },
  headlineBrand: { fontWeight: "800", color: Colors.white },

  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 22, fontWeight: "700", color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  inputWrapper: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.gray200,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, height: 50,
    backgroundColor: "#FAFAFA",
  },
  inputBoxFocused: { borderColor: Colors.primary, backgroundColor: "#F0FFF4" },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  signUpButton: {
    height: 52, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 8,
  },
  emailIcon: { fontSize: 18 },
  signUpText: { color: Colors.white, fontSize: 16, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { color: Colors.gray400, fontSize: 14 },

  loginButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.gray200,
    alignItems: "center", justifyContent: "center",
  },
  loginText: { fontSize: 15, color: Colors.textSecondary },

  termsRow: { paddingTop: 12 },
  termsText: { fontSize: 12, color: Colors.gray400, textAlign: "center", lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: "600" },
});
