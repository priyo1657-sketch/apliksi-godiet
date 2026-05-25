// src/screens/ScannerScreen.tsx
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { scanFood, DetectedFood } from "../../../services/api";

type RootStackParamList = {
  RecipeAdded: undefined;
  Home: undefined;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.7;

export const ScannerTabScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFood, setDetectedFood] = useState<DetectedFood | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Kami membutuhkan akses kamera untuk fitur scan makanan.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    if (!cameraRef.current || isScanning) return;

    try {
      setIsScanning(true);
      setDetectedFood(null);
      setScanMessage(null);
      
      // Jepret gambar
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
      });

      if (!photo) throw new Error("Gagal mengambil foto");

      // Kirim ke server Hugging Face → Gemini Vision API
      const result = await scanFood(photo.uri);
      
      if (result.success && result.detected_foods && result.detected_foods.length > 0) {
        // Ambil makanan dengan confidence tertinggi
        const topFood = result.detected_foods[0];
        setDetectedFood(topFood);
        setScanMessage(result.message);
      } else {
        setScanMessage("Tidak ada makanan yang terdeteksi");
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Gagal menghubungi Gemini Vision API");
      setScanMessage("Gagal Scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* --- Header --- */}
      <View style={[styles.header, { paddingTop: safeTop + 12 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (onGoBack) {
              onGoBack();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Feather name="x-circle" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* --- Camera Feed --- */}
      <CameraView 
        ref={cameraRef}
        style={styles.cameraArea} 
        facing="back"
      >
        {/* Dark Overlay with Transparent Cutout */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
          
          {/* Kotak Frame Scanner */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            {/* Animasi Garis Scan */}
            {isScanning && <View style={styles.scanLine} />}
          </View>
          
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          {/* Tombol Capture (Di bawah kotak scanner) */}
          <View style={styles.captureContainer}>
            <TouchableOpacity 
              style={[styles.captureBtn, isScanning && styles.captureBtnDisabled]} 
              onPress={handleScan}
              disabled={isScanning}
              activeOpacity={0.7}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
            <Text style={styles.captureText}>
              {isScanning ? "Memproses..." : "Pencet untuk Scan"}
            </Text>
          </View>
        </View>

        {/* --- Hasil Scan (Floating Card di Bawah) --- */}
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              {isScanning ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#2DB34A" />
                  <Text style={styles.foodName}>Menganalisis gambar...</Text>
                </View>
              ) : detectedFood ? (
                <>
                  {/* Nama Makanan & Confidence */}
                  <View style={styles.foodHeaderRow}>
                    <View style={styles.foodHeaderInfo}>
                      <Text style={styles.foodName}>{detectedFood.name}</Text>
                      <Text style={styles.foodNameEn}>{detectedFood.name_en}</Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {(detectedFood.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Porsi */}
                  <Text style={styles.portionText}>📏 Porsi: {detectedFood.porsi}</Text>

                  {/* Nutrisi Grid */}
                  <View style={styles.nutrisiGrid}>
                    <View style={[styles.nutrisiItem, { backgroundColor: "#FFF3E0" }]}>
                      <Text style={styles.nutrisiValue}>{detectedFood.kalori}</Text>
                      <Text style={styles.nutrisiLabel}>Kalori</Text>
                    </View>
                    <View style={[styles.nutrisiItem, { backgroundColor: "#E8F5E9" }]}>
                      <Text style={styles.nutrisiValue}>{detectedFood.protein_g}g</Text>
                      <Text style={styles.nutrisiLabel}>Protein</Text>
                    </View>
                    <View style={[styles.nutrisiItem, { backgroundColor: "#E3F2FD" }]}>
                      <Text style={styles.nutrisiValue}>{detectedFood.karbohidrat_g}g</Text>
                      <Text style={styles.nutrisiLabel}>Karbo</Text>
                    </View>
                    <View style={[styles.nutrisiItem, { backgroundColor: "#FCE4EC" }]}>
                      <Text style={styles.nutrisiValue}>{detectedFood.lemak_g}g</Text>
                      <Text style={styles.nutrisiLabel}>Lemak</Text>
                    </View>
                  </View>

                  {/* DB Match info */}
                  {detectedFood.db_match && (
                    <Text style={styles.dbMatchText}>
                      🔗 Resep terkait: {detectedFood.db_match}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.foodName}>
                  {scanMessage || "Arahkan & Scan Makanan"}
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.nextBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("RecipeAdded")}
              disabled={isScanning}
            >
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  permissionText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    color: "#333333",
  },
  permissionBtn: {
    backgroundColor: "#2DB34A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "white",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#F5F5F5",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  cameraArea: {
    flex: 1,
    width: "100%",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: "transparent",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: "absolute",
    width: "90%",
    height: 3,
    backgroundColor: "#2DB34A",
    shadowColor: "#2DB34A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  captureContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80, // Memberi ruang untuk hasil scan di bawah
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
  },
  captureText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resultContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 24,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 220,
  },
  resultScroll: {
    flex: 1,
    marginRight: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  foodHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  foodHeaderInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  foodNameEn: {
    fontSize: 11,
    color: "#999999",
    fontStyle: "italic",
    marginBottom: 4,
  },
  confidenceBadge: {
    backgroundColor: "#2DB34A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  confidenceText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  portionText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 10,
  },
  nutrisiGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  nutrisiItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
  },
  nutrisiValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
  },
  nutrisiLabel: {
    fontSize: 9,
    color: "#888888",
    fontWeight: "500",
    marginTop: 1,
  },
  dbMatchText: {
    fontSize: 11,
    color: "#2DB34A",
    fontWeight: "500",
  },
  foodDesc: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "500",
  },
  nextBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#333333",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});