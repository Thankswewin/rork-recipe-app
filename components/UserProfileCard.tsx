import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { UserPlus, UserCheck, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

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
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
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

  const handleUserPress = () => {
    router.push(`/user/${user.id}`);
  };

  const handleFollowPress = () => {
    if (onFollowToggle) {
      onFollowToggle(user.id, user.is_following || false);
    }
  };

  const displayName = user.full_name || 'Unknown User';
  const avatarUrl = user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={handleUserPress}
        activeOpacity={0.8}
      >
        <Image source={{ uri: avatarUrl }} style={[styles.compactAvatar, { borderColor: colors.iconBorder }]} />
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
                : { backgroundColor: colors.tint }
            ]}
            onPress={handleFollowPress}
          >
            {user.is_following ? (
              <UserCheck size={14} color=\"white\" />
            ) : (
              <UserPlus size={14} color=\"white\" />
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
        <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: colors.iconBorder }]} />
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
                : { backgroundColor: colors.tint }
            ]}
            onPress={handleFollowPress}
          >
            {user.is_following ? (
              <UserCheck size={16} color=\"white\" />
            ) : (
              <UserPlus size={16} color=\"white\" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.messageButton, { borderColor: colors.border }]}>
            <MessageCircle size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: \"row\",\n    alignItems: \"center\",\n    justifyContent: \"space-between\",\n    padding: 16,\n    borderRadius: 16,\n    borderWidth: 1,\n    marginBottom: 12,\n    shadowColor: \"#000\",\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.05,\n    shadowRadius: 4,\n    elevation: 2,\n  },\n  compactCard: {\n    flexDirection: \"row\",\n    alignItems: \"center\",\n    padding: 12,\n    borderRadius: 12,\n    borderWidth: 1,\n    marginBottom: 8,\n  },\n  userInfo: {\n    flexDirection: \"row\",\n    alignItems: \"center\",\n    flex: 1,\n  },\n  avatar: {\n    width: 60,\n    height: 60,\n    borderRadius: 30,\n    marginRight: 16,\n    borderWidth: 2,\n  },\n  compactAvatar: {\n    width: 40,\n    height: 40,\n    borderRadius: 20,\n    marginRight: 12,\n    borderWidth: 1,\n  },\n  userDetails: {\n    flex: 1,\n  },\n  compactInfo: {\n    flex: 1,\n  },\n  displayName: {\n    fontSize: 16,\n    fontWeight: \"600\",\n    marginBottom: 2,\n  },\n  compactName: {\n    fontSize: 14,\n    fontWeight: \"600\",\n    marginBottom: 2,\n  },\n  username: {\n    fontSize: 14,\n    marginBottom: 4,\n  },\n  compactUsername: {\n    fontSize: 12,\n  },\n  bio: {\n    fontSize: 12,\n    lineHeight: 16,\n    marginBottom: 4,\n  },\n  recipeCount: {\n    fontSize: 12,\n  },\n  actions: {\n    flexDirection: 'row',\n    gap: 8,\n  },\n  followButton: {\n    width: 40,\n    height: 40,\n    borderRadius: 20,\n    justifyContent: \"center\",\n    alignItems: \"center\",\n  },\n  compactFollowButton: {\n    width: 32,\n    height: 32,\n    borderRadius: 16,\n    justifyContent: \"center\",\n    alignItems: \"center\",\n  },\n  messageButton: {\n    width: 40,\n    height: 40,\n    borderRadius: 20,\n    justifyContent: \"center\",\n    alignItems: \"center\",\n    borderWidth: 1,\n  },\n});