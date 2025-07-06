import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, MessageCircle, Search, Plus, Bot } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { recipes, categories, currentUser } from "@/constants/mockData";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { useChefAssistantStore } from "@/stores/chefAssistantStore";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, unreadNotificationsCount, fetchNotifications, isLoading } = useAuthStore();
  const { selectedAgent } = useChefAssistantStore();

  // Fetch notifications when screen loads
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreateRecipe = () => {
    router.push("/(tabs)/assistant");
  };

  const handleRecipePress = (recipeId: string) => {
    router.push("/(tabs)/assistant");
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push("/(tabs)/search");
  };

  const handleViewAllRecipes = () => {
    router.push("/(tabs)/search");
  };

  const handleViewAllCategories = () => {
    router.push("/(tabs)/search");
  };

  const handleFavoritePress = (recipeId: string) => {
    router.push("/(tabs)/favorites");
  };

  const handleNotificationsPress = () => {
    router.push("/notifications");
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  // Messaging functionality has been removed

  const handleChefAssistantPress = () => {
    router.push("/(tabs)/assistant");
  };

  // Safely get avatar URL with fallback
  const avatarUrl = profile?.avatar_url || currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';

  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={[styles.avatar, { borderColor: colors.iconBorder }]} 
                  onError={() => console.log('Avatar load error')}
                />
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.iconButtonContainer}
                  onPress={handleNotificationsPress}
                >
                  <View style={[styles.iconButton, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
                    <View style={styles.notificationContainer}>
                      <Bell size={20} color="black" />
                      {unreadNotificationsCount > 0 && (
                        <LinearGradient
                          colors={["#EF4444", "#DC2626"]}
                          style={styles.badge}
                        >
                          <Text style={styles.badgeText}>
                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                          </Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                {/* Messaging button removed */}
                <TouchableOpacity 
                  style={styles.iconButtonContainer}
                  onPress={handleChefAssistantPress}
                >
                  <View style={[styles.iconButton, { backgroundColor: '#8B5CF6', borderColor: colors.iconBorder }]}>
                    <Bot size={20} color="black" />
                  </View>
                </TouchableOpacity>
                <ThemeToggle />
              </View>
            </View>

            {/* Chef Assistant Quick Access */}
            <TouchableOpacity 
              style={styles.assistantQuickAccess}
              onPress={handleChefAssistantPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.assistantCard}
              >
                <View style={styles.assistantContent}>
                  <View style={styles.assistantInfo}>
                    <Text style={styles.assistantTitle}>🧠 {selectedAgent?.name || 'Chef Assistant'}</Text>
                    <Text style={styles.assistantDescription}>
                      Ready to help with your cooking! Ask me anything.
                    </Text>
                  </View>
                  <View style={[styles.assistantIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Bot size={24} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.searchContainer}>
              <TouchableOpacity 
                style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)/search")}
                activeOpacity={0.8}
              >
                <View style={[styles.searchIconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
                  <Search size={16} color="black" />
                </View>
                <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Search recipes & users...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButtonContainer} onPress={handleCreateRecipe}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.createButton}
                >
                  <View style={[styles.createIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
                    <Plus size={12} color="white" />
                  </View>
                  <Text style={styles.createButtonText}>Ask Chef</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Popular Recipe Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Recipe</Text>
              <TouchableOpacity onPress={handleViewAllRecipes}>
                <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Cards */}
            <FlatList
              data={recipes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.recipeCard, { 
                  backgroundColor: 'transparent',
                  borderColor: colors.iconBorder,
                }]}>
                  <View style={styles.recipeImageContainer}>
                    <Image 
                      source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop' }} 
                      style={[styles.recipeImage, { borderColor: colors.iconBorder }]} 
                    />
                    <View style={styles.recipeInfo}>
                      <Text style={[styles.recipeTitle, { color: colors.text }]}>{item.title}</Text>
                      <View style={styles.authorInfo}>
                        <Image 
                          source={{ uri: item.author?.avatar_url || avatarUrl }} 
                          style={[styles.authorAvatar, { borderColor: colors.iconBorder }]} 
                        />
                        <Text style={[styles.authorName, { color: colors.muted }]}>{item.author?.full_name || 'Chef'}</Text>
                      </View>
                      <View style={styles.recipeStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.likeIcon, { color: colors.tertiary }]}>👍</Text>
                          <Text style={[styles.statText, { color: colors.muted }]}>{item.likes_count} Like</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.commentIcon, { color: colors.muted }]}>💬</Text>
                          <Text style={[styles.statText, { color: colors.muted }]} numberOfLines={1}>{item.comments_count} Comments</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButtonContainer}
                      onPress={() => handleRecipePress(item.id)}
                    >
                      <LinearGradient
                        colors={["#3B82F6", "#1D4ED8"]}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>▶ Start Chef</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                      onPress={() => handleFavoritePress(item.id)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>♡ Save Chef</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.recipeList}
              onMomentumScrollEnd={(event) => {
                const slideIndex = Math.floor(
                  event.nativeEvent.contentOffset.x / 256
                );
                setActiveSlide(slideIndex);
              }}
            />

            {/* Page Indicators */}
            <View style={styles.pageIndicators}>
              {[0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === activeSlide 
                      ? [styles.activeIndicator, { backgroundColor: colors.tint }]
                      : [styles.inactiveIndicator, { backgroundColor: colors.tabIconDefault }],
                  ]}
                />
              ))}
            </View>

            {/* Category Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
              <TouchableOpacity onPress={handleViewAllCategories}>
                <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Category Cards */}
            <View style={styles.categoryContainer}>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} 
                onPress={() => handleCategoryPress(categories[0]?.id || '1')}
              >
                <LinearGradient
                  colors={["#FACC15", "#F59E0B"]}
                  style={styles.categoryIconContainer}
                >
                  <Text style={styles.categoryIcon}>☕</Text>
                </LinearGradient>
                <View style={styles.categoryTextContainer}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>Breakfast</Text>
                  <Text style={[styles.categoryDescription, { color: colors.muted }]}>All about breakfast recipe tutorial</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} 
                onPress={() => handleCategoryPress(categories[1]?.id || '2')}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.categoryIconContainer}
                >
                  <Text style={styles.categoryIcon}>🍩</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 384, // max-w-sm equivalent
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButtonContainer: {
    borderRadius: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  notificationContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  assistantQuickAccess: {
    marginBottom: 20,
    borderRadius: 16,
  },
  assistantCard: {
    borderRadius: 16,
    padding: 16,
  },
  assistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assistantInfo: {
    flex: 1,
  },
  assistantTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  assistantDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  assistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  createButtonContainer: {
    borderRadius: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  createIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recipeList: {
    paddingLeft: 0,
  },
  recipeCard: {
    width: 280,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 16,
    padding: 16,
  },
  recipeImageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },

  recipeTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  authorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '500',
  },
  recipeStats: {
    flexDirection: "row",
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  likeIcon: {
    fontSize: 16,
  },
  commentIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
    borderRadius: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    gap: 4,
  },
  indicator: {
    borderRadius: 6,
  },
  activeIndicator: {
    width: 12,
    height: 12,
  },
  inactiveIndicator: {
    width: 8,
    height: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIconContainer: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});