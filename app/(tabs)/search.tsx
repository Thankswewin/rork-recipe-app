import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, User, UserPlus, UserCheck } from "lucide-react-native";
import { Stack, router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

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
          bio,
          recipes:recipes(count)
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
          recipe_count: user.recipes?.[0]?.count || 0,
          is_following: followingIds.has(user.id),
        }));

        setUsers(usersWithFollowStatus);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
          });
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_following: !isCurrentlyFollowing }
          : user
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.userInfo}>
        <Image
          source={{ 
            uri: item.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          }}
          style={[styles.avatar, { borderColor: colors.iconBorder }]}
        />
        <View style={styles.userDetails}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {item.full_name || 'Unknown User'}
          </Text>
          {item.username && (
            <Text style={[styles.username, { color: colors.muted }]}>
              @{item.username}
            </Text>
          )}
          {item.bio && (
            <Text style={[styles.bio, { color: colors.muted }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          <Text style={[styles.recipeCount, { color: colors.muted }]}>
            {item.recipe_count || 0} recipes
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.followButton,
          item.is_following 
            ? { backgroundColor: colors.muted }
            : { backgroundColor: colors.tint }
        ]}
        onPress={() => handleFollowToggle(item.id, item.is_following || false)}
      >
        {item.is_following ? (
          <UserCheck size={16} color="white" />
        ) : (
          <UserPlus size={16} color="white" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Search Users</Text>
      </View>

      <View style={styles.searchContainer}>
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
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  recipeCount: {
    fontSize: 12,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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