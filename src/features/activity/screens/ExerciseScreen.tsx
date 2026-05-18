// src/screens/ExerciseScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useUser } from "../../../context/UserContext";
import { Audio } from "expo-av";

export const EXERCISES = [
  { name: "Push Up", duration: 30, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&fit=crop" },
  { name: "Sit Up", duration: 30, image: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=800&fit=crop" },
  { name: "Plank", duration: 30, image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop" },
  { name: "Arm Raises", duration: 30, image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&fit=crop" },
  { name: "Jumping Jack", duration: 30, image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&fit=crop" },
  { name: "Squats", duration: 30, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&fit=crop" }
];

function SmallTimerCircle({ size = 120, percent = 60, timeString = "0", isDarkMode = false }) {
  const sw = 10, r = (size - sw) / 2, c = 2 * Math.PI * r;
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
      <Text style={[styles.smallTimerText, { color: isDarkMode ? "#FFF" : "#333" }]}>{timeString} s</Text>
    </View>
  );
}

export default function ExerciseScreen({ navigation }: any) {
  const { saveWorkoutHistory, isDarkMode } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  
  const currentExercise = EXERCISES[currentIndex];

  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    cardBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#333333",
    textSecondary: isDarkMode ? "#A0A0A0" : "#888888",
    border: isDarkMode ? "#2C2C2C" : "#E0E0E0",
  };

  const soundRef = React.useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio mode so it plays loudly even in silent mode
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.log("Gagal set mode audio:", e);
      }
    };
    setupAudio();

    // Preload sound
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../../assets/tick.mp3"),
          { shouldPlay: false, volume: 1.0 }
        );
        soundRef.current = sound;
      } catch (err) {
        console.log("Gagal memuat suara:", err);
      }
    };
    loadSound();

    return () => {
      // Unload sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playTickSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      } else {
        // Fallback: Buat baru dan putar langsung
        const { sound } = await Audio.Sound.createAsync(
          require("../../../assets/tick.mp3"),
          { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (err) {
      console.log("Gagal memutar suara:", err);
    }
  };

  useEffect(() => {
    if (workoutFinished) return;
    
    if (timeLeft === 0) {
      handleNext();
      return;
    }

    if (!isPaused) {
      const timerId = setInterval(() => {
        playTickSound();
        setTimeLeft((prev) => prev - 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [timeLeft, isPaused, workoutFinished]);

  const handleNext = () => {
    if (currentIndex < EXERCISES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTimeLeft(EXERCISES[nextIndex].duration);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    setWorkoutFinished(true);
    
    // Save history
    const completedExercises = EXERCISES.slice(0, currentIndex + 1).map(e => e.name);
    saveWorkoutHistory({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercisesCompleted: completedExercises,
      totalTimeSeconds: totalTime,
      caloriesBurned: Math.round(totalTime * 0.15), // Est. 0.15 kcal per second
    });

    Alert.alert("Luar Biasa! 🎉", "Kamu telah menyelesaikan semua latihan hari ini!", [
      { text: "Kembali ke Activity", onPress: () => navigation.navigate("Home") }
    ]);
  };

  const handleStop = () => {
    Alert.alert("Berhenti?", "Yakin ingin menghentikan olahraga ini? Data latihan yang sudah dilakukan akan tetap disimpan.", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Berhenti", 
        style: "destructive", 
        onPress: () => {
          setWorkoutFinished(true);
          const completedExercises = EXERCISES.slice(0, currentIndex + 1).map(e => e.name);
          saveWorkoutHistory({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            exercisesCompleted: completedExercises,
            totalTimeSeconds: totalTime,
            caloriesBurned: Math.round(totalTime * 0.15),
          });
          navigation.navigate("Home");
        } 
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Video/Image Area */}
      <ImageBackground
        source={{ uri: currentExercise.image }}
        style={styles.videoArea}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={handleStop}>
            <Feather name="x" size={28} color="#FFF" style={styles.iconShadow} />
          </TouchableOpacity>
          <Text style={styles.progressText}>{currentIndex + 1} / {EXERCISES.length}</Text>
        </View>
        
        {/* Play/Pause Icon overlay */}
        {isPaused && (
          <TouchableOpacity style={styles.playOverlay} onPress={() => setIsPaused(false)}>
            <Ionicons name="play" size={64} color="#FFF" style={styles.iconShadow} />
          </TouchableOpacity>
        )}

        {/* Video Progress Bar */}
        <View style={styles.videoProgressBar}>
          <View style={[styles.videoProgressFill, { width: `${((currentIndex) / EXERCISES.length) * 100}%` }]} />
        </View>
      </ImageBackground>

      {/* Content Area */}
      <View style={styles.content}>
        <Text style={[styles.exerciseTitle, { color: theme.text }]}>{currentExercise.name}</Text>
        <Text style={[styles.exerciseSet, { color: theme.textSecondary }]}>Latihan {currentIndex + 1} dari {EXERCISES.length}</Text>
        
        <View style={styles.timerWrapper}>
          <SmallTimerCircle 
            percent={(timeLeft / currentExercise.duration) * 100} 
            timeString={timeLeft.toString()} 
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.stopBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => setIsPaused(!isPaused)}
          >
            <Ionicons name={isPaused ? "play" : "pause"} size={20} color={theme.text} />
            <Text style={[styles.stopBtnText, { color: theme.text }]}>{isPaused ? "Lanjut" : "Jeda"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Feather name="skip-forward" size={18} color="#FFF" />
            <Text style={styles.nextBtnText}>
              {currentIndex === EXERCISES.length - 1 ? "Selesai" : "Berikutnya"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  videoArea: { width: "100%", height: "45%", justifyContent: "space-between", paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  headerNav: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { color: '#FFF', fontSize: 16, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
  iconShadow: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 },
  playOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", backgroundColor: 'rgba(0,0,0,0.3)' },
  videoProgressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", width: "100%" },
  videoProgressFill: { height: "100%", backgroundColor: "#00B93F" },
  content: { flex: 1, padding: 24, alignItems: "center" },
  exerciseTitle: { fontSize: 28, fontWeight: "700", color: "#333", marginBottom: 4, marginTop: 10 },
  exerciseSet: { fontSize: 14, color: "#888", fontWeight: "500", marginBottom: 30 },
  timerWrapper: { marginBottom: 50 },
  smallTimerText: { fontSize: 24, fontWeight: "800", color: "#333" },
  actionRow: { flexDirection: "row", gap: 16, width: "100%" },
  stopBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E0E0E0" },
  stopBtnText: { fontSize: 16, fontWeight: "600", color: "#333" },
  nextBtn: { flex: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: "#00B93F" },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" }
});