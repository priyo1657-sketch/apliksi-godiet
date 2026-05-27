/**
 * src/services/tokenStorage.ts
 * ─────────────────────────────────────────────────────────────────────
 * Utility untuk menyimpan, membaca, dan menghapus JWT token dari
 * AsyncStorage. Semua fungsi bersifat asynchronous.
 * ─────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'godiet_jwt_token';

/**
 * Simpan JWT token ke penyimpanan lokal.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('[TokenStorage] Token JWT berhasil disimpan.');
  } catch (e) {
    console.error('[TokenStorage] Gagal menyimpan token:', e);
  }
}

/**
 * Ambil JWT token dari penyimpanan lokal.
 * Mengembalikan null jika token tidak ditemukan.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('[TokenStorage] Gagal membaca token:', e);
    return null;
  }
}

/**
 * Hapus JWT token dari penyimpanan lokal (misalnya saat logout).
 */
export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('[TokenStorage] Token JWT berhasil dihapus.');
  } catch (e) {
    console.error('[TokenStorage] Gagal menghapus token:', e);
  }
}
