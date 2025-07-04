import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { currentUser, recipes } from "@/constants/mockData";
import { Settings, Edit, LogOut, BookOpen, Award, Clock } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function ProfileScreen() {
  // For demo purposes, let's say the user has created 2 recipes
  const userRecipes = recipes.slice(0, 2);
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.settingsButtonContainer}>
            <View style={[styles.settingsButton, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
              <Settings size={20} color="black" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileSection}>
          <Image source={{ uri: currentUser.avatar }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{currentUser.name}</Text>
            <Text style={[styles.profileBio, { color: colors.muted }]}>Food enthusiast & home chef</Text>
          </View>
          <TouchableOpacity style={[styles.editProfileButton, { borderColor: colors.muted }]}>
            <View style={[styles.editIconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
              <Edit size={14} color="black" />
            </View>
            <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.statsSection, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Recipes</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>48</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>65</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Following</Text>
          </View>
        </View>
        
        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
              <BookOpen size={18} color="black" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>My Recipes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#8B5CF6', borderColor: colors.iconBorder }]}>
              <Award size={18} color="black" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Achievements</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#EF4444', borderColor: colors.iconBorder }]}>
              <Clock size={18} color="black" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Recently Viewed</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Recipes</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recipeGrid}>
          {userRecipes.map((recipe) => (
            <TouchableOpacity key={recipe.id} style={[styles.recipeCard, { backgroundColor: colors.cardBackground }]}>
              <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
              <View style={styles.recipeInfo}>
                <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={1}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  <Text style={[styles.recipeCategory, { color: colors.muted, backgroundColor: colors.inputBackground }]}>{recipe.category}</Text>
                  <View style={styles.recipeLikes}>
                    <Text style={[styles.recipeLikesText, { color: colors.muted }]}>{recipe.likes} likes</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.tint }]}>
          <View style={[styles.logoutIconContainer, { backgroundColor: colors.tint, borderColor: colors.iconBorder }]}>
            <LogOut size={18} color="black" />
          </View>
          <Text style={[styles.logoutText, { color: colors.tint }]}>Log Out</Text>
        </TouchableOpacity>
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
  },
  settingsButtonContainer: {
    borderRadius: 12,
  },
  settingsButton: {
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
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  editIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
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
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
  },
  menuText: {
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
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
  recipeGrid: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  recipeCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 80,
    height: 80,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeCategory: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recipeLikes: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeLikesText: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 100, // Extra padding for tab bar
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});