/**
 * src/services/api.ts
 * ─────────────────────────────────────────────────────────────────────
 * Service untuk berkomunikasi dengan ML Inference Server (FastAPI).
 * Server hanya melakukan prediksi, BUKAN training.
 * ─────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';

// Android emulator menggunakan 10.0.2.2 untuk akses localhost host machine
// iOS simulator dan web bisa langsung pakai localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

// ── Types ───────────────────────────────────────────────────────────

export interface DietProfile {
  jk: string;      // 'l' atau 'p'
  umur: number;
  tb: number;       // tinggi badan (cm)
  bb: number;       // berat badan (kg)
  tujuan: 'turun_berat' | 'tetap_bugar' | 'lebih_kuat' | 'massa_otot';
}

export interface MenuRecommendation {
  nama_menu: string;
  url: string;
  kalori: number;
  protein_g: number;
  karbohidrat_g: number;
  lemak_g: number;
  serat_g: number;
  bahan: string;
  skor_agen: number;
  dipilih_kali: number;
}

export interface NutritionTarget {
  kalori: number;
  protein_g: number;
  karbohidrat_g: number;
  lemak_g: number;
}

export interface RecommendResponse {
  success: boolean;
  profile: DietProfile;
  target: NutritionTarget;
  recommendations: MenuRecommendation[];
  total_3_meals: NutritionTarget | null;
}

export interface GoalOption {
  key: string;
  label: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  menu_count: number;
  device: string;
}

// ── API Functions ───────────────────────────────────────────────────

/**
 * Cek apakah server ML aktif dan model siap.
 */
export async function checkServerHealth(): Promise<HealthStatus> {
  const response = await fetch(`${BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Ambil daftar tujuan diet yang tersedia.
 */
export async function getGoals(): Promise<GoalOption[]> {
  const response = await fetch(`${BASE_URL}/api/goals`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.goals;
}

/**
 * Minta rekomendasi menu dari AI berdasarkan profil user.
 * Server hanya melakukan inference (forward pass), bukan training.
 */
export async function getRecommendations(profile: DietProfile): Promise<RecommendResponse> {
  const response = await fetch(`${BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Server error: ${response.status}`
    );
  }

  return response.json();
}
