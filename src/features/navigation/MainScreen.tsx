import React, { useState } from "react";
import { View } from "react-native";
import { ActivityTabScreen } from "../activity/screens/ActivityTabScreen";
import { CaloriesTabScreen } from "../calories/screens/CaloriesTabScreen";
import { HomeTabScreen } from "../home/screens/HomeTabScreen";
import { ProfileTabScreen } from "../profile/screens/ProfileTabScreen";
import { ScannerTabScreen } from "../scanner/screens/ScannerTabScreen";
import { BottomTabNavigator, TabName } from "./BottomTabNavigator";

export const MainScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>("Home");

  const renderScreen = () => {
    switch (activeTab) {
      case "Home":
        return <HomeTabScreen onNavigateToTab={setActiveTab} />;
      case "Calories":
        return <CaloriesTabScreen />;
      case "Scanner":
        return <ScannerTabScreen onGoBack={() => setActiveTab("Home")} />;
      case "Activity":
        return <ActivityTabScreen />;
      case "Profile":
        return <ProfileTabScreen />;
      default:
        return <HomeTabScreen onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      <BottomTabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};
