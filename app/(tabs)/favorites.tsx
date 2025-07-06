import React from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipes } from "@/constants/mockData";
import RecipeCard from "@/components/RecipeCard";
import { Stack, router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Heart, Search } from "lucide-react-native";

export default function FavoritesScreen() {
  const favoriteRecipes = recipes.filter((recipe) => recipe.is_favorited);
  const { colors } = useTheme();

  const handleRecipePress = (recipeId: string) => {
    router.push("/(tabs)/assistant");
  };

  const handleFavoritePress = (recipeId: string) => {
    // In a real app, this would toggle the favorite status in a database
    console.log(`Toggle favorite for recipe ${recipeId}`);
  };

  const handleSearchRecipes = () => {
    router.push("/(tabs)/search");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Heart size={24} color={colors.tint} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Favorite Recipes</Text>
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={handleSearchRecipes}
        >
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={favoriteRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => handleRecipePress(item.id)}
            onFavoritePress={() => handleFavoritePress(item.id)}
            style={styles.favoriteCard}
          />
        )}
        contentContainerStyle={styles.recipeList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No Favorite Recipes Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Discover amazing recipes and save your favorites here
            </Text>
            <TouchableOpacity
              style={[styles.discoverButton, { backgroundColor: colors.tint }]}
              onPress={handleSearchRecipes}
            >
              <Search size={16} color="white" />
              <Text style={styles.discoverButtonText}>Discover Recipes</Text>
            </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: 'center',
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  recipeList: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  favoriteCard: {
    width: '100%',
    marginRight: 0,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});