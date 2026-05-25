import React from "react";
import { Image, ImageStyle, StyleSheet } from "react-native";

interface LogoProps {
  size?: "small" | "medium" | "large";
  style?: ImageStyle;
}

const logoImage = require("../assets/image.png");

const styles = StyleSheet.create({
  logo: {
    resizeMode: "contain",
  },
});

export function Logo({ size = "large", style }: LogoProps) {
  const sizeMap = {
    small: { width: 100, height: 50 },
    medium: { width: 150, height: 75 },
    large: { width: 200, height: 100 },
  };

  return (
    <Image source={logoImage} style={[styles.logo, sizeMap[size], style]} />
  );
}
