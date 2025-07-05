import React, { useState } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipes } from "@/constants/mockData";
import { Settings, Edit, LogOut, BookOpen, Award, Clock, Camera, Check, X } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { Stack, router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export default function ProfileScreen() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const userRecipes = recipes.slice(0, 2);
  const { colors } = useTheme();
  const { user, profile, signOut, updateProfile, uploadAvatar, checkUsernameAvailability } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditForm({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    // Validate username if changed
    if (editForm.username && editForm.username !== profile?.username) {
      // Check if username is valid (alphanumeric and underscores only)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(editForm.username)) {
        Alert.alert('Invalid Username', 'Username can only contain letters, numbers, and underscores.');
        return;
      }

      if (editForm.username.length < 3) {
        Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
        return;
      }

      const { available, error } = await checkUsernameAvailability(editForm.username);
      if (error) {
        Alert.alert('Error', 'Failed to check username availability');
        return;
      }
      if (!available) {
        Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
        return;
      }
    }

    const { error } = await updateProfile({
      username: editForm.username || null,
      full_name: editForm.full_name || null,
      bio: editForm.bio || null,
    });

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditForm({
      username: '',
      full_name: '',
      bio: '',
    });
  };

  const handleChangeAvatar = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Avatar upload is not available on web');
      return;
    }

    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openImagePicker(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take a photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatarImage(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions to choose an image');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatarImage(result.assets[0].uri);
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    const { error } = await uploadAvatar(imageUri);
    setIsUploadingAvatar(false);

    if (error) {
      Alert.alert('Upload Failed', error);
    } else {
      Alert.alert('Success', 'Avatar updated successfully');
      setImageError(false); // Reset image error state after successful upload
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'user@example.com';
  
  // Better avatar URL handling with proper fallback
  const getAvatarSource = () => {
    if (imageError || !profile?.avatar_url) {
      return { uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' };
    }
    return { uri: profile.avatar_url };
  };
  
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
          <View style={styles.avatarContainer}>
            <Image 
              source={getAvatarSource()} 
              style={styles.profileImage}
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: colors.tint, borderColor: colors.iconBorder }]}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
            >
              <Camera size={16} color="white" />
            </TouchableOpacity>
            {isUploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <Text style={[styles.uploadingText, { color: colors.text }]}>Uploading...</Text>
              </View>
            )}
          </View>
          
          {isEditingProfile ? (
            <View style={styles.editForm}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '') }))}
                  placeholder="Enter username"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  maxLength={20}
                />
                <Text style={[styles.inputHint, { color: colors.muted }]}>
                  Only letters, numbers, and underscores allowed
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
              </View>
              
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.editActionButton, { backgroundColor: colors.muted }]}
                  onPress={handleCancelEdit}
                >
                  <X size={16} color="white" />
                  <Text style={styles.editActionText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.editActionButton, { backgroundColor: colors.tint }]}
                  onPress={handleSaveProfile}
                >
                  <Check size={16} color="white" />
                  <Text style={styles.editActionText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              {profile?.username && (
                <Text style={[styles.username, { color: colors.muted }]}>@{profile.username}</Text>
              )}
              <Text style={[styles.profileEmail, { color: colors.muted }]}>{displayEmail}</Text>
              <Text style={[styles.profileBio, { color: colors.muted }]}>
                {profile?.bio || 'Food enthusiast & home chef'}
              </Text>
              <TouchableOpacity 
                style={[styles.editProfileButton, { borderColor: colors.muted }]}
                onPress={handleEditProfile}
              >
                <View style={[styles.editIconContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
                  <Edit size={14} color="black" />
                </View>
                <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={[styles.statsSection, { borderColor: colors.border }]}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Recipes</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => user?.id && router.push(`/followers/${user.id}`)}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>48</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => user?.id && router.push(`/followers/${user.id}`)}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>65</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Following</Text>
          </TouchableOpacity>
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
        
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.tint }]}
          onPress={handleSignOut}
        >
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
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
  editForm: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editActionText: {
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
    marginBottom: 100,
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