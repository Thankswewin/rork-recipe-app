import React from "react";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipes } from "@/constants/mockData";
import RecipeCard from "@/components/RecipeCard";
import BackButton from "@/components/BackButton";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function FavoritesScreen() {
  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);
  const { colors } = useTheme();

  const handleRecipePress = (recipeId: string) => {
    // Navigate to recipe details
    console.log(`Recipe ${recipeId} pressed`);
  };

  const handleFavoritePress = (recipeId: string) => {
    // Toggle favorite status
    console.log(`Toggle favorite for recipe ${recipeId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>Favorite Recipes</Text>
        <View style={styles.placeholder} />
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
            <Text style={[styles.emptyText, { color: colors.text }]}>
              You haven't saved any recipes yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Tap the heart icon on recipes you love to save them here.
            </Text>
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
  placeholder: {
    width: 40, // Same width as BackButton to center the title
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
  },
});