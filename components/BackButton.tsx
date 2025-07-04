import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

interface BackButtonProps {
  onPress?: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity style={[styles.backButton, { borderColor: colors.iconBorder }]} onPress={handlePress} activeOpacity={0.8}>
      <ArrowLeft size={20} color="black" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#8B5CF6", // Purple color
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});