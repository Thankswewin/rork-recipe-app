import React, { useState } from 'react';
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
import { RecipeCard } from '../../components/RecipeCard';
import { SearchBar } from '../../components/SearchBar';
import { colors } from '../../constants/colors';
import { mockRecipes } from '../../constants/mockData';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  isFavorite: boolean;
}

export default function FavoritesScreen() {
  const { colors: theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Recipe[]>(
    mockRecipes.filter(recipe => recipe.isFavorite)
  );

  const filteredFavorites = favorites.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => 
      prev.filter(recipe => recipe.id !== recipeId)
    );
  };

  const renderFavoriteItem = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onPress={() => {/* Navigate to recipe detail */}}
      onFavoritePress={() => toggleFavorite(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Heart size={64} color={colors.gray[400]} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Favorites Yet
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Start exploring recipes and add them to your favorites!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Favorites</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {favorites.length} saved recipes
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search favorites..."
        style={styles.searchBar}
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