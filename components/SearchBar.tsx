import React from "react";
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
}

export default function SearchBar({ 
  placeholder = "Search recipes...", 
  value, 
  onChangeText,
  onSubmit
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }]}>
      <View style={[styles.iconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
        <Search size={16} color="black" />
      </View>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
});