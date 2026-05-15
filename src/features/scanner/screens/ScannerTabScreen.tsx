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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { scanFood } from "../../../services/api";

type RootStackParamList = {
  RecipeAdded: undefined;
  Home: undefined;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.7;

export const ScannerTabScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFood, setDetectedFood] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

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
      setConfidence(null);
      
      // Jepret gambar
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
      });

      if (!photo) throw new Error("Gagal mengambil foto");

      // Kirim ke server ML di Hugging Face
      const result = await scanFood(photo.uri);
      
      if (result.success && result.detected_objects && result.detected_objects.length > 0) {
        // Ambil objek dengan confidence tertinggi
        const topObject = result.detected_objects[0];
        setDetectedFood(topObject.label);
        setConfidence(topObject.confidence);
      } else {
        setDetectedFood("Tidak Dikenali");
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Gagal menghubungi server ML");
      setDetectedFood("Gagal Scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
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
            <View style={styles.resultInfo}>
              {isScanning ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#2DB34A" />
                  <Text style={styles.foodName}>Menganalisis gambar...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.foodName}>
                    {detectedFood ? detectedFood : "Arahkan & Scan Makanan"}
                  </Text>
                  {confidence && (
                    <Text style={styles.foodDesc}>
                      Tingkat keyakinan: {(confidence * 100).toFixed(0)}%
                    </Text>
                  )}
                </>
              )}
            </View>

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
    alignItems: "center",
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
  },
  resultInfo: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
    textTransform: "capitalize",
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
    marginLeft: 12,
  },
});