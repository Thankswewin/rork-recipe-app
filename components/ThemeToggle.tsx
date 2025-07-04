import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={toggleTheme}>
      <View style={[styles.iconButton, { 
        backgroundColor: isDark ? '#FACC15' : '#1F2937',
        borderColor: colors.iconBorder 
      }]}>
        {isDark ? (
          <Sun size={20} color="black" />
        ) : (
          <Moon size={20} color="black" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});