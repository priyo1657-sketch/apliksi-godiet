import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import {
  getRecommendations,
  checkServerHealth,
  MenuRecommendation,
  DietProfile,
  NutritionTarget,
} from '../../../services/api';
import { useUser } from "../../../context/UserContext";
import { loadMenuCache, saveMenuCache, createProfileHash } from '../../../services/menuCache';
import recipeDetailsData from '../../../data/cookpad_diet_results.json';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#00C853';
const BG_COLOR = '#FFFFFF';
const mealCategories = ['Breakfast', 'Lunch', 'Dinner'];

// ── Fallback data (tampil saat server AI tidak merespons) ─────────────────────
// 36 menu unik: 12 untuk Breakfast, 12 untuk Lunch, 12 untuk Dinner
const fallbackMeals: MenuRecommendation[] = [
  // ── Breakfast (0-11) ──────────────────────────────────────────────
  { nama_menu: 'Salmon Panggang & Brokoli',      url: 'https://cookpad.com/id/resep/24642279', kalori: 230, protein_g: 28, karbohidrat_g: 12, lemak_g: 8,  serat_g: 3, bahan: 'Ikan salmon|Brokoli|Paprika|Nasi', skor_agen: 0.9, dipilih_kali: 5 },
  { nama_menu: 'Wrap Telur & Sayuran',            url: 'https://cookpad.com/id/resep/23933390', kalori: 310, protein_g: 22, karbohidrat_g: 28, lemak_g: 12, serat_g: 4, bahan: 'Telur|Selada|Timun|Tomat|Kulit lumpia', skor_agen: 0.85, dipilih_kali: 4 },
  { nama_menu: 'Oat Cake In Jar',                url: 'https://cookpad.com/id/resep/16489635', kalori: 280, protein_g: 9,  karbohidrat_g: 42, lemak_g: 9,  serat_g: 5, bahan: 'Oat|Pisang|Baking powder|Susu cair|Kismis', skor_agen: 0.8, dipilih_kali: 3 },
  { nama_menu: 'Bakwan Oatmeal Diet',            url: 'https://cookpad.com/id/resep/16074006', kalori: 220, protein_g: 10, karbohidrat_g: 30, lemak_g: 6,  serat_g: 4, bahan: 'Oat|Telur ayam|Wortel|Kol|Bawang putih|Daun bawang', skor_agen: 0.75, dipilih_kali: 3 },
  { nama_menu: 'Roti Oat Diet',                  url: 'https://cookpad.com/id/resep/16776632', kalori: 320, protein_g: 10, karbohidrat_g: 55, lemak_g: 7,  serat_g: 6, bahan: 'Tepung terigu|Oat|Gula|Minyak goreng|Ragi', skor_agen: 0.72, dipilih_kali: 2 },
  { nama_menu: 'Banana Milkshake Oat',           url: 'https://cookpad.com/id/resep/15168648', kalori: 195, protein_g: 6,  karbohidrat_g: 38, lemak_g: 3,  serat_g: 4, bahan: 'Pisang raja|Oat quaker', skor_agen: 0.7, dipilih_kali: 2 },
  { nama_menu: 'Telur Rebus & Sayur Kukus',      url: 'https://cookpad.com/id/resep/16683293', kalori: 180, protein_g: 14, karbohidrat_g: 12, lemak_g: 7,  serat_g: 3, bahan: 'Telur|Wortel|Kol|Bawang putih', skor_agen: 0.68, dipilih_kali: 2 },
  { nama_menu: 'Ice Cream Oatmeal Diet',         url: 'https://cookpad.com/id/resep/16096127', kalori: 210, protein_g: 8,  karbohidrat_g: 35, lemak_g: 4,  serat_g: 3, bahan: 'Oatmeal|Kurma|Susu UHT Low Fat|Gula Tropicana Slim', skor_agen: 0.65, dipilih_kali: 1 },
  { nama_menu: 'Salad Sayur Enak Diet',          url: 'https://cookpad.com/id/resep/15396366', kalori: 185, protein_g: 8,  karbohidrat_g: 14, lemak_g: 10, serat_g: 4, bahan: 'Kol ungu|Wortel|Selada|Bawang bombay|Mayonaise|Telur rebus', skor_agen: 0.63, dipilih_kali: 1 },
  { nama_menu: 'Tumis Pakis Diet',               url: 'https://cookpad.com/id/resep/16645939', kalori: 130, protein_g: 5,  karbohidrat_g: 16, lemak_g: 5,  serat_g: 5, bahan: 'Sayur pakis|Bawang merah|Bawang putih|Cabe rawit', skor_agen: 0.6, dipilih_kali: 1 },
  { nama_menu: 'Pizza Oatmeal Diet',             url: 'https://cookpad.com/id/resep/15327170', kalori: 310, protein_g: 14, karbohidrat_g: 45, lemak_g: 8,  serat_g: 5, bahan: 'Oatmeal|Baking powder|Greek yogurt|Saus tomat|Jagung|Wortel', skor_agen: 0.58, dipilih_kali: 1 },
  { nama_menu: 'Tumis Diet Paling Mudah',        url: 'https://cookpad.com/id/resep/15275671', kalori: 160, protein_g: 10, karbohidrat_g: 14, lemak_g: 6,  serat_g: 3, bahan: 'Tahu kuning|Tomat|Tauge|Sawi hijau|Saus tiram', skor_agen: 0.55, dipilih_kali: 1 },
  // ── Lunch (12-23) ────────────────────────────────────────────────
  { nama_menu: 'Salad Ayam Jagung',              url: 'https://cookpad.com/id/resep/17132060', kalori: 309, protein_g: 27, karbohidrat_g: 35, lemak_g: 7,  serat_g: 5, bahan: 'Ayam|Jagung manis|Tomat ceri|Lettuce|Timun', skor_agen: 0.9, dipilih_kali: 4 },
  { nama_menu: 'Salmon Don & Tahu',              url: 'https://cookpad.com/id/resep/17039707', kalori: 375, protein_g: 38, karbohidrat_g: 28, lemak_g: 12, serat_g: 3, bahan: 'Salmon|Tahu|Nasi|Soy sauce|Wasabi', skor_agen: 0.85, dipilih_kali: 4 },
  { nama_menu: 'Udang Tahu Kuah',               url: 'https://cookpad.com/id/resep/16975200', kalori: 210, protein_g: 25, karbohidrat_g: 12, lemak_g: 6,  serat_g: 2, bahan: 'Udang|Baby pokcoy|Tahu|Bawang putih|Cabe|Jahe', skor_agen: 0.82, dipilih_kali: 3 },
  { nama_menu: 'Ayam Bacem Panggang',            url: 'https://cookpad.com/id/resep/16953927', kalori: 285, protein_g: 30, karbohidrat_g: 22, lemak_g: 8,  serat_g: 1, bahan: 'Ayam|Tahu putih|Air kelapa|Bawang merah|Bawang putih|Kecap manis', skor_agen: 0.78, dipilih_kali: 3 },
  { nama_menu: 'Chicken Steak Diet',             url: 'https://cookpad.com/id/resep/16308375', kalori: 295, protein_g: 32, karbohidrat_g: 18, lemak_g: 9,  serat_g: 3, bahan: 'Dada ayam fillet|Wortel rebus|Baby buncis|Kentang kukus', skor_agen: 0.75, dipilih_kali: 2 },
  { nama_menu: 'Sapi Cah Jamur',                url: 'https://cookpad.com/id/resep/15255699', kalori: 320, protein_g: 28, karbohidrat_g: 15, lemak_g: 14, serat_g: 3, bahan: 'Daging sapi|Jamur shimeji|Bawang putih|Kecap asin|Ubi|Brokoli', skor_agen: 0.73, dipilih_kali: 2 },
  { nama_menu: 'Tuna Salad Diet Praktis',        url: 'https://cookpad.com/id/resep/15042744', kalori: 175, protein_g: 24, karbohidrat_g: 6,  lemak_g: 7,  serat_g: 2, bahan: 'Tuna fillet|Jeruk lemon|Sayur salad|Kwepie wijen', skor_agen: 0.7, dipilih_kali: 2 },
  { nama_menu: 'Ayam Pandan Ala Thailand',       url: 'https://cookpad.com/id/resep/15436487', kalori: 265, protein_g: 30, karbohidrat_g: 12, lemak_g: 10, serat_g: 1, bahan: 'Paha ayam|Bawang putih|Jahe|Sereh|Kecap asin|Daun pandan', skor_agen: 0.68, dipilih_kali: 1 },
  { nama_menu: 'Pecel Ulek Diet',               url: 'https://cookpad.com/id/resep/16234449', kalori: 200, protein_g: 10, karbohidrat_g: 22, lemak_g: 8,  serat_g: 6, bahan: 'Touge|Bayam|Kacang panjang|Timun|Kacang tanah', skor_agen: 0.65, dipilih_kali: 1 },
  { nama_menu: 'Bihun Goreng Diet Tanpa Minyak', url: 'https://cookpad.com/id/resep/14948996', kalori: 480, protein_g: 15, karbohidrat_g: 85, lemak_g: 6,  serat_g: 4, bahan: 'Bihun jagung|Tauge|Tomat|Sawi hijau|Wortel|Kecap', skor_agen: 0.62, dipilih_kali: 1 },
  { nama_menu: 'Sambel Pecel Enak Diet',         url: 'https://cookpad.com/id/resep/16380460', kalori: 155, protein_g: 6,  karbohidrat_g: 14, lemak_g: 9,  serat_g: 3, bahan: 'Kacang tanah|Cabe rawit|Bawang putih|Kencur|Kurma|Garam himalaya', skor_agen: 0.58, dipilih_kali: 1 },
  // ── Dinner (24-35) ───────────────────────────────────────────────
  { nama_menu: 'Ayam Hainan & Nasi Shirataki',  url: 'https://cookpad.com/id/resep/15772049', kalori: 290, protein_g: 26, karbohidrat_g: 18, lemak_g: 10, serat_g: 4, bahan: 'Sayap ayam|Beras shirataki|Lemon|Minyak wijen|Kecap asin|Pokcoy', skor_agen: 0.9, dipilih_kali: 3 },
  { nama_menu: 'Tahu Tempe Kuning Rebus',        url: 'https://cookpad.com/id/resep/15714386', kalori: 185, protein_g: 14, karbohidrat_g: 14, lemak_g: 8,  serat_g: 2, bahan: 'Tahu putih|Tempe|Daun jeruk|Kunyit|Serai|Garam himalaya', skor_agen: 0.85, dipilih_kali: 3 },
  { nama_menu: 'Capcay Nasi Merah Diet',         url: 'https://cookpad.com/id/resep/15708575', kalori: 310, protein_g: 15, karbohidrat_g: 48, lemak_g: 6,  serat_g: 5, bahan: 'Nasi merah|Wortel|Pakcoy|Bawang bombay|Saos tiram', skor_agen: 0.82, dipilih_kali: 2 },
  { nama_menu: 'Terong Balado Kukus',            url: 'https://cookpad.com/id/resep/23887397', kalori: 120, protein_g: 4,  karbohidrat_g: 18, lemak_g: 4,  serat_g: 5, bahan: 'Terong ungu|Cabe merah|Terasi|Bawang merah|Bawang putih', skor_agen: 0.78, dipilih_kali: 2 },
  { nama_menu: 'Balado Kentang Diet',            url: 'https://cookpad.com/id/resep/15819629', kalori: 210, protein_g: 4,  karbohidrat_g: 40, lemak_g: 4,  serat_g: 4, bahan: 'Kentang|Cabe merah|Bawang putih|Bawang merah|Minyak kelapa|Tomat', skor_agen: 0.75, dipilih_kali: 2 },
  { nama_menu: 'Tumis Pokcoy Jagung Brokoli',   url: 'https://cookpad.com/id/resep/16740315', kalori: 140, protein_g: 6,  karbohidrat_g: 20, lemak_g: 4,  serat_g: 5, bahan: 'Pokcoy|Jagung muda|Brokoli|Bawang putih|Saus tiram', skor_agen: 0.72, dipilih_kali: 1 },
  { nama_menu: 'Salmon Panggang Madu',          url: 'https://cookpad.com/id/resep/15405847', kalori: 285, protein_g: 32, karbohidrat_g: 14, lemak_g: 9,  serat_g: 3, bahan: 'Salmon|Bawang putih|Garam|Madu|Wortel rebus|Tempe|Jagung', skor_agen: 0.7, dipilih_kali: 1 },
  { nama_menu: 'Ayam Pandan Rendah Kalori',     url: 'https://cookpad.com/id/resep/15436487', kalori: 260, protein_g: 31, karbohidrat_g: 11, lemak_g: 9,  serat_g: 1, bahan: 'Paha ayam|Sereh|Kunyit|Kecap ikan|Minyak wijen|Gula merah', skor_agen: 0.68, dipilih_kali: 1 },
  { nama_menu: 'Tumis Diet Tahu Tomat',         url: 'https://cookpad.com/id/resep/15275671', kalori: 155, protein_g: 10, karbohidrat_g: 13, lemak_g: 6,  serat_g: 3, bahan: 'Tahu kuning|Tomat|Tauge|Sawi hijau|Kaldu jamur', skor_agen: 0.65, dipilih_kali: 1 },
  { nama_menu: 'Cake Diet Bergizi',             url: 'https://cookpad.com/id/resep/16713017', kalori: 245, protein_g: 7,  karbohidrat_g: 34, lemak_g: 9,  serat_g: 2, bahan: 'Biskuit gandum|Ultra Milk|Coklat putih|Susu kental|Maizena', skor_agen: 0.6, dipilih_kali: 1 },
  { nama_menu: 'Sup Telur Ekonomis',            url: 'https://cookpad.com/id/resep/16683293', kalori: 110, protein_g: 8,  karbohidrat_g: 9,  lemak_g: 4,  serat_g: 2, bahan: 'Wortel|Kol|Telur|Bawang putih|Lada bubuk', skor_agen: 0.57, dipilih_kali: 1 },
  { nama_menu: 'Bolu Pisang Kukus Simple',      url: 'https://cookpad.com/id/resep/15705256', kalori: 190, protein_g: 6,  karbohidrat_g: 28, lemak_g: 7,  serat_g: 2, bahan: 'Telur|Agar-agar|Nutrijell|SP|Mentega|Keju', skor_agen: 0.55, dipilih_kali: 1 },
];

// ── Emoji helper ──────────────────────────────────────
function getIngredientEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('salmon') || n.includes('ikan') || n.includes('tongkol')) return '🐟';
  if (n.includes('ayam') || n.includes('chicken')) return '🍗';
  if (n.includes('telur') || n.includes('egg')) return '🥚';
  if (n.includes('tomat')) return '🍅';
  if (n.includes('brokoli') || n.includes('broccoli')) return '🥦';
  if (n.includes('wortel') || n.includes('carrot')) return '🥕';
  if (n.includes('alpukat') || n.includes('avocado')) return '🥑';
  if (n.includes('nasi') || n.includes('rice') || n.includes('jagung')) return '🌽';
  if (n.includes('selada') || n.includes('lettuce') || n.includes('salad')) return '🥬';
  if (n.includes('timun') || n.includes('cucumber')) return '🥒';
  if (n.includes('tahu') || n.includes('tofu') || n.includes('tempe')) return '🧀';
  if (n.includes('udang') || n.includes('shrimp')) return '🦐';
  if (n.includes('gula') || n.includes('sugar')) return '🍬';
  if (n.includes('minyak') || n.includes('oil')) return '🫙';
  if (n.includes('cabe') || n.includes('cabai')) return '🌶️';
  return '🥗';
}

// ── Circular progress untuk nutrisi ──────────────────────────────────────────
function NutritionCircle({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;
  const pct = Math.round(progress * 100);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Circle cx="40" cy="40" r={r} stroke="#EEEEEE" strokeWidth={6} fill="none" />
        <Circle cx="40" cy="40" r={r} stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{pct}%</Text>
      </View>
      <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{label}</Text>
    </View>
  );
}

export default function RecipesListScreen({ navigation }: any) {
  const { user } = useUser();
  const displayName = user?.nama ? user.nama.split(' ')[0] : 'User';

  // ── Profil diet diambil dari UserContext (bukan hardcoded) ─────────
  const profile: DietProfile = React.useMemo(() => {
    if (!user) return { jk: 'l', umur: 25, tb: 175, bb: 70, tujuan: 'tetap_bugar' as const };

    // Map jenis_kelamin dari profil user ke format yang dipakai ML server
    const jk = (user.jenis_kelamin || '').toLowerCase();
    const jkMapped = ['perempuan', 'p', 'female', 'f', 'wanita'].includes(jk) ? 'p' : 'l';

    // Map tingkat_aktivitas ke tujuan diet
    const tujuanMap: Record<string, DietProfile['tujuan']> = {
      'turun_berat': 'turun_berat',
      'tetap_bugar': 'tetap_bugar',
      'lebih_kuat': 'lebih_kuat',
      'massa_otot': 'massa_otot',
    };
    const tujuan = tujuanMap[user.tingkat_aktivitas] || 'tetap_bugar';

    return {
      jk: jkMapped,
      umur: user.usia || 25,
      tb: user.tinggi_badan || 175,
      bb: user.berat_badan || 70,
      tujuan,
    };
  }, [user]);

  // State menu dipisah per kategori: 12 menu unik per kategori
  // (6 tampil langsung + 6 tersimpan di cache/state untuk scroll)
  const [categoryMenus, setCategoryMenus] = useState<Record<string, MenuRecommendation[]>>({
    Breakfast: fallbackMeals.slice(0, 12),
    Lunch:     fallbackMeals.slice(12, 24),
    Dinner:    fallbackMeals.slice(24, 36),
  });

  const [activeCategory, setActiveCategory] = useState('Breakfast');
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuRecommendation | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  /**
   * Distribusi 36 menu unik ke 3 kategori, masing-masing 12 menu.
   * De-duplikasi ketat: satu menu hanya muncul di satu kategori.
   * Prioritas: AI recommendations masuk lebih dulu (skor_agen > 0).
   */
  const distributeMenus = (pool: MenuRecommendation[]) => {
    // 1. Hapus duplikat berdasarkan URL
    const seen = new Set<string>();
    const unique = pool.filter(m => {
      if (seen.has(m.url)) return false;
      seen.add(m.url);
      return true;
    });

    // 2. Pisahkan AI recommendations vs padding
    const aiRecs = unique.filter(m => (m.skor_agen ?? 0) > 0);
    const padding = unique.filter(m => (m.skor_agen ?? 0) === 0);

    // 3. Shuffle ringan agar urutan tidak monoton
    const shuffleArr = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const shuffledAI = shuffleArr(aiRecs);
    const shuffledPad = shuffleArr(padding);
    const ordered = [...shuffledAI, ...shuffledPad];

    // 4. Ambil 36 pertama, bagi rata 12-12-12
    // Jika kurang dari 36, isi sisanya dari fallback (tidak duplikat)
    const MENUS_PER_CAT = 12;
    const TOTAL = MENUS_PER_CAT * 3;
    let base = ordered.slice(0, TOTAL);

    if (base.length < TOTAL) {
      const baseUrls = new Set(base.map(m => m.url));
      const extras = fallbackMeals.filter(m => !baseUrls.has(m.url));
      base = [...base, ...extras].slice(0, TOTAL);
    }

    return {
      Breakfast: base.slice(0, MENUS_PER_CAT),
      Lunch:     base.slice(MENUS_PER_CAT, MENUS_PER_CAT * 2),
      Dinner:    base.slice(MENUS_PER_CAT * 2, MENUS_PER_CAT * 3),
    };
  };

  // ── Fetch dari server AI ──────────────────────────────────────────
  const fetchFromServer = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AI] Memeriksa health server...');
      const health = await checkServerHealth();
      setServerOnline(health.model_loaded);

      if (!health.model_loaded) return false;

      console.log('[AI] Meminta rekomendasi...');
      const result = await getRecommendations(profile);

      let validRecs: MenuRecommendation[] = [];
      if (result.recommendations && result.recommendations.length > 0) {
        validRecs = result.recommendations.filter(r => r.nama_menu && r.nama_menu.trim() !== '');
      }

      // Gabungkan hasil AI dengan fallback agar data cukup untuk 3 kategori (minimal 6 item)
      const pool = [...validRecs, ...fallbackMeals];
      const distributed = distributeMenus(pool);

      setCategoryMenus(distributed);
      setFromCache(false);

      // Simpan ke cache lokal
      await saveMenuCache(profile, distributed, result.target || null, true);
      console.log('[AI] Rekomendasi berhasil dimuat & di-cache ✅');
      return true;
    } catch (error: any) {
      console.log('[AI] Error:', error.message);
      setServerOnline(false);
      return false;
    }
  }, [profile]);

  // ── Load menu: cek cache dulu, baru fetch jika perlu ──────────────
  const loadMenus = useCallback(async (forceRefresh = false) => {
    try {
      // 1. Jika bukan force refresh, coba baca cache dulu
      if (!forceRefresh) {
        const cached = await loadMenuCache(profile);
        if (cached) {
          // Validasi: pastikan setiap kategori punya setidaknya 6 menu
          const isValid = ['Breakfast', 'Lunch', 'Dinner'].every(
            cat => (cached.menus[cat]?.length ?? 0) >= 6
          );
          if (isValid) {
            console.log('[AI] Menggunakan cache — tanpa request ke server 🚀');
            setCategoryMenus(cached.menus);
            setServerOnline(cached.fromServer);
            setFromCache(true);
            setLoading(false);
            setRefreshing(false);
            return;
          }
          console.log('[AI] Cache ada tapi kurang menu — fetch ulang.');
        }
      }

      // 2. Cache miss atau force refresh → fetch dari server
      console.log(forceRefresh ? '[AI] Force refresh — bypass cache' : '[AI] Cache miss — fetch dari server');
      const success = await fetchFromServer();

      // 3. Jika server gagal dan tidak ada cache, pakai fallback (36 menu)
      if (!success) {
        const fallbackDistributed = distributeMenus(fallbackMeals);
        setCategoryMenus(fallbackDistributed);
        setFromCache(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, fetchFromServer]);

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => { loadMenus(false); }, [loadMenus]);

  // Manual refresh selalu bypass cache → fetch ulang dari server
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMenus(true);
  }, [loadMenus]);

  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `Today, ${new Date().toLocaleDateString('en-GB', options)}`;
  };

  const getRecipeDetail = (url: string) =>
    (recipeDetailsData as any[]).find((r) => r.url === url) || null;

  const openDetail = (item: MenuRecommendation) => {
    setSelectedItem(item);
    setSelectedDetail(getRecipeDetail(item.url));
    setModalVisible(true);
  };

  // ── Render card ─────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: MenuRecommendation }) => {
    const detail = getRecipeDetail(item.url);
    const img = detail?.image_url
      || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=300&q=80';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openDetail(item)}>
        <TouchableOpacity style={styles.heartBtn}>
          <Feather name="heart" size={16} color="#FF5252" />
        </TouchableOpacity>
        <Image source={{ uri: img }} style={styles.cardImg} />
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nama_menu}</Text>
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="clock" size={10} color="#999" />
            <Text style={styles.cardMeta}> 25 min</Text>
          </View>
          <Text style={styles.cardKcal}>{Math.round(item.kalori)} Kcal</Text>
        </View>
        {item.skor_agen > 0 && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={{ color: '#888' }}>Memuat rekomendasi AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
             <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Image
              source={{ uri: user?.foto_profil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.subGreeting}>{displayName}'s {activeCategory}</Text>
              <Text style={styles.dateText}>{getTodayDate()}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Feather name="calendar" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Server Status */}
        {/* Cache indicator */}
        {fromCache && serverOnline && (
          <View style={styles.cacheBanner}>
            <Feather name="database" size={13} color="#1565C0" />
            <Text style={styles.cacheText}>Menu dari cache lokal. Pull down untuk refresh.</Text>
          </View>
        )}

        {!serverOnline && (
          <TouchableOpacity style={styles.offlineBanner} onPress={onRefresh}>
            <Feather name="cloud-off" size={13} color="#E65100" />
            <Text style={styles.offlineText}>AI offline — menampilkan data contoh. Tap untuk retry.</Text>
          </TouchableOpacity>
        )}

        {/* Title row dengan tombol Refresh tergabung */}
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.titleRefreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Text style={styles.titleText}>Recipes</Text>
            <View style={styles.refreshIconWrapper}>
              <Feather name="refresh-cw" size={14} color={PRIMARY_COLOR} />
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Feather name="search" size={20} color="#333" />
            <Feather name="sliders" size={20} color="#333" />
          </View>
        </View>

        {/* Category tabs */}
        <View style={styles.tabs}>
          {mealCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.tabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.tabTxt, activeCategory === cat && styles.tabTxtActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid menggunakan state categoryMenus berdasarkan tab yang aktif */}
        <FlatList
          data={categoryMenus[activeCategory]}
          renderItem={renderCard}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 120 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
          }
          ListEmptyComponent={
             <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: '#888' }}>Tidak ada menu untuk {activeCategory}.</Text>
             </View>
          }
        />
      </View>

      {/* ── DETAIL MODAL ───────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        {selectedItem && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

              {/* Green header with circular image */}
              <View style={styles.modalHeader}>
                <Image
                  source={{
                    uri: selectedDetail?.image_url
                      || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80'
                  }}
                  style={styles.modalCircleImg}
                />
                <TouchableOpacity style={styles.modalRefreshBtn} onPress={onRefresh}>
                  <Feather name="refresh-cw" size={16} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalMoreBtn}>
                  <Feather name="more-horizontal" size={16} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Close / Back */}
              <TouchableOpacity style={styles.modalBackBtn} onPress={() => setModalVisible(false)}>
                <Feather name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalFavBtn}>
                <Feather name="heart" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={styles.modalBody}>
                {/* Title */}
                <Text style={styles.modalTitle}>{selectedItem.nama_menu}</Text>

                {/* Stat row */}
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Feather name="clock" size={14} color="#999" />
                    <Text style={styles.statTxt}> 20</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text>🔥</Text>
                    <Text style={styles.statTxt}> {Math.round(selectedItem.kalori)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="bar-chart-outline" size={14} color="#999" />
                  </View>
                  <View style={styles.statItem}>
                    <Text>⭐</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.sectionHeading}>Description</Text>
                <Text style={styles.descText}>
                  {selectedDetail?.steps?.[0]
                    ? selectedDetail.steps[0].substring(0, 120) + '...'
                    : 'Resep sehat yang kaya nutrisi dan mudah dibuat di rumah.'}
                </Text>

                {/* Ingredients */}
                <Text style={styles.sectionHeading}>Ingredients</Text>
                {selectedDetail?.ingredients ? (
                  selectedDetail.ingredients.map((ing: string, idx: number) => (
                    <View key={idx} style={styles.ingRow}>
                      <View style={styles.ingLeft}>
                        <Text style={styles.ingEmoji}>{getIngredientEmoji(ing)}</Text>
                        <Text style={styles.ingName}>{ing.split(/\d/)[0].trim()}</Text>
                      </View>
                      <Text style={styles.ingGram}>
                        {ing.match(/\d+/)?.[0] ? `${ing.match(/\d+/)?.[0]} gr` : 'secukupnya'}
                      </Text>
                    </View>
                  ))
                ) : (
                  selectedItem.bahan?.split('|').map((b, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <View style={styles.ingLeft}>
                        <Text style={styles.ingEmoji}>{getIngredientEmoji(b)}</Text>
                        <Text style={styles.ingName}>{b.trim()}</Text>
                      </View>
                      <Text style={styles.ingGram}>secukupnya</Text>
                    </View>
                  ))
                )}

                {/* Nutrition Circles */}
                <View style={styles.nutritionCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={styles.sectionHeading}>Salad Mix</Text>
                    <TouchableOpacity>
                      <Text style={{ color: PRIMARY_COLOR, fontWeight: '600', fontSize: 13 }}>See Details</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#999', fontSize: 12, marginBottom: 16 }}>
                    1 Bowl ({Math.round(selectedItem.karbohidrat_g + selectedItem.protein_g + selectedItem.lemak_g)} gr)
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <NutritionCircle label="Carbohydrate" value={selectedItem.karbohidrat_g} max={selectedItem.kalori / 4} color="#9C27B0" />
                    <NutritionCircle label="Protein" value={selectedItem.protein_g} max={selectedItem.kalori / 4} color={PRIMARY_COLOR} />
                    <NutritionCircle label="Fat" value={selectedItem.lemak_g} max={selectedItem.kalori / 9} color="#FFC107" />
                  </View>
                </View>

                {/* How to make */}
                <Text style={[styles.sectionHeading, { marginTop: 24 }]}>How to make it</Text>
                {selectedDetail?.steps ? (
                  selectedDetail.steps.map((step: string, idx: number) => (
                    <View key={idx} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepTxt}>{step}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic' }}>Cara pembuatan tidak tersedia.</Text>
                )}

                <View style={{ height: 30 }} />
              </View>
            </ScrollView>

            {/* CTA Button */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.ctaTxt}>Add to diet plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  subGreeting: { fontSize: 12, color: '#888' },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF3E0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  offlineText: { fontSize: 11, color: '#E65100', flex: 1 },

  // Cache banner
  cacheBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E3F2FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  cacheText: { fontSize: 11, color: '#1565C0', flex: 1 },

  // Title
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  titleRefreshBtn: { flexDirection: 'row', alignItems: 'center' },
  titleText: { fontSize: 24, fontWeight: 'bold', color: PRIMARY_COLOR },
  refreshIconWrapper: { 
    marginLeft: 8, padding: 6, backgroundColor: '#E8F5E9', borderRadius: 20 
  },

  // Tabs
  tabs: { flexDirection: 'row', marginBottom: 20 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  tabActive: { backgroundColor: PRIMARY_COLOR },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTxtActive: { color: '#fff' },

  // Cards
  card: {
    width: (width - 52) / 2, backgroundColor: '#fff',
    borderRadius: 16, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  heartBtn: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  cardImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cardMeta: { fontSize: 10, color: '#999' },
  cardKcal: { fontSize: 10, color: '#333', fontWeight: '600' },
  aiBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: PRIMARY_COLOR, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  aiBadgeText: { fontSize: 8, color: '#fff', fontWeight: 'bold' },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalHeader: {
    backgroundColor: PRIMARY_COLOR, height: 220,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10,
  },
  modalCircleImg: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 4, borderColor: '#fff',
    position: 'absolute', bottom: -50,
  },
  modalRefreshBtn: {
    position: 'absolute', top: 20, right: 50,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  modalMoreBtn: {
    position: 'absolute', top: 20, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  modalBackBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 20, left: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalFavBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 20, right: 100,
    padding: 8,
  },
  modalBody: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 100 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 14 },

  statRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statTxt: { fontSize: 13, color: '#555' },

  sectionHeading: { fontSize: 17, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  descText: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },

  ingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  ingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ingEmoji: { fontSize: 22, marginRight: 12, width: 36, textAlign: 'center' },
  ingName: { fontSize: 14, color: '#333', flex: 1 },
  ingGram: { fontSize: 13, color: '#888' },

  nutritionCard: {
    marginTop: 24, backgroundColor: '#FAFAFA',
    borderRadius: 16, padding: 20,
  },

  stepRow: { flexDirection: 'row', marginBottom: 16 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
  },
  stepTxt: { fontSize: 14, color: '#444', flex: 1, lineHeight: 22 },

  // CTA
  ctaContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  ctaBtn: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
