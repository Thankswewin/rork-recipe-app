import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Users, UserPlus } from 'lucide-react-native';
import BackButton from '@/components/BackButton';
import UserProfileCard from '@/components/UserProfileCard';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  recipe_count?: number;
  is_following?: boolean;
}

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchFollowData();
    }
  }, [id]);

  const fetchFollowData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch followers
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles!followers_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', id);

      if (!followersError && followersData) {
        const followersProfiles = followersData.map(f => f.profiles).filter(Boolean);
        setFollowers(followersProfiles as UserProfile[]);
      }

      // Fetch following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles!followers_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', id);

      if (!followingError && followingData) {
        const followingProfiles = followingData.map(f => f.profiles).filter(Boolean);
        setFollowing(followingProfiles as UserProfile[]);
      }

      // Check which users the current user is following
      if (currentUser) {
        const allUserIds = [
          ...followersProfiles.map(u => u.id),
          ...followingProfiles.map(u => u.id)
        ].filter((id, index, arr) => arr.indexOf(id) === index);

        if (allUserIds.length > 0) {
          const { data: currentUserFollowing } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', allUserIds);

          const followingIds = new Set(currentUserFollowing?.map(f => f.following_id) || []);

          setFollowers(prev => prev.map(user => ({
            ...user,
            is_following: followingIds.has(user.id)
          })));

          setFollowing(prev => prev.map(user => ({
            ...user,
            is_following: followingIds.has(user.id)
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const updateUser = (user: UserProfile) => 
        user.id === userId ? { ...user, is_following: !isCurrentlyFollowing } : user;

      setFollowers(prev => prev.map(updateUser));
      setFollowing(prev => prev.map(updateUser));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <UserProfileCard
      user={item}
      onFollowToggle={handleFollowToggle}
      showFollowButton={currentUser?.id !== item.id}
    />
  );

  const currentData = activeTab === 'followers' ? followers : following;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[\"top\"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>
          {activeTab === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'followers' 
              ? { backgroundColor: colors.tint }
              : { backgroundColor: colors.inputBackground, borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('followers')}
        >
          <Users size={16} color={activeTab === 'followers' ? 'white' : colors.text} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'followers' ? 'white' : colors.text }
          ]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' 
              ? { backgroundColor: colors.tint }
              : { backgroundColor: colors.inputBackground, borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('following')}
        >
          <UserPlus size={16} color={activeTab === 'following' ? 'white' : colors.text} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'following' ? 'white' : colors.text }
          ]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {isLoading ? 'Loading...' : `No ${activeTab}`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              {activeTab === 'followers' 
                ? 'No one is following this user yet'
                : 'This user isn\'t following anyone yet'
              }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
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
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});