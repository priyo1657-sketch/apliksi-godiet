import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { invalidateMenuCache, hasDietProfileChanged } from '../services/menuCache';

const API_URL = 'https://web-production-78ab8.up.railway.app';

// Tipe data profil pengguna
export interface UserProfile {
  id_user: string;
  email: string;
  role: string;
  nama: string;
  berat_badan: number;
  tinggi_badan: number;
  usia: number;
  jenis_kelamin: string;
  tingkat_aktivitas: string;
  target_kalori_harian: number;
  foto_profil: string; // URI foto lokal atau URL
}

export interface WorkoutHistoryItem {
  id: string;
  date: string;
  exercisesCompleted: string[];
  totalTimeSeconds: number;
  caloriesBurned: number;
}

interface UserContextType {
  user: UserProfile | null;
  workoutHistory: WorkoutHistoryItem[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  moodEmoji: string;
  setMoodEmoji: (emoji: string) => void;
  setUser: (user: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  saveWorkoutHistory: (history: WorkoutHistoryItem) => void;
  deleteWorkoutHistory: (id: string) => void;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  workoutHistory: [],
  isDarkMode: false,
  toggleDarkMode: () => {},
  moodEmoji: '😊',
  setMoodEmoji: () => {},
  setUser: () => {},
  updateProfile: async () => false,
  saveWorkoutHistory: () => {},
  deleteWorkoutHistory: () => {},
  logout: async () => {},
  isLoggedIn: false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [moodEmoji, setMoodEmojiState] = useState('😊');

  // Saat aplikasi dimulai, baca data yang tersimpan dari penyimpanan lokal
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('godiet_user');
        if (stored) {
          setUserState(JSON.parse(stored));
        }
        const storedHistory = await AsyncStorage.getItem('godiet_workout_history');
        if (storedHistory) {
          setWorkoutHistory(JSON.parse(storedHistory));
        }
        const storedDarkMode = await AsyncStorage.getItem('godiet_dark_mode');
        if (storedDarkMode === 'true') {
          setIsDarkMode(true);
        }
        const storedMood = await AsyncStorage.getItem('godiet_mood_emoji');
        if (storedMood) {
          setMoodEmojiState(storedMood);
        }
      } catch (e) {
        console.log('[UserContext] Gagal membaca data lokal:', e);
      }
    };
    loadUser();
  }, []);

  const setMoodEmoji = (emoji: string) => {
    setMoodEmojiState(emoji);
    AsyncStorage.setItem('godiet_mood_emoji', emoji);
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const nextVal = !prev;
      AsyncStorage.setItem('godiet_dark_mode', String(nextVal));
      return nextVal;
    });
  };

  // Setiap kali data user berubah, simpan ke penyimpanan lokal
  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      AsyncStorage.setItem('godiet_user', JSON.stringify(newUser));
    } else {
      AsyncStorage.removeItem('godiet_user');
    }
  };

  // Fungsi update profil — kirim ke server + simpan lokal
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    // Cek apakah field diet berubah → invalidasi cache menu
    if (hasDietProfileChanged(user, updates)) {
      console.log('[UserContext] Profil diet berubah — menu cache di-invalidate.');
      await invalidateMenuCache();
    }

    const updated = { ...user, ...updates };

    try {
      const response = await fetch(`${API_URL}/api/user/profile/${user.id_user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: updated.nama,
          berat_badan: updated.berat_badan,
          tinggi_badan: updated.tinggi_badan,
          usia: updated.usia,
          jenis_kelamin: updated.jenis_kelamin,
          tingkat_aktivitas: updated.tingkat_aktivitas,
          target_kalori_harian: updated.target_kalori_harian,
          foto_profil: updated.foto_profil,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(updated);
        return true;
      }
    } catch (e) {
      console.log('[UserContext] Gagal update profil:', e);
    }

    // Simpan lokal saja jika gagal ke server (offline-friendly)
    setUser(updated);
    return true;
  };

  // Fungsi simpan riwayat olahraga
  const saveWorkoutHistory = (history: WorkoutHistoryItem) => {
    const updatedHistory = [history, ...workoutHistory];
    setWorkoutHistory(updatedHistory);
    AsyncStorage.setItem('godiet_workout_history', JSON.stringify(updatedHistory));
  };

  // Fungsi hapus riwayat olahraga
  const deleteWorkoutHistory = (id: string) => {
    const updatedHistory = workoutHistory.filter(item => item.id !== id);
    setWorkoutHistory(updatedHistory);
    AsyncStorage.setItem('godiet_workout_history', JSON.stringify(updatedHistory));
  };

  // Fungsi logout — hapus semua data lokal termasuk cache menu
  const logout = async () => {
    setUserState(null);
    await AsyncStorage.removeItem('godiet_user');
    await invalidateMenuCache();
  };

  return (
    <UserContext.Provider value={{ user, workoutHistory, isDarkMode, toggleDarkMode, moodEmoji, setMoodEmoji, setUser, updateProfile, saveWorkoutHistory, deleteWorkoutHistory, logout, isLoggedIn: !!user }}>
      {children}
    </UserContext.Provider>
  );
};
