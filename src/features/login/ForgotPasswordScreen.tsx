import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

const API_URL = 'https://web-production-78ab8.up.railway.app';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Peringatan", "Silakan masukkan e-mail Anda!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStep(2);
      } else {
        Alert.alert("E-mail Tidak Ditemukan", data.message || "E-mail tidak terdaftar di sistem kami.");
      }
    } catch (error) {
      Alert.alert("Koneksi Gagal", "Tidak dapat terhubung ke server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Peringatan", "Password baru tidak boleh kosong!");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Peringatan", "Password baru minimal harus terdiri dari 6 karakter!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Peringatan", "Konfirmasi password tidak cocok!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStep(3);
      } else {
        Alert.alert("Reset Gagal", data.message || "Gagal memperbarui password.");
      }
    } catch (error) {
      Alert.alert("Koneksi Gagal", "Tidak dapat terhubung ke server. Silakan coba kembali.");
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) setStep(1);
            else navigation.goBack();
          }}
        >
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.circleDecor} />
        <View style={styles.logoRow}>
          <Logo size="medium" />
        </View>
        <Text style={styles.welcomeTitle}>
          {step === 1 && "Lupa\nPassword Anda?"}
          {step === 2 && "Buat\nPassword Baru"}
          {step === 3 && "Password\nBerhasil Direset!"}
        </Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <Text style={styles.instructions}>
              Masukkan alamat e-mail terdaftar Anda. Kami akan memverifikasi akun Anda untuk memperbarui kata sandi.
            </Text>

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
                  placeholderTextColor="#888"
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

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleCheckEmail}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Lanjutkan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.instructions}>
              Silakan masukkan password baru Anda. Pastikan menggunakan password yang aman dan mudah diingat.
            </Text>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password Baru</Text>
              <View
                style={[
                  styles.inputBox,
                  focused === "password" && styles.inputBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#888"
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
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
              <View
                style={[
                  styles.inputBox,
                  focused === "confirmPassword" && styles.inputBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Ketik ulang password baru"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocused("confirmPassword")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Simpan Password Baru</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.successWrapper}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={48} color="#2DB34A" />
            </View>
            <Text style={styles.successTitle}>Berhasil diperbarui!</Text>
            <Text style={styles.successDescription}>
              Password Anda telah berhasil diubah. Silakan masuk kembali menggunakan password baru Anda. Password lama Anda kini sudah tidak valid.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Kembali ke Login</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 44,
    marginBottom: 16,
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
  instructions: {
    fontSize: 14,
    color: Colors.gray800,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    marginBottom: 20,
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
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  successWrapper: {
    alignItems: "center",
    paddingTop: 20,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E8F9EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.gray800,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
});
