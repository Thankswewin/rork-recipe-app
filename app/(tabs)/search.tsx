import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, User, UserPlus, UserCheck, BookOpen, Filter, TrendingUp } from "lucide-react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { trpc } from "@/lib/trpc";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import RecipeCard from "@/components/RecipeCard";
import UserProfileCard from "@/components/UserProfileCard";

import { recipes, categories } from "@/constants/mockData";

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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

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

  const createConversationMutation = trpc.conversations.createConversation.useMutation();

  const handleStartMessage = async (userId: string) => {
    try {
      const result = await createConversationMutation.mutateAsync({
        otherUserId: userId
      });
      
      if (result?.id) {
        router.push(`/messages/${result.id}`);
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      // Show user-friendly error message
      if (error?.message?.includes('configuration issue') || error?.message?.includes('not set up yet')) {
        // Navigate to messages to show the proper error state
        router.push("/messages");
      } else {
        // For other errors, still try to navigate to messages
        router.push("/messages");
      }
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <UserProfileCard
      user={item}
      onFollowToggle={handleFollowToggle}
      showFollowButton={true}
      onMessagePress={() => handleStartMessage(item.id)}
    />
  );

  // Filter recipes based on search query and category
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = searchQuery === "" || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.category && recipe.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === null || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Search</Text>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.tint, borderColor: colors.iconBorder }]}>
            <Filter size={20} color="black" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchTypeToggle}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'recipes' 
                ? { backgroundColor: colors.tint }
                : { backgroundColor: colors.inputBackground, borderColor: colors.border }
            ]}
            onPress={() => setSearchType('recipes')}
          >
            <BookOpen size={16} color={searchType === 'recipes' ? 'white' : colors.text} />
            <Text style={[
              styles.searchTypeText,
              { color: searchType === 'recipes' ? 'white' : colors.text }
            ]}>Recipes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'users' 
                ? { backgroundColor: colors.tint }
                : { backgroundColor: colors.inputBackground, borderColor: colors.border }
            ]}
            onPress={() => setSearchType('users')}
          >
            <User size={16} color={searchType === 'users' ? 'white' : colors.text} />
            <Text style={[
              styles.searchTypeText,
              { color: searchType === 'users' ? 'white' : colors.text }
            ]}>Users</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          {searchType === 'recipes' ? (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
            />
          ) : (
            <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.searchIconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
                <Search size={16} color="black" />
              </View>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by username or name..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
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
                    key={category.id}
                    category={category}
                    onPress={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  />
                ))}
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
                {filteredRecipes.slice(0, 6).map((recipe) => (
                  <TouchableOpacity 
                    key={recipe.id} 
                    onPress={() => handleRecipePress(recipe.id)}
                    activeOpacity={0.8}
                  >
                    <RecipeCard recipe={recipe} />
                  </TouchableOpacity>
                ))}
              </View>
              
              {filteredRecipes.length === 0 && (searchQuery || selectedCategory) && (
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
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  searchTypeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trendingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  categoriesContainer: {
    paddingLeft: 16,
    gap: 12,
  },
  trendingSection: {
    marginBottom: 24,
  },
  recipesGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  usersSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});