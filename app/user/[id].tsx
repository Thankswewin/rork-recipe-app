import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { UserPlus, UserCheck, Share } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface UserRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  likes_count: number;
  created_at: string;
}

interface UserStats {
  recipes_count: number;
  followers_count: number;
  following_count: number;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ recipes_count: 0, followers_count: 0, following_count: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render of avatar
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  // Refetch data when screen comes into focus to ensure latest follow state
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchUserData();
      }
    }, [id])
  );

  // Update avatar key when user profile avatar changes
  useEffect(() => {
    setAvatarKey(prev => prev + 1);
    setImageError(false);
  }, [userProfile?.avatar_url]);

  const fetchUserData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      setUserProfile(profileData);

      // Fetch user recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recipesError) {
        setUserRecipes(recipesData || []);
      }

      // Fetch user stats
      const [recipesCount, followersCount, followingCount] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact' }).eq('user_id', id),
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', id),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', id),
      ]);

      setUserStats({
        recipes_count: recipesCount.count || 0,
        followers_count: followersCount.count || 0,
        following_count: followingCount.count || 0,
      });

      // Check if current user is following this user
      if (currentUser) {
        const { data: followData } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !id || isFollowLoading) {
      console.error('Cannot toggle follow:', { currentUser: !!currentUser, id, isFollowLoading });
      return;
    }

    // Check if trying to follow self
    if (currentUser.id === id) {
      console.error('Cannot follow yourself');
      return;
    }

    console.log('Profile follow toggle:', { userId: id, isFollowing, currentUserId: currentUser.id });
    
    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return;
    }

    setIsFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error, data } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id)
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
        
        console.log('Profile unfollow successful:', data);
        setIsFollowing(false);
        setUserStats(prev => ({ ...prev, followers_count: Math.max(0, prev.followers_count - 1) }));
      } else {
        // Follow
        const { error, data } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
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
        
        console.log('Profile follow successful:', data);
        setIsFollowing(true);
        setUserStats(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }
    } catch (error: any) {
      console.error('Error toggling follow:', {
        message: error.message || 'Unknown error',
        error: error
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleRecipePress = (recipeId: string) => {
    // Navigate to recipe details
    console.log(`Recipe ${recipeId} pressed`);
  };

  const renderRecipeItem = ({ item }: { item: UserRecipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => handleRecipePress(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ 
          uri: item.image_url || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop'
        }}
        style={styles.recipeImage}
      />
      <View style={styles.recipeInfo}>
        <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.recipeCategory, { color: colors.muted }]}>
          {item.category}
        </Text>
        <Text style={[styles.recipeLikes, { color: colors.muted }]}>
          {item.likes_count} likes
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = userProfile.full_name || userProfile.username || 'Unknown User';
  
  // Better avatar URL handling with proper fallback and cache busting
  const getAvatarSource = () => {
    if (imageError || !userProfile.avatar_url) {
      return { uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' };
    }
    // Add cache busting parameter to force reload
    const separator = userProfile.avatar_url.includes('?') ? '&' : '?';
    return { uri: `${userProfile.avatar_url}${separator}t=${Date.now()}` };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.shareButtonContainer}>
            <View style={[styles.shareButton, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
              <Share size={20} color="black" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileSection}>
          <Image 
            key={`user-avatar-${avatarKey}-${userProfile.avatar_url || 'default'}`} // Better key for re-rendering
            source={getAvatarSource()} 
            style={styles.profileImage}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
            {userProfile.username && (
              <Text style={[styles.username, { color: colors.muted }]}>@{userProfile.username}</Text>
            )}
            <Text style={[styles.profileBio, { color: colors.muted }]}>
              {userProfile.bio || 'Food enthusiast & home chef'}
            </Text>
          </View>
          
          {currentUser?.id !== id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing 
                    ? { backgroundColor: colors.muted }
                    : { backgroundColor: colors.tint },
                  isFollowLoading && { opacity: 0.6 }
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowing ? (
                  <UserCheck size={18} color="white" />
                ) : (
                  <UserPlus size={18} color="white" />
                )}
                <Text style={styles.followButtonText}>
                  {isFollowLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={[styles.statsSection, { borderColor: colors.border }]}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{userStats.recipes_count}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Recipes</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push(`/followers/${id}`)}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>{userStats.followers_count}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push(`/followers/${id}`)}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>{userStats.following_count}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Following</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recipesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recipes</Text>
          
          {userRecipes.length > 0 ? (
            <FlatList
              data={userRecipes}
              keyExtractor={(item) => item.id}
              renderItem={renderRecipeItem}
              numColumns={2}
              columnWrapperStyle={styles.recipeRow}
              contentContainerStyle={styles.recipeGrid}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyRecipes}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No recipes yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  shareButtonContainer: {
    borderRadius: 12,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
  },
  recipesSection: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  recipeGrid: {
    paddingBottom: 20,
  },
  recipeRow: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  recipeLikes: {
    fontSize: 12,
  },
  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});