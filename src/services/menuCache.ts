/**
 * src/services/menuCache.ts
 * ─────────────────────────────────────────────────────────────────────
 * Service untuk menyimpan hasil rekomendasi menu secara lokal (cache).
 *
 * Strategi:
 *   1. Setelah fetch dari server AI, simpan response + hash profil ke AsyncStorage.
 *   2. Saat buka Recipes screen, cek cache terlebih dahulu:
 *      - Jika ada cache DAN profil belum berubah → pakai cache (tanpa request ke server).
 *      - Jika profil berubah atau cache kosong → fetch ulang dari server.
 *   3. Cache otomatis di-invalidate saat user mengubah variabel diet
 *      (berat badan, tinggi badan, usia, jenis kelamin, aktivitas, tujuan).
 *   4. Opsional: cache expire setelah 24 jam untuk memberikan variasi menu.
 * ─────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MenuRecommendation, NutritionTarget, DietProfile } from './api';

// ── Constants ───────────────────────────────────────────────────────

const CACHE_KEY = 'godiet_menu_cache';

/** Cache kadaluarsa setelah 24 jam (dalam milidetik) */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Types ───────────────────────────────────────────────────────────

export interface CachedMenuData {
  /** Hash dari profil diet user saat cache dibuat */
  profileHash: string;
  /** Timestamp saat cache disimpan (epoch ms) */
  timestamp: number;
  /** Menu per kategori: Breakfast, Lunch, Dinner */
  menus: Record<string, MenuRecommendation[]>;
  /** Target nutrisi harian */
  target: NutritionTarget | null;
  /** Apakah data berasal dari server AI (true) atau fallback (false) */
  fromServer: boolean;
}

// ── Hash Profil ─────────────────────────────────────────────────────

/**
 * Buat hash sederhana dari profil diet user.
 * Digunakan untuk membandingkan apakah profil berubah sejak cache terakhir.
 *
 * Variabel yang mempengaruhi rekomendasi:
 *   - jenis kelamin (jk)
 *   - umur
 *   - tinggi badan (tb)
 *   - berat badan (bb)
 *   - tujuan diet
 */
export function createProfileHash(profile: DietProfile): string {
  const raw = `${profile.jk}|${profile.umur}|${profile.tb}|${profile.bb}|${profile.tujuan}`;
  // Simple hash — cukup untuk deteksi perubahan, bukan untuk keamanan
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ph_${Math.abs(hash).toString(36)}`;
}

// ── Save ────────────────────────────────────────────────────────────

/**
 * Simpan hasil rekomendasi menu ke cache lokal.
 */
export async function saveMenuCache(
  profile: DietProfile,
  menus: Record<string, MenuRecommendation[]>,
  target: NutritionTarget | null,
  fromServer: boolean,
): Promise<void> {
  try {
    const cacheData: CachedMenuData = {
      profileHash: createProfileHash(profile),
      timestamp: Date.now(),
      menus,
      target,
      fromServer,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('[MenuCache] Cache disimpan ✅', {
      hash: cacheData.profileHash,
      menuCount: Object.values(menus).flat().length,
      fromServer,
    });
  } catch (error) {
    console.log('[MenuCache] Gagal menyimpan cache:', error);
  }
}

// ── Load ────────────────────────────────────────────────────────────

/**
 * Baca cache menu dari storage.
 * Return null jika:
 *   - Cache tidak ada
 *   - Profil berubah (hash berbeda)
 *   - Cache sudah kadaluarsa (>24 jam)
 */
export async function loadMenuCache(
  currentProfile: DietProfile,
): Promise<CachedMenuData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      console.log('[MenuCache] Tidak ada cache.');
      return null;
    }

    const cached: CachedMenuData = JSON.parse(raw);
    const currentHash = createProfileHash(currentProfile);

    // 1. Cek apakah profil berubah
    if (cached.profileHash !== currentHash) {
      console.log('[MenuCache] Profil berubah — cache invalidated.', {
        old: cached.profileHash,
        new: currentHash,
      });
      return null;
    }

    // 2. Cek apakah cache kadaluarsa
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL_MS) {
      console.log('[MenuCache] Cache kadaluarsa (>24 jam) — perlu refresh.');
      return null;
    }

    // 3. Validasi bahwa menus tidak kosong
    const totalMenus = Object.values(cached.menus).flat().length;
    if (totalMenus === 0) {
      console.log('[MenuCache] Cache kosong — perlu fetch ulang.');
      return null;
    }

    const ageMinutes = Math.round(age / 60000);
    console.log(`[MenuCache] Cache valid ✅ (umur: ${ageMinutes} menit, ${totalMenus} menu)`);
    return cached;
  } catch (error) {
    console.log('[MenuCache] Gagal membaca cache:', error);
    return null;
  }
}

// ── Invalidate ──────────────────────────────────────────────────────

/**
 * Hapus cache menu. Dipanggil saat user mengubah profil diet.
 */
export async function invalidateMenuCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('[MenuCache] Cache di-invalidate 🗑️');
  } catch (error) {
    console.log('[MenuCache] Gagal menghapus cache:', error);
  }
}

// ── Helper: Cek apakah variabel diet berubah ────────────────────────

/**
 * Bandingkan field-field yang mempengaruhi rekomendasi diet.
 * Return true jika ada perubahan → perlu invalidasi cache.
 */
export function hasDietProfileChanged(
  oldProfile: {
    berat_badan?: number;
    tinggi_badan?: number;
    usia?: number;
    jenis_kelamin?: string;
    tingkat_aktivitas?: string;
  },
  newUpdates: Record<string, any>,
): boolean {
  const dietFields = [
    'berat_badan',
    'tinggi_badan',
    'usia',
    'jenis_kelamin',
    'tingkat_aktivitas',
  ];

  for (const field of dietFields) {
    if (
      field in newUpdates &&
      newUpdates[field] !== undefined &&
      newUpdates[field] !== (oldProfile as any)[field]
    ) {
      console.log(`[MenuCache] Diet field berubah: ${field}`, {
        old: (oldProfile as any)[field],
        new: newUpdates[field],
      });
      return true;
    }
  }

  return false;
}
