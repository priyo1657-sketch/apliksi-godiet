import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { calculateNutrition, UserProfile, NutritionTargets } from '../src/utils/nutrition';

const PRIMARY_COLOR = '#4CAF50';
const BG_COLOR = '#F9F9F9';

// Dummy Data for Meal Categories & List
const mealCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const mealData = [
  {
    id: '1',
    title: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    calories: '250 kcal',
    time: '10 min',
  },
  {
    id: '2',
    title: 'Chicken Salad',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    calories: '350 kcal',
    time: '15 min',
  },
  {
    id: '3',
    title: 'Berry Smoothie',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da960b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    calories: '180 kcal',
    time: '5 min',
  }
];

export default function HomeScreen() {
  const [profile] = useState<UserProfile>({
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    age: 25,
    activityLevel: 'moderate',
  });
  
  const [caloriesEaten] = useState(800);
  const [nutrition, setNutrition] = useState<NutritionTargets | null>(null);
  const [activeCategory, setActiveCategory] = useState('Breakfast');

  useEffect(() => {
    const targets = calculateNutrition(profile);
    setNutrition(targets);
  }, [profile]);

  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  if (!nutrition) return null;

  const caloriesRemaining = nutrition.tdee - caloriesEaten;
  
  // Circular Progress Calculation
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (caloriesEaten / nutrition.tdee) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const renderMealItem = ({ item }: { item: typeof mealData[0] }) => (
    <View style={styles.cardContainer}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.chipContainer}>
          <View style={styles.chip}>
            <Ionicons name="flame-outline" size={14} color={PRIMARY_COLOR} />
            <Text style={styles.chipText}>{item.calories}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.chipText}>{item.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, John Doe</Text>
            <Text style={styles.dateText}>{getTodayDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' }} 
              style={styles.profilePic} 
            />
          </View>
        </View>

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
              <Text style={styles.remainingValue}>{Math.max(0, caloriesRemaining)}</Text>
              <Text style={styles.remainingLabel}>Kcal Left</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#FF9800' }]} />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{nutrition.protein}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#F44336' }]} />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{nutrition.fats}g</Text>
              <View style={[styles.macroBar, { backgroundColor: '#2196F3' }]} />
            </View>
          </View>
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

        {/* Meal List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recommended {activeCategory}</Text>
          <FlatList
            data={mealData}
            renderItem={renderMealItem}
            keyExtractor={item => item.id}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  }
});