// src/screens/GetReadyScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useUser } from "../../../context/UserContext";

function TimerCircle({ size = 220, percent = 100, timeLeft = 5, isDarkMode = false }) {
  const sw = 16, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={isDarkMode ? "#2C2C2C" : "#E8E8FF"} strokeWidth={sw} fill="none" />
        <Circle 
          cx={size/2} cy={size/2} r={r} stroke="#00B93F" strokeWidth={sw} fill="none" 
          strokeDasharray={c} strokeDashoffset={c - (percent / 100) * c} 
          strokeLinecap="round" rotation="-90" origin={`${size/2},${size/2}`} 
        />
      </Svg>
      <Text style={[styles.timerText, { color: isDarkMode ? "#FFF" : "#333" }]}>{timeLeft}</Text>
    </View>
  );
}

export default function GetReadyScreen({ navigation }: any) {
  const [timeLeft, setTimeLeft] = useState(5);
  const { isDarkMode } = useUser();

  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#333333",
  };

  useEffect(() => {
    if (timeLeft === 0) {
      navigation.replace("Exercise");
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Get Ready!</Text>
        <View style={styles.timerContainer}>
          <TimerCircle percent={(timeLeft / 5) * 100} timeLeft={timeLeft} isDarkMode={isDarkMode} />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.btn} 
          onPress={() => navigation.replace("Exercise")}
        >
          <Text style={styles.btnText}>Skip & Mulai 🚀</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { paddingHorizontal: 20, paddingTop: 20 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  title: { fontSize: 28, fontWeight: "700", color: "#333", marginBottom: 60 },
  timerContainer: { alignItems: "center", justifyContent: "center" },
  timerText: { fontSize: 64, fontWeight: "700", color: "#333" },
  bottomBar: { padding: 24, paddingBottom: 40 },
  btn: { backgroundColor: "#00B93F", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});