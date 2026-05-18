// src/screens/LoginScreen.tsx
import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import Zocial from "@expo/vector-icons/Zocial";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert } from "react-native";
import {
  ActivityIndicator,
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
import { useUser } from "../../context/UserContext";
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

// URL API backend Railway (sudah live di cloud)
const API_URL = 'https://web-production-78ab8.up.railway.app';

export default function LoginScreen({ navigation }: Props) {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Peringatan', 'Email dan password tidak boleh kosong!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Simpan data user ke context global
        const profile = data.user.profile;
        setUser({
          id_user: data.user.id_user,
          email: data.user.email,
          role: data.user.role,
          nama: profile?.nama || '',
          berat_badan: profile?.berat_badan || 0,
          tinggi_badan: profile?.tinggi_badan || 0,
          usia: profile?.usia || 0,
          jenis_kelamin: profile?.jenis_kelamin || '',
          tingkat_aktivitas: profile?.tingkat_aktivitas || '',
          target_kalori_harian: profile?.target_kalori_harian || 0,
          foto_profil: profile?.foto_profil || '',
        });
        Alert.alert('Berhasil! 🎉', `Selamat datang kembali, ${profile?.nama || data.user.email}!`);
        navigation.navigate('Home');
      } else {
        Alert.alert('Login Gagal', data.message || 'Email atau password salah.');
      }
    } catch (error) {
      Alert.alert(
        'Koneksi Gagal',
        'Tidak dapat terhubung ke server. Pastikan backend API sedang berjalan.\n\nJika pakai HP fisik, ubah API_URL di LoginScreen.tsx ke IP laptop Anda.'
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
      {/* Green diagonal header */}
      <View style={styles.header}>
        <View style={styles.circleDecor} />
        <View style={styles.logoRow}>
          <Logo size="medium" />
        </View>
        <Text style={styles.welcomeTitle}>
          Halo, senang{"\n"}bertemu{"\n"}denganmu lagi!
        </Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Login</Text>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <View
            style={[
              styles.inputBox,
              focused === "email" && styles.inputBoxFocused,
            ]}
          >
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
            <Zocial name="email" size={24} color="black" />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <View
            style={[
              styles.inputBox,
              focused === "password" && styles.inputBoxFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#888888"
                style={styles.inputIconRight}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Lupa password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            {/* Logo Google dari AntDesign */}
            <AntDesign name="google" size={20} color="#FBBC05" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            {/* Logo Facebook dari FontAwesome */}
            <FontAwesome name="facebook" size={22} color="#1877F2" />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
        {/* Sign Up link */}
        <TouchableOpacity
          style={styles.signUpRow}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={styles.signUpText}>
            Belum punya akun? <Text style={styles.signUpLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  circleDecor: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  logoIcon: { fontSize: 22 },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.white,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 34,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.gray800,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 16,
    height: 52,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputIconRight: {
    fontSize: 18,
    marginLeft: 8,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 6,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  loginButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerText: {
    color: Colors.gray400,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row", // Agar ikon dan teks berjejer ke samping
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    // Efek bayangan ringan
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  socialIcon: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  socialText: {
    marginLeft: 10, // Memberi jarak antara ikon dan teks
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center", // Ubah bagian ini menjadi center
    gap: 8, // Anda bisa mengubah angkanya jika jarak antar teks terlalu jauh/dekat
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
