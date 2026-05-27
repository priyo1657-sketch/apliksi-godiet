import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { invalidateMenuCache, hasDietProfileChanged } from '../services/menuCache';
import { saveToken, getToken, removeToken } from '../services/tokenStorage';

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
  tujuan: string;      // Tujuan diet/fitness user (Fat Loss, Muscle Gain, dll)
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
  setToken: (token: string) => Promise<void>;
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
  setToken: async () => {},
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
        // JWT token sudah disimpan oleh tokenStorage.ts — tidak perlu load manual di sini
        const existingToken = await getToken();
        if (existingToken) {
          console.log('[UserContext] Token JWT ditemukan di storage.');
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

  // Fungsi untuk menyimpan token JWT
  const setToken = async (token: string): Promise<void> => {
    await saveToken(token);
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
      // Baca token JWT dari storage untuk disertakan di header
      const token = await getToken();
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${API_URL}/api/user/profile/${user.id_user}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          nama: updated.nama || '',
          berat_badan: Number(updated.berat_badan) || 0,
          tinggi_badan: Number(updated.tinggi_badan) || 0,
          usia: Number(updated.usia) || 0,
          jenis_kelamin: updated.jenis_kelamin || '',
          tingkat_aktivitas: updated.tingkat_aktivitas || '',
          target_kalori_harian: Number(updated.target_kalori_harian) || 0,
          foto_profil: updated.foto_profil || '',
          tujuan: updated.tujuan || '',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(updated);
        return true;
      } else {
        console.log('[UserContext] Gagal update profil di server:', data.message);
        return false;
      }
    } catch (e) {
      console.log('[UserContext] Gagal update profil:', e);
      return false;
    }
  };

  // Fungsi simpan riwayat olahraga — simpan lokal + sync ke server (fire-and-forget)
  const saveWorkoutHistory = (history: WorkoutHistoryItem) => {
    const updatedHistory = [history, ...workoutHistory];
    setWorkoutHistory(updatedHistory);
    AsyncStorage.setItem('godiet_workout_history', JSON.stringify(updatedHistory));

    // Sinkronisasi ke server — gagal tidak mempengaruhi pengalaman user
    if (user?.id_user) {
      const tanggal = history.date.split('T')[0]; // ambil format YYYY-MM-DD
      fetch(`${API_URL}/api/user/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_workout: history.id,
          id_user: user.id_user,
          tanggal,
          durasi_detik: history.totalTimeSeconds,
          kalori_terbakar: history.caloriesBurned,
        }),
      }).catch(e => console.log('[UserContext] Sync workout gagal (offline?):', e));
    }
  };

  // Fungsi hapus riwayat olahraga
  const deleteWorkoutHistory = (id: string) => {
    const updatedHistory = workoutHistory.filter(item => item.id !== id);
    setWorkoutHistory(updatedHistory);
    AsyncStorage.setItem('godiet_workout_history', JSON.stringify(updatedHistory));
  };

  // Fungsi logout — hapus semua data lokal termasuk cache menu dan token JWT
  const logout = async () => {
    setUserState(null);
    await AsyncStorage.removeItem('godiet_user');
    await removeToken(); // Hapus token JWT
    await invalidateMenuCache();
    console.log('[UserContext] User logout — token JWT dihapus.');
  };

  return (
    <UserContext.Provider value={{ user, workoutHistory, isDarkMode, toggleDarkMode, moodEmoji, setMoodEmoji, setUser, setToken, updateProfile, saveWorkoutHistory, deleteWorkoutHistory, logout, isLoggedIn: !!user }}>
      {children}
    </UserContext.Provider>
  );
};
