import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface CreateRecipeButtonProps {
  onPress: () => void;
}

export default function CreateRecipeButton({ onPress }: CreateRecipeButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconContainer, { backgroundColor: '#EF4444', borderColor: colors.iconBorder }]}>
        <Plus size={14} color="black" />
      </View>
      <Text style={[styles.text, { color: colors.background }]}>Create Recipe</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});