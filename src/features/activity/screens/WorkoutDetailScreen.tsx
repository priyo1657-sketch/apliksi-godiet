// src/screens/WorkoutDetailScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Platform } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { EXERCISES } from "./ExerciseScreen";

export default function WorkoutDetailScreen({ navigation }: any) {

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Top Image Header */}
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=800&fit=crop" }}
          style={styles.headerImage}
        >
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Content Card (Overlapping Image) */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Progres Mingguan</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="clock" size={16} color="#888" />
              <Text style={styles.infoText}>25 mins</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={styles.infoText}>200 kCal</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {["Beginner", "Cardio", "Lose"].map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Program Olahraga</Text>
          
          {EXERCISES.map((item, index) => (
            <View key={index} style={styles.exerciseCard}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.exerciseImg} 
              />
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseSets}>{item.duration} detik</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("GetReady")}>
                <Ionicons name="play-circle" size={28} color="#00B93F" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => navigation.navigate("GetReady")} // 🔴 TERSAMBUNG KE LAYAR SELANJUTNYA
        >
          <Text style={styles.startButtonText}>Mulai Olahraga</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerImage: { width: "100%", height: 350, justifyContent: "flex-start", paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  headerNav: { paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  contentContainer: { backgroundColor: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -40, padding: 24, minHeight: 500 },
  title: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 16 },
  infoRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 14, color: "#666", fontWeight: "500" },
  tagsRow: { flexDirection: "row", gap: 12, marginBottom: 30 },
  tag: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: "#F5F5F5", borderRadius: 20 },
  tagText: { fontSize: 12, color: "#333", fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 16 },
  exerciseCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  exerciseImg: { width: 48, height: 48, borderRadius: 12, marginRight: 16 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 4 },
  exerciseSets: { fontSize: 12, color: "#888" },
  bottomBar: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#FFF", padding: 20, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  startButton: { backgroundColor: "#00B93F", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  startButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});