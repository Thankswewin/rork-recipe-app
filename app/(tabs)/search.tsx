import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, User, UserPlus, UserCheck, BookOpen, Filter, TrendingUp } from "lucide-react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Category } from "@/types";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import RecipeCard from "@/components/RecipeCard";
import UserProfileCard from "@/components/UserProfileCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  spacing,
  typography,
  borderRadius,
  colorPalette,
  shadows,
} from "@/constants/designSystem";

// Mock data removed for production readiness

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  recipe_count?: number;
  is_following?: boolean;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'recipes' | 'users'>('recipes');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchRecipes(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      setRecipesLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:created_by(username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recipes:', error);
        return;
      }

      const recipesWithAuthor = data?.map(recipe => ({
        ...recipe,
        author: recipe.profiles
      })) || [];

      setRecipes(recipesWithAuthor);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setRecipesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const uniqueCategoryNames = [...new Set(data?.map(item => item.category).filter(Boolean))] as string[];
      
      // Transform string categories into Category objects
      const categoryObjects = uniqueCategoryNames.map((name, index) => ({
        id: `category-${index}`,
        name,
        icon: getCategoryIcon(name),
        color: getCategoryColor(name),
        recipe_count: data?.filter(item => item.category === name).length || 0,
        description: `${name} recipes`
      }));
      
      setCategories(categoryObjects);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'breakfast': '🥞',
      'lunch': '🥗',
      'dinner': '🍽️',
      'dessert': '🍰',
      'snack': '🍿',
      'appetizer': '🥨',
      'beverage': '🥤',
      'soup': '🍲',
      'salad': '🥗',
      'pasta': '🍝',
      'pizza': '🍕',
      'seafood': '🐟',
      'meat': '🥩',
      'vegetarian': '🥬',
      'vegan': '🌱',
      'healthy': '💚',
      'comfort': '🏠'
    };
    return icons[category.toLowerCase()] || '🍳';
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'breakfast': '#FFB84D',
      'lunch': '#4ECDC4',
      'dinner': '#FF6B6B',
      'dessert': '#FF8CC8',
      'snack': '#95E1D3',
      'appetizer': '#F38BA8',
      'beverage': '#A8DADC',
      'soup': '#F1C0E8',
      'salad': '#CFBAF0',
      'pasta': '#FFD93D',
      'pizza': '#FF6B35',
      'seafood': '#6BCF7F',
      'meat': '#FF4757',
      'vegetarian': '#26de81',
      'vegan': '#2ed573',
      'healthy': '#1dd1a1',
      'comfort': '#ffa502'
    };
    return colors[category.toLowerCase()] || '#74b9ff';
  };

  const searchRecipes = async (query: string) => {
    if (!query.trim()) {
      fetchRecipes();
      return;
    }

    try {
      setRecipesLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:created_by(username, full_name, avatar_url)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching recipes:', error);
        return;
      }

      const recipesWithAuthor = data?.map(recipe => ({
        ...recipe,
        author: recipe.profiles
      })) || [];

      setRecipes(recipesWithAuthor);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setRecipesLoading(false);
    }
  };

  // Refresh user search when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (searchType === 'users' && searchQuery.trim()) {
        searchUsers(searchQuery);
      }
    }, [searchType, searchQuery, refreshKey])
  );

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          bio
        `)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUser?.id || '')
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      // Check if current user is following these users
      if (data && currentUser) {
        const userIds = data.map(u => u.id);
        const { data: followData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUser.id)
          .in('following_id', userIds);

        const followingIds = new Set(followData?.map(f => f.following_id) || []);

        const usersWithFollowStatus = data.map(user => ({
          ...user,
          recipe_count: 0, // We'll implement recipe count later
          is_following: followingIds.has(user.id),
        }));

        setUsers(usersWithFollowStatus);
      } else {
        setUsers(data?.map(user => ({ ...user, recipe_count: 0, is_following: false })) || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === 'users') {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (searchType === 'recipes') {
      const timeoutId = setTimeout(() => {
        searchRecipes(searchQuery);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchType]);

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean): Promise<void> => {
    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    // Check if trying to follow self
    if (currentUser.id === userId) {
      console.error('Cannot follow yourself');
      return;
    }

    console.log('Follow toggle:', { userId, isCurrentlyFollowing, currentUserId: currentUser.id });

    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error, data } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .select();

        if (error) {
          console.error('Error unfollowing user:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return;
        }
        console.log('Unfollow successful:', data);
      } else {
        // Follow
        const { error, data } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
          })
          .select();

        if (error) {
          console.error('Error following user:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return;
        }
        console.log('Follow successful:', data);
      }

      // Update local state immediately for better UX
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_following: !isCurrentlyFollowing }
          : user
      ));

      // Trigger a refresh for other screens
      setRefreshKey(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Error toggling follow:', {
        message: error.message || 'Unknown error',
        error: error
      });
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleRecipePress = (recipeId: string) => {
    router.push("/(tabs)/assistant");
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <UserProfileCard
      user={item}
      onFollowToggle={handleFollowToggle}
      showFollowButton={true}
    />
  );

  const filteredRecipes = selectedCategory 
    ? recipes.filter(recipe => recipe.category === selectedCategory)
    : recipes;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Search</Text>
          <Button
            variant="purple"
            size="icon"
            icon={Filter}
            iconSize={20}
          />
        </View>
        
        <View style={styles.searchTypeToggle}>
          <Button
            variant={searchType === 'recipes' ? 'purple' : 'outline'}
            size="sm"
            icon={BookOpen}
            iconSize={16}
            title="Recipes"
            onPress={() => setSearchType('recipes')}
            style={styles.searchTypeButton}
          />
          
          <Button
            variant={searchType === 'users' ? 'purple' : 'outline'}
            size="sm"
            icon={User}
            iconSize={16}
            title="Users"
            onPress={() => setSearchType('users')}
            style={styles.searchTypeButton}
          />
        </View>

        <View style={styles.searchSection}>
          {searchType === 'recipes' ? (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
            />
          ) : (
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={Search}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.userSearchInput}
            />
          )}
        </View>

        {searchType === 'recipes' ? (
          <>
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id || category.name}
                    category={category}
                    isSelected={selectedCategory === category.name}
                    onPress={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  />
                ))}
                {categories.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    No categories available
                  </Text>
                )}
              </ScrollView>
            </View>
            
            <View style={styles.trendingSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.trendingIcon, { backgroundColor: '#EF4444', borderColor: colors.iconBorder }]}>
                    <TrendingUp size={16} color="black" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {searchQuery || selectedCategory ? 'Search Results' : 'Trending Recipes'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.recipesGrid}>
                {filteredRecipes.map((recipe, index) => (
                  <View key={recipe.id} style={styles.recipeCardWrapper}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                      onFavoritePress={() => {/* TODO: Implement favorite toggle */}}
                    />
                  </View>
                ))}
              </View>
              
              {recipesLoading && (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Loading recipes...
                  </Text>
                </View>
              )}
              
              {!recipesLoading && filteredRecipes.length === 0 && (searchQuery || selectedCategory) && (
                <View style={styles.emptyContainer}>
                  <BookOpen size={48} color={colors.muted} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    No recipes found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                    Try adjusting your search or category filter
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.usersSection}>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  {searchQuery.trim() ? (
                    <>
                      <User size={48} color={colors.muted} />
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        {isLoading ? 'Searching...' : 'No users found'}
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                        Try searching with a different username or name
                      </Text>
                    </>
                  ) : (
                    <>
                      <Search size={48} color={colors.muted} />
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        Search for users
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                        Find other food enthusiasts and discover their recipes
                      </Text>
                    </>
                  )}
                </View>
              }
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.weights.bold,
  },
  searchTypeToggle: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  searchTypeButton: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  userSearchInput: {
    borderRadius: borderRadius.full,
  },
  categoriesSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.weights.bold,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trendingIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  categoriesContainer: {
    paddingLeft: spacing.lg,
    gap: spacing.md,
  },
  trendingSection: {
    marginBottom: spacing.xl,
  },
  recipesGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  recipeCardWrapper: {
    marginBottom: spacing.sm,
  },
  usersSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl * 1.5,
  },
  emptyText: {
    fontSize: typography.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sm,
    textAlign: "center",
    lineHeight: typography.lineHeights.relaxed * typography.sm,
  },
});