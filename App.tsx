import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StatusBar } from "react-native";
import { UserProvider } from "./src/context/UserContext";

import ActivityLevelScreen from "./src/features/login/ActivityLevelScreen";
import CreateProfileScreen from "./src/features/login/CreateProfileScreen";
import GoalSelectionScreen from "./src/features/login/GoalSelectionScreen";
import LoginScreen from "./src/features/login/LoginScreen";
import MoodSelectionScreen from "./src/features/login/MoodSelectionScreen";
import SignUpScreen from "./src/features/login/SignUpScreen";
import TrainingPlanScreen from "./src/features/login/TrainingPlanScreen";
import { MainScreen } from "./src/features/navigation/MainScreen";
import NotificationSettingsScreen from "./src/features/navigation/NotificationSettingsScreen";
import OnboardingScreen from "./src/features/splash/OnboardingScreen";
import SplashScreen from "./src/features/splash/SplashScreen";

// Calories feature imports
import { CaloriesTabScreen } from "./src/features/calories/screens/CaloriesTabScreen";
import FilterModalScreen from "./src/features/calories/screens/FilterModalScreen";
import RecipeDetailScreen from "./src/features/calories/screens/RecipeDetailScreen";
import RecipesListScreen from "./src/features/calories/screens/RecipesListScreen";

// Activity feature imports
import { ActivityTabScreen } from "./src/features/activity/screens/ActivityTabScreen";
import ExerciseScreen from "./src/features/activity/screens/ExerciseScreen";
import GetReadyScreen from "./src/features/activity/screens/GetReadyScreen";
import WorkoutDetailScreen from "./src/features/activity/screens/WorkoutDetailScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  Login: undefined;
  CreateProfile: undefined;
  GoalSelection: undefined;
  ActivityLevel: undefined;
  TrainingPlan: undefined;
  MoodSelection: undefined;
  Home: undefined;
  Activity: undefined;
  WorkoutDetail: undefined;
  NotificationSettings: undefined;
  Scanner: undefined;
  // Calories feature routes
  Calories: undefined;
  RecipesList: undefined;
  RecipeDetail: { id?: string };
  FilterModal: undefined;
  StepDetails: undefined;
  GetReady: undefined;
  Exercise: undefined;
  RecipeAdded: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <UserProvider>
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#2DB34A" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
        <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
        <Stack.Screen name="TrainingPlan" component={TrainingPlanScreen} />
        <Stack.Screen name="MoodSelection" component={MoodSelectionScreen} />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
        />

        {/* Main App */}
        <Stack.Screen name="Home" component={MainScreen} />

        {/* Calories Feature Screens */}
        <Stack.Screen name="Calories" component={CaloriesTabScreen} />
        <Stack.Screen name="RecipesList" component={RecipesListScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="FilterModal" component={FilterModalScreen} />

        {/* Activity Feature Screens */}
        <Stack.Screen name="Activity" component={ActivityTabScreen} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
        <Stack.Screen name="GetReady" component={GetReadyScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </UserProvider>
  );
}
