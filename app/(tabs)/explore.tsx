import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipes, categories } from "@/constants/mockData";
import SearchBar from "@/components/SearchBar";
import BackButton from "@/components/BackButton";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Bell, Play, Heart, MessageCircle, Bookmark } from "lucide-react-native";

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Breakfast");
  const { colors, isDark } = useTheme();

  const filteredRecipes = recipes.filter((recipe) => {
    return selectedCategory ? recipe.category === selectedCategory : true;
  });

  const handleRecipePress = (recipeId: string) => {
    console.log(`Recipe ${recipeId} pressed`);
  };

  const handlePlayVideo = (recipeId: string) => {
    console.log(`Start chef for recipe ${recipeId}`);
  };

  const handleSaveVideo = (recipeId: string) => {
    console.log(`Save chef for recipe ${recipeId}`);
  };

  const renderRecipeItem = ({ item }: { item: any }) => (
    <View style={[styles.recipeCard, { 
      backgroundColor: 'transparent',
      borderColor: colors.iconBorder,
    }]}>
      <View style={styles.recipeHeader}>
        <Image source={{ uri: item.image }} style={[styles.recipeImage, { borderColor: colors.iconBorder }]} />
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeTitle, { color: colors.text }]}>{item.title}</Text>
          <View style={styles.authorContainer}>
            <Image source={{ uri: item.author.avatar }} style={[styles.authorAvatar, { borderColor: colors.iconBorder }]} />
            <Text style={[styles.authorName, { color: colors.muted }]}>{item.author.name}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
                <Heart size={12} color="black" />
              </View>
              <Text style={[styles.statText, { color: colors.muted }]}>{item.likes} Like</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
                <MessageCircle size={12} color="black" />
              </View>
              <Text style={[styles.statText, { color: colors.muted }]}>{item.comments} Comments</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.iconBorder }]}
          onPress={() => handlePlayVideo(item.id)}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
            <Play size={14} color="black" />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Start Chef</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.iconBorder }]}
          onPress={() => handleSaveVideo(item.id)}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
            <Bookmark size={14} color="black" />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Save Chef</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        
        <View style={styles.categorySelector}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{selectedCategory} Category</Text>
          <TouchableOpacity>
            <Text style={styles.dropdownIcon}>⌄</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.notificationButtonContainer}>
          <View style={[styles.notificationButton, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
            <Bell size={16} color="black" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No recipes found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categorySelector: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#666',
  },
  notificationButtonContainer: {
    borderRadius: 12,
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  recipeCard: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 2,
  },
  recipeHeader: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});