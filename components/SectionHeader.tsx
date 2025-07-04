import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface SectionHeaderProps {
  title: string;
  onSeeAllPress?: () => void;
}

export default function SectionHeader({ title, onSeeAllPress }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {onSeeAllPress && (
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
});