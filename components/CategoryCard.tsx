import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Category } from "@/types";
import { useTheme } from "@/hooks/useTheme";

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
  isSelected?: boolean;
}

export default function CategoryCard({ category, onPress, isSelected = false }: CategoryCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: isSelected ? colors.tint : colors.cardBackground,
          borderColor: isSelected ? colors.tint : colors.border,
          borderWidth: isSelected ? 2 : 1
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <Text style={styles.icon}>{category.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: isSelected ? 'white' : colors.text }]}>{category.name}</Text>
        <Text style={[styles.description, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.muted }]} numberOfLines={1}>{category.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
});