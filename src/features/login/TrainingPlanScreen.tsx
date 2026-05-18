// src/screens/TrainingPlanScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../../App";
import { BorderRadius, Colors, Spacing } from "../../theme/colors";
import { useUser } from "../../context/UserContext";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TrainingPlan">;
};

interface ScheduleItem {
  id: string;
  day: string;
  program: string;
  time: string;
  duration: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const PROGRAMS = [
  { name: "Full Body Strength", icon: "dumbbell" },
  { name: "Fat Burn Cardio", icon: "run" },
  { name: "HIIT Cardio", icon: "flash" },
  { name: "Yoga & Flexibility", icon: "yoga" },
  { name: "ABS Shredder", icon: "shield-half-full" },
];
const TIMES = ["06:00", "07:30", "08:30", "16:30", "19:00", "20:30"];
const DURATIONS = ["15 Min", "30 Min", "45 Min", "60 Min"];

export default function TrainingPlanScreen({ navigation }: Props) {
  const { isDarkMode } = useUser();

  // Selected state
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [selectedProgram, setSelectedProgram] = useState("Full Body Strength");
  const [selectedTime, setSelectedTime] = useState("07:30");
  const [selectedDuration, setSelectedDuration] = useState("30 Min");

  // Scheduled list
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { id: "1", day: "Senin", program: "Fat Burn Cardio", time: "07:30", duration: "30 Min" },
    { id: "2", day: "Rabu", program: "ABS Shredder", time: "16:30", duration: "45 Min" },
  ]);

  // Dynamic colors
  const theme = {
    bg: isDarkMode ? "#121212" : "#FFFFFF",
    cardBg: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
    textSecondary: isDarkMode ? "#A0A0A0" : "#757575",
    border: isDarkMode ? "#2C2C2C" : "#EBEBEB",
    headerBg: isDarkMode ? "#121212" : "#FFFFFF",
    inputBg: isDarkMode ? "#252525" : "#F5F5F5",
  };

  const handleAddSchedule = () => {
    // Check if duplicate
    const exists = schedules.some(
      (s) => s.day === selectedDay && s.time === selectedTime
    );

    if (exists) {
      Alert.alert(
        "Jadwal Tabrakan",
        `Anda sudah menjadwalkan latihan pada hari ${selectedDay} jam ${selectedTime}. Silakan pilih waktu lain.`
      );
      return;
    }

    const newSchedule: ScheduleItem = {
      id: String(Date.now()),
      day: selectedDay,
      program: selectedProgram,
      time: selectedTime,
      duration: selectedDuration,
    };

    setSchedules([newSchedule, ...schedules]);
    Alert.alert(
      "Berhasil Dijadwalkan! 🎉",
      `Program ${selectedProgram} telah dijadwalkan untuk hari ${selectedDay} pukul ${selectedTime} (${selectedDuration}).`
    );
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert(
      "Hapus Jadwal",
      "Apakah Anda yakin ingin menghapus jadwal latihan ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            setSchedules(schedules.filter((s) => s.id !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.inputBg }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Jadwal Program 📅</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Step Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.text }]}>Atur Jadwal Latihan Anda</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sesuaikan hari, waktu, dan program latihan yang Anda inginkan untuk minggu ini.
          </Text>
        </View>

        {/* 1. Days Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Pilih Hari</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.8}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? "#00B93F" : theme.cardBg,
                      borderColor: isSelected ? "#00B93F" : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.chipText, { color: isSelected ? "#FFF" : theme.text }]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Program Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Pilih Jenis Program</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {PROGRAMS.map((prog) => {
              const isSelected = selectedProgram === prog.name;
              return (
                <TouchableOpacity
                  key={prog.name}
                  activeOpacity={0.8}
                  style={[
                    styles.chipLarge,
                    {
                      backgroundColor: isSelected ? "#00B93F" : theme.cardBg,
                      borderColor: isSelected ? "#00B93F" : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedProgram(prog.name)}
                >
                  <MaterialCommunityIcons
                    name={prog.icon as any}
                    size={22}
                    color={isSelected ? "#FFF" : "#00B93F"}
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={[styles.chipLargeText, { color: isSelected ? "#FFF" : theme.text }]}>
                    {prog.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Time & Duration Group */}
        <View style={styles.dualSection}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Jam</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                {TIMES.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      onPress={() => setSelectedTime(time)}
                      style={[
                        styles.pickerItem,
                        { backgroundColor: isSelected ? "rgba(0, 185, 63, 0.1)" : "transparent" },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#00B93F" : theme.text }}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Durasi</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                {DURATIONS.map((dur) => {
                  const isSelected = selectedDuration === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      onPress={() => setSelectedDuration(dur)}
                      style={[
                        styles.pickerItem,
                        { backgroundColor: isSelected ? "rgba(0, 185, 63, 0.1)" : "transparent" },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#00B93F" : theme.text }}>
                        {dur}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.submitBtn}
          onPress={handleAddSchedule}
        >
          <Text style={styles.submitBtnText}>Jadwalkan Latihan</Text>
        </TouchableOpacity>

        {/* 4. Active Schedules */}
        <View style={styles.schedulesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Jadwal Aktif Anda 📋</Text>
          {schedules.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Feather name="calendar" size={32} color="#888" style={{ marginBottom: 8 }} />
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center" }}>Belum ada program yang dijadwalkan.</Text>
            </View>
          ) : (
            schedules.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.scheduleCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                ]}
              >
                <View style={styles.scheduleIconWrapper}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#00B93F" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.scheduleProgram, { color: theme.text }]}>{item.program}</Text>
                  <Text style={[styles.scheduleTime, { color: theme.textSecondary }]}>
                    {item.day} • {item.time} ({item.duration})
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDeleteSchedule(item.id)}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  titleSection: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", paddingHorizontal: 20, marginBottom: 10 },
  horizontalScroll: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipLarge: {
    width: 125,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  chipLargeText: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  dualSection: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 24 },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  submitBtn: {
    backgroundColor: "#00B93F",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#00B93F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 28,
  },
  submitBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  schedulesSection: { paddingHorizontal: 20 },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  scheduleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0, 185, 63, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleProgram: { fontSize: 14, fontWeight: "700" },
  scheduleTime: { fontSize: 12, marginTop: 2 },
  deleteButton: { padding: 6 },
});
