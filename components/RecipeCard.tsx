import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ViewStyle } from "react-native";
import { Recipe } from "@/types";
import { Heart, Play, Bookmark } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onFavoritePress?: () => void;
  style?: ViewStyle;
}

export default function RecipeCard({ recipe, onPress, onFavoritePress, style }: RecipeCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: 'transparent',
      borderColor: colors.iconBorder,
    }, style]}>
      {/* Recipe Header */}
      <View style={styles.header}>
        <Image source={{ uri: recipe.image }} style={[styles.recipeImage, { borderColor: colors.iconBorder }]} />
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>
          <View style={styles.authorContainer}>
            <Image source={{ uri: recipe.author.avatar }} style={[styles.authorAvatar, { borderColor: colors.iconBorder }]} />
            <Text style={[styles.authorName, { color: colors.muted }]}>{recipe.author.name}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
                <Heart size={12} color="black" />
              </View>
              <Text style={[styles.statText, { color: colors.muted }]}>{recipe.likes} Like</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statText, { color: colors.muted }]}>{recipe.comments} Comments</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.iconBorder }]}
          onPress={onPress}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
            <Play size={14} color="black" />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Start Chef</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.iconBorder }]}
          onPress={onFavoritePress}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: recipe.isFavorite ? '#EF4444' : '#FACC15', borderColor: colors.iconBorder }]}>
            <Heart size={14} color="black" fill={recipe.isFavorite ? "black" : 'transparent'} />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Save Chef</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    marginRight: 16,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  actionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});