import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import {
  getRecommendations,
  checkServerHealth,
  MenuRecommendation,
  NutritionTarget,
  DietProfile,
} from '../src/services/api';

const PRIMARY_COLOR = '#4CAF50';
const BG_COLOR = '#F9F9F9';

// Meal category tabs
const mealCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

// ── Fallback data (dipakai kalau server belum aktif) ────────────────
const fallbackMeals: MenuRecommendation[] = [
  {
    nama_menu: 'Avocado Toast',
    url: '',
    kalori: 250,
    protein_g: 8,
    karbohidrat_g: 28,
    lemak_g: 14,
    serat_g: 6,
    bahan: 'Roti gandum|Alpukat|Telur|Garam|Lada',
    skor_agen: 0,
    dipilih_kali: 0,
  },
  {
    nama_menu: 'Chicken Salad',
    url: '',
    kalori: 350,
    protein_g: 32,
    karbohidrat_g: 12,
    lemak_g: 18,
    serat_g: 4,
    bahan: 'Dada ayam|Selada|Tomat|Ketimun|Olive oil',
    skor_agen: 0,
    dipilih_kali: 0,
  },
  {
    nama_menu: 'Berry Smoothie',
    url: '',
    kalori: 180,
    protein_g: 6,
    karbohidrat_g: 32,
    lemak_g: 3,
    serat_g: 5,
    bahan: 'Blueberry|Strawberry|Yogurt|Madu',
    skor_agen: 0,
    dipilih_kali: 0,
  },
];

export default function HomeScreen() {
  // ── User Profile (nanti bisa diambil dari CreateProfileScreen) ────
  const [profile] = useState<DietProfile>({
    jk: 'l',
    umur: 25,
    tb: 175,
    bb: 70,
    tujuan: 'tetap_bugar',
  });

  // ── State ─────────────────────────────────────────────────────────
  const [recommendations, setRecommendations] = useState<MenuRecommendation[]>(fallbackMeals);
  const [target, setTarget] = useState<NutritionTarget | null>(null);
  const [caloriesEaten] = useState(800);
  const [activeCategory, setActiveCategory] = useState('Breakfast');
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch rekomendasi dari ML Server ──────────────────────────────
  const fetchRecommendations = useCallback(async () => {
    try {
      // Cek server dulu
      const health = await checkServerHealth();
      setServerOnline(health.model_loaded);

      if (!health.model_loaded) {
        console.log('[INFO] Model belum dimuat, pakai fallback data');
        return;
      }

      // Ambil rekomendasi dari AI
      const result = await getRecommendations(profile);
      setRecommendations(result.recommendations);
      setTarget(result.target);
      console.log(`[AI] ${result.recommendations.length} rekomendasi diterima`);
    } catch (error) {
      console.log('[INFO] Server offline, pakai fallback data');
      setServerOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations();
  }, [fetchRecommendations]);

  // ── Fallback target kalau server offline ──────────────────────────
  const displayTarget: NutritionTarget = target || {
    kalori: 2400,
    protein_g: 98,
    karbohidrat_g: 300,
    lemak_g: 67,
  };

  // ── Derived values ────────────────────────────────────────────────
  const caloriesRemaining = Math.max(0, Math.round(displayTarget.kalori) - caloriesEaten);
  const tdee = Math.round(displayTarget.kalori);

  // Circular Progress
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((caloriesEaten / tdee) * 100, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // ── Date ──────────────────────────────────────────────────────────
  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // ── Format bahan menjadi list pendek ──────────────────────────────
  const formatBahan = (bahan: string) => {
    if (!bahan) return [];
    return bahan.split('|').filter(b => b.trim()).slice(0, 3);
  };

  // ── Render meal card (sekarang dari AI) ───────────────────────────
  const renderMealItem = ({ item }: { item: MenuRecommendation }) => (
    <View style={styles.cardContainer}>
      {/* Placeholder image with icon */}
      <View style={styles.cardImagePlaceholder}>
        <Ionicons name="restaurant-outline" size={32} color={PRIMARY_COLOR} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nama_menu}</Text>
        <View style={styles.chipContainer}>
          <View style={styles.chip}>
            <Ionicons name="flame-outline" size={14} color={PRIMARY_COLOR} />
            <Text style={styles.chipText}>{item.kalori} kcal</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="barbell-outline" size={14} color="#F44336" />
            <Text style={styles.chipText}>{item.protein_g}g prot</Text>
          </View>
        </View>
        {/* Bahan preview */}
        {item.bahan ? (
          <Text style={styles.bahanPreview} numberOfLines={1}>
            {formatBahan(item.bahan).join(', ')}
          </Text>
        ) : null}
        {/* AI Score badge */}
        {item.skor_agen > 0 && (
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={10} color="#fff" />
            <Text style={styles.aiBadgeText}>AI Pick</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Memuat rekomendasi AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, John Doe</Text>
            <Text style={styles.dateText}>{getTodayDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Server status indicator */}
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? PRIMARY_COLOR : '#FF9800' }]} />
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' }}
              style={styles.profilePic}
            />
          </View>
        </View>

        {/* Server Status Banner */}
        {!serverOnline && (
          <TouchableOpacity style={styles.offlineBanner} onPress={onRefresh}>
            <Ionicons name="cloud-offline-outline" size={16} color="#FF9800" />
            <Text style={styles.offlineBannerText}>
              Server AI offline — menampilkan data fallback. Tap untuk retry.
            </Text>
          </TouchableOpacity>
        )}

        {/* Nutrition Overview */}
        <View style={styles.summaryContainer}>
          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <Svg width="160" height="160" viewBox="0 0 160 160">
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#E0E0E0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke={PRIMARY_COLOR}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.remainingValue}>{caloriesRemaining}</Text>
              <Text style={styles.remainingLabel}>Kcal Left</Text>
            </View>
          </View>

          {/* Macros — now from AI target */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{Math.round(displayTarget.karbohidrat_g)}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#FF9800' }]} />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{Math.round(displayTarget.protein_g)}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#F44336' }]} />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{Math.round(displayTarget.lemak_g)}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#2196F3' }]} />
            </View>
          </View>
        </View>

        {/* Goal info */}
        <View style={styles.goalContainer}>
          <Ionicons name="flag-outline" size={16} color={PRIMARY_COLOR} />
          <Text style={styles.goalText}>
            Tujuan: {profile.tujuan.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </Text>
          <Text style={styles.goalTarget}>Target: {tdee} kcal/hari</Text>
        </View>

        {/* Meal Categories */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {mealCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.tabItem, activeCategory === category && styles.activeTabItem]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meal List — from AI recommendations */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {serverOnline ? '🤖 AI Recommendations' : `Recommended ${activeCategory}`}
            </Text>
            {serverOnline && (
              <TouchableOpacity onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={recommendations}
            renderItem={renderMealItem}
            keyExtractor={(item, index) => `${item.nama_menu}-${index}`}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  notificationBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#E65100',
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  remainingLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  macrosContainer: {
    justifyContent: 'center',
    marginLeft: 20,
    flex: 1,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    color: '#888',
    width: 60,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  macroBar: {
    height: 6,
    borderRadius: 3,
    flex: 1,
    marginLeft: 10,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  goalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  goalTarget: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  tabsContainer: {
    marginTop: 24,
  },
  tabsScroll: {
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#EAEAEA',
  },
  activeTabItem: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
    fontWeight: '500',
  },
  bahanPreview: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  aiBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
});