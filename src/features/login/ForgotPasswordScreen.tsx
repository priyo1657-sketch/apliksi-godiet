import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../../App";
import { Logo } from "../../components/Logo";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

const API_URL = "https://web-production-78ab8.up.railway.app";

export default function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Password strength
  const getPasswordStrength = (pw: string) => {
    if (pw.length === 0) return { level: 0, label: "", color: "transparent" };
    if (pw.length < 6) return { level: 1, label: "Lemah", color: "#EF5350" };
    if (pw.length < 10 && !/[A-Z]/.test(pw))
      return { level: 2, label: "Sedang", color: "#FFA726" };
    if (pw.length >= 10 && /[A-Z]/.test(pw) && /[0-9]/.test(pw))
      return { level: 3, label: "Kuat", color: "#43A047" };
    return { level: 2, label: "Sedang", color: "#FFA726" };
  };
  const strength = getPasswordStrength(password);

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
        Alert.alert(
          "E-mail Tidak Ditemukan",
          data.message || "E-mail tidak terdaftar di sistem kami."
        );
      }
    } catch {
      Alert.alert(
        "Koneksi Gagal",
        "Tidak dapat terhubung ke server. Silakan coba kembali."
      );
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
      Alert.alert("Peringatan", "Password baru minimal 6 karakter!");
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
          password,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStep(3);
      } else {
        Alert.alert("Reset Gagal", data.message || "Gagal memperbarui password.");
      }
    } catch {
      Alert.alert(
        "Koneksi Gagal",
        "Tidak dapat terhubung ke server. Silakan coba kembali."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step header info
  const stepInfo = {
    1: { title: "Lupa\nPassword?", subtitle: "Masukkan e-mail untuk\nmemulai pemulihan" },
    2: { title: "Buat Password\nBaru", subtitle: "Pilih password yang kuat\ndan mudah diingat" },
    3: { title: "Password\nDiperbarui!", subtitle: "Akun Anda sudah aman\nkembali" },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: safeTop + 12 }]}>
        {/* Decorative circles */}
        <View style={styles.circleDecorLarge} />
        <View style={styles.circleDecorSmall} />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: safeTop + 12 }]}
          onPress={() => {
            if (step === 2) setStep(1);
            else navigation.goBack();
          }}
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoRow}>
          <Logo size="medium" />
        </View>

        {/* Title */}
        <Text style={styles.headerTitle}>{stepInfo[step].title}</Text>
        <Text style={styles.headerSubtitle}>{stepInfo[step].subtitle}</Text>

        {/* Step indicator */}
        {step !== 3 && (
          <View style={styles.stepIndicatorRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
          </View>
        )}
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══════════════════════════════════════
            STEP 1 — Verifikasi Email
        ══════════════════════════════════════ */}
        {step === 1 && (
          <View>
            {/* Info card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Feather name="mail" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.infoText}>
                Masukkan e-mail yang Anda gunakan saat mendaftar. Kami akan memverifikasi akun Anda.
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Alamat E-mail</Text>
              <View
                style={[
                  styles.inputBox,
                  focused === "email" && styles.inputBoxFocused,
                ]}
              >
                <Feather
                  name="mail"
                  size={18}
                  color={focused === "email" ? Colors.primary : "#BDBDBD"}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={styles.input}
                  placeholder="contoh@gmail.com"
                  placeholderTextColor="#BDBDBD"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleCheckEmail}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.primaryButtonText}>Verifikasi E-mail</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginRow}
              onPress={() => navigation.navigate("Login")}
            >
              <Feather name="arrow-left" size={14} color={Colors.primary} />
              <Text style={styles.backToLoginText}>Kembali ke Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — Buat Password Baru
        ══════════════════════════════════════ */}
        {step === 2 && (
          <View>
            {/* Email badge */}
            <View style={styles.emailBadge}>
              <Feather name="check-circle" size={16} color={Colors.primary} />
              <Text style={styles.emailBadgeText} numberOfLines={1}>
                {email}
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password Baru</Text>
              <View
                style={[
                  styles.inputBox,
                  focused === "password" && styles.inputBoxFocused,
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={focused === "password" ? Colors.primary : "#BDBDBD"}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#BDBDBD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#BDBDBD"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Bar */}
              {password.length > 0 && (
                <View style={styles.strengthWrapper}>
                  <View style={styles.strengthBarTrack}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${(strength.level / 3) * 100}%` as any,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
              <View
                style={[
                  styles.inputBox,
                  focused === "confirm" && styles.inputBoxFocused,
                  confirmPassword.length > 0 &&
                    confirmPassword !== password &&
                    styles.inputBoxError,
                ]}
              >
                <Feather
                  name="shield"
                  size={18}
                  color={focused === "confirm" ? Colors.primary : "#BDBDBD"}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ketik ulang password baru"
                  placeholderTextColor="#BDBDBD"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#BDBDBD"
                  />
                </TouchableOpacity>
              </View>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <Feather
                    name={confirmPassword === password ? "check-circle" : "x-circle"}
                    size={13}
                    color={confirmPassword === password ? Colors.success : Colors.danger}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          confirmPassword === password
                            ? Colors.success
                            : Colors.danger,
                      },
                    ]}
                  >
                    {confirmPassword === password
                      ? "Password cocok"
                      : "Password tidak cocok"}
                  </Text>
                </View>
              )}
            </View>

            {/* Tips card */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Tips password kuat:</Text>
              <Text style={styles.tipsItem}>• Minimal 10 karakter</Text>
              <Text style={styles.tipsItem}>• Kombinasi huruf besar & kecil</Text>
              <Text style={styles.tipsItem}>• Mengandung angka atau simbol</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.primaryButtonText}>Simpan Password Baru</Text>
                  <Feather name="check" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════
            STEP 3 — Sukses
        ══════════════════════════════════════ */}
        {step === 3 && (
          <View style={styles.successWrapper}>
            {/* Animated success icon */}
            <View style={styles.successRing}>
              <View style={styles.successIconCircle}>
                <Feather name="check" size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.successTitle}>Password Berhasil Diubah!</Text>
            <Text style={styles.successDescription}>
              Password Anda telah berhasil diperbarui. Password lama Anda kini tidak lagi valid. Silakan masuk kembali menggunakan password baru.
            </Text>

            {/* Info box */}
            <View style={styles.successInfoBox}>
              <Feather name="shield" size={16} color={Colors.primary} />
              <Text style={styles.successInfoText}>
                Akun Anda kini aman. Jangan bagikan password kepada siapapun.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <View style={styles.buttonInner}>
                <Feather name="log-in" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Masuk Sekarang</Text>
              </View>
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

  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 28,
    borderBottomRightRadius: 44,
    overflow: "hidden",
    minHeight: 220,
  },
  circleDecorLarge: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleDecorSmall: {
    position: "absolute",
    bottom: -20,
    right: 60,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 36,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 34,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
    marginBottom: 16,
  },

  // Step indicators
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  stepDotActive: {
    backgroundColor: Colors.white,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.white,
  },

  // ── Form ──
  formContainer: { flex: 1 },
  formContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 56,
  },

  // Info card (step 1)
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E8F7EC",
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 24,
    alignItems: "flex-start",
    gap: 10,
  },
  infoIconBox: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray800,
    lineHeight: 20,
  },

  // Input
  inputWrapper: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 14,
    height: 52,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FFF4",
  },
  inputBoxError: {
    borderColor: Colors.danger,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Password strength
  strengthWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 46,
    textAlign: "right",
  },

  // Match indicator
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Email badge (step 2)
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F7EC",
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 8,
  },
  emailBadgeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Tips card
  tipsCard: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: 6,
  },
  tipsItem: {
    fontSize: 12,
    color: Colors.gray600,
    lineHeight: 20,
  },

  // Button
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  backToLoginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Success (step 3)
  successWrapper: {
    alignItems: "center",
    paddingTop: 12,
  },
  successRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E8F7EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 14,
    color: Colors.gray800,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  successInfoBox: {
    flexDirection: "row",
    backgroundColor: "#E8F7EC",
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },
  successInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray800,
    lineHeight: 20,
  },
});
