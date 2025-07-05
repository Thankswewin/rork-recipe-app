import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { UserPlus, UserCheck, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
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

interface UserProfileCardProps {
  user: UserProfile;
  onFollowToggle?: (userId: string, isFollowing: boolean) => Promise<void>;
  showFollowButton?: boolean;
  compact?: boolean;
}

export default function UserProfileCard({ 
  user, 
  onFollowToggle, 
  showFollowButton = true,
  compact = false 
}: UserProfileCardProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { createOrGetConversation } = useAuthStore();

  const handleUserPress = () => {
    router.push(`/user/${user.id}`);
  };

  const handleFollowPress = async () => {
    if (onFollowToggle && !isFollowLoading) {
      setIsFollowLoading(true);
      try {
        await onFollowToggle(user.id, user.is_following || false);
      } finally {
        setIsFollowLoading(false);
      }
    }
  };

  const handleMessagePress = async () => {
    try {
      const { conversationId, error } = await createOrGetConversation(user.id);
      
      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error('Error navigating to conversation:', error);
    }
  };

  const displayName = user.full_name || user.username || 'Unknown User';
  
  // Better avatar URL handling with proper fallback and cache busting
  const getAvatarSource = () => {
    if (imageError || !user.avatar_url) {
      return { uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' };
    }
    // Add cache busting parameter to force reload
    const separator = user.avatar_url.includes('?') ? '&' : '?';
    return { uri: `${user.avatar_url}${separator}t=${Date.now()}` };
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={handleUserPress}
        activeOpacity={0.8}
      >
        <Image 
          source={getAvatarSource()}
          style={[styles.compactAvatar, { borderColor: colors.iconBorder }]} 
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {user.username && (
            <Text style={[styles.compactUsername, { color: colors.muted }]} numberOfLines={1}>
              @{user.username}
            </Text>
          )}
        </View>
        {showFollowButton && (
          <TouchableOpacity
            style={[
              styles.compactFollowButton,
              user.is_following 
                ? { backgroundColor: colors.muted }
                : { backgroundColor: colors.tint },
              isFollowLoading && { opacity: 0.6 }
            ]}
            onPress={handleFollowPress}
            disabled={isFollowLoading}
          >
            {user.is_following ? (
              <UserCheck size={14} color="white" />
            ) : (
              <UserPlus size={14} color="white" />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={handleUserPress}
      activeOpacity={0.8}
    >
      <View style={styles.userInfo}>
        <Image 
          source={getAvatarSource()}
          style={[styles.avatar, { borderColor: colors.iconBorder }]} 
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
        <View style={styles.userDetails}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {displayName}
          </Text>
          {user.username && (
            <Text style={[styles.username, { color: colors.muted }]}>
              @{user.username}
            </Text>
          )}
          {user.bio && (
            <Text style={[styles.bio, { color: colors.muted }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          <Text style={[styles.recipeCount, { color: colors.muted }]}>
            {user.recipe_count || 0} recipes
          </Text>
        </View>
      </View>
      
      {showFollowButton && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.followButton,
              user.is_following 
                ? { backgroundColor: colors.muted }
                : { backgroundColor: colors.tint },
              isFollowLoading && { opacity: 0.6 }
            ]}
            onPress={handleFollowPress}
            disabled={isFollowLoading}
          >
            {user.is_following ? (
              <UserCheck size={16} color="white" />
            ) : (
              <UserPlus size={16} color="white" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.messageButton, { borderColor: colors.border }]}
            onPress={handleMessagePress}
          >
            <MessageCircle size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
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
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  userDetails: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  compactUsername: {
    fontSize: 12,
  },
  bio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  recipeCount: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  compactFollowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});