import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Bell, Check, CheckCheck, User, Heart, MessageCircle, BookOpen } from 'lucide-react-native';
import BackButton from '@/components/BackButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';

interface NotificationItemProps {
  notification: any;
  onPress: (notification: any) => void;
  onMarkAsRead: (notificationId: string) => void;
}

function NotificationItem({ notification, onPress, onMarkAsRead }: NotificationItemProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <User size={20} color={colors.tint} />;
      case 'like':
        return <Heart size={20} color="#EF4444" />;
      case 'comment':
        return <MessageCircle size={20} color="#10B981" />;
      case 'recipe_created':
        return <BookOpen size={20} color="#8B5CF6" />;
      default:
        return <Bell size={20} color={colors.muted} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getAvatarSource = () => {
    if (imageError || !notification.actor?.avatar_url) {
      return { uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' };
    }
    return { uri: notification.actor.avatar_url };
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: notification.read ? colors.cardBackground : colors.inputBackground,
          borderColor: colors.border 
        }
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={getAvatarSource()}
            style={[styles.avatar, { borderColor: colors.iconBorder }]}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          <View style={[styles.iconBadge, { backgroundColor: colors.background, borderColor: colors.iconBorder }]}>
            {getNotificationIcon()}
          </View>
        </View>

        <View style={styles.textContent}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.muted }]}>
            {notification.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.muted }]}>
            {getTimeAgo(notification.created_at)}
          </Text>
        </View>

        <View style={styles.actions}>
          {!notification.read && (
            <TouchableOpacity
              style={[styles.markReadButton, { backgroundColor: colors.tint }]}
              onPress={() => onMarkAsRead(notification.id)}
            >
              <Check size={16} color="white" />
            </TouchableOpacity>
          )}
          {!notification.read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { 
    notifications, 
    unreadNotificationsCount, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        if (notification.actor_id) {
          router.push(`/user/${notification.actor_id}`);
        }
        break;
      case 'like':
      case 'comment':
        if (notification.data?.recipe_id) {
          router.push(`/recipe/${notification.data.recipe_id}`);
        }
        break;
      case 'recipe_created':
        if (notification.data?.recipe_id) {
          router.push(`/recipe/${notification.data.recipe_id}`);
        }
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const renderNotificationItem = ({ item }: { item: any }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        {unreadNotificationsCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.tint }]}
            onPress={handleMarkAllAsRead}
          >
            <CheckCheck size={16} color="white" />
          </TouchableOpacity>
        )}
        {unreadNotificationsCount === 0 && <View style={{ width: 40 }} />}
      </View>

      {unreadNotificationsCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Bell size={16} color={colors.tint} />
          <Text style={[styles.unreadText, { color: colors.text }]}>
            You have {unreadNotificationsCount} unread notification{unreadNotificationsCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              When someone follows you or interacts with your recipes, you will see it here
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
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  notificationItem: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  actions: {
    alignItems: 'center',
    gap: 8,
  },
  markReadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    paddingHorizontal: 32,
  },
});