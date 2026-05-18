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
} from '../../../services/api';
import { useUser } from "../../../context/UserContext";
import recipeDetailsData from '../../../data/cookpad_diet_results.json';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#00C853';
const BG_COLOR = '#FFFFFF';
const mealCategories = ['Breakfast', 'Lunch', 'Dinner'];

// ── Fallback data (tampil saat server AI tidak merespons) ─────────────────────
const fallbackMeals: MenuRecommendation[] = [
  {
    nama_menu: 'Salmon Panggang & Brokoli',
    url: 'https://cookpad.com/id/resep/24642279',
    kalori: 230, protein_g: 28, karbohidrat_g: 12, lemak_g: 8,
    serat_g: 3, bahan: 'Ikan salmon|Brokoli|Paprika|Nasi', skor_agen: 0.9, dipilih_kali: 5,
  },
  {
    nama_menu: 'Wrap Telur & Sayuran',
    url: 'https://cookpad.com/id/resep/23933390',
    kalori: 310, protein_g: 22, karbohidrat_g: 28, lemak_g: 12,
    serat_g: 4, bahan: 'Telur|Selada|Timun|Tomat|Kulit lumpia', skor_agen: 0.85, dipilih_kali: 4,
  },
  {
    nama_menu: 'Salad Ayam Jagung',
    url: 'https://cookpad.com/id/resep/17132060',
    kalori: 309, protein_g: 27, karbohidrat_g: 35, lemak_g: 7,
    serat_g: 5, bahan: 'Ayam|Jagung manis|Tomat ceri|Lettuce|Timun', skor_agen: 0.8, dipilih_kali: 3,
  },
  {
    nama_menu: 'Salmon Don & Tahu',
    url: 'https://cookpad.com/id/resep/17039707',
    kalori: 375, protein_g: 38, karbohidrat_g: 28, lemak_g: 12,
    serat_g: 3, bahan: 'Salmon|Tahu|Nasi|Soy sauce|Wasabi', skor_agen: 0.75, dipilih_kali: 2,
  },
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

  const [profile] = useState<DietProfile>({
    jk: 'l', umur: 25, tb: 175, bb: 70, tujuan: 'tetap_bugar',
  });

  // State menu dipisah per kategori, defaultnya fallback yang disebar
  const [categoryMenus, setCategoryMenus] = useState<Record<string, MenuRecommendation[]>>({
    Breakfast: fallbackMeals.slice(0, 2),
    Lunch: fallbackMeals.slice(2, 4),
    Dinner: fallbackMeals.slice(0, 2).reverse(),
  });

  const [activeCategory, setActiveCategory] = useState('Breakfast');
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuRecommendation | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      console.log('[AI] Memeriksa health server...');
      const health = await checkServerHealth();
      setServerOnline(health.model_loaded);

      if (!health.model_loaded) return;

      console.log('[AI] Meminta rekomendasi...');
      const result = await getRecommendations(profile);
      
      let validRecs: MenuRecommendation[] = [];
      if (result.recommendations && result.recommendations.length > 0) {
        validRecs = result.recommendations.filter(r => r.nama_menu && r.nama_menu.trim() !== '');
      }

      // Gabungkan hasil AI dengan fallback agar data cukup untuk 3 kategori (minimal 6 item)
      const pool = [...validRecs, ...fallbackMeals];
      
      // Acak urutan agar setiap tab dapat menu berbeda setiap di-refresh
      const shuffled = pool.sort(() => 0.5 - Math.random());

      // Sebarkan ke Breakfast, Lunch, Dinner (masing-masing 2)
      // Data ini akan MENETAP di state meskipun tab diubah, dan hanya berubah jika tombol refresh ditekan
      setCategoryMenus({
        Breakfast: shuffled.slice(0, 2),
        Lunch: shuffled.slice(2, 4),
        Dinner: shuffled.slice(4, 6),
      });

    } catch (error: any) {
      console.log('[AI] Error:', error.message);
      setServerOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations();
  }, [fetchRecommendations]);

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
