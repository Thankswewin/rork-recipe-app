import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Search, Filter } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import RecipeCard from '../../components/RecipeCard';
import SearchBar from '../../components/SearchBar';
import { Recipe } from '../../types';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:created_by(username, full_name, avatar_url),
          recipe_favorites!inner(user_id)
        `)
        .eq('recipe_favorites.user_id', user?.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      const recipesWithAuthor = data?.map(recipe => ({
        ...recipe,
        author: recipe.profiles,
        is_favorited: true
      })) || [];

      setFavorites(recipesWithAuthor);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error removing favorite:', error);
        return;
      }

      setFavorites(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderFavoriteItem = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onPress={() => {/* Navigate to recipe detail */}}
      onFavoritePress={() => toggleFavorite(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
      <Heart size={64} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Favorites Yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.muted }]}>
        Start exploring recipes and add them to your favorites!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {favorites.length} saved recipes
        </Text>
      </View>

      <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search favorites..."
        />

      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        numColumns={2}
        columnWrapperStyle={filteredFavorites.length > 0 ? styles.row : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});