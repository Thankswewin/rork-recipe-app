import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChefHat, Plus, ArrowRight, Clock, Users, Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { spacing, typography, borderRadius, colorPalette } from "@/constants/designSystem";

const recipeSteps = [
  {
    id: 1,
    title: "CHOOSE BASE",
    subtitle: "Select your main ingredient",
    icon: "🥘",
    completed: false
  },
  {
    id: 2,
    title: "ADD TOPPINGS",
    subtitle: "Build your flavor",
    icon: "🧄",
    completed: false
  },
  {
    id: 3,
    title: "COOKING METHOD",
    subtitle: "Choose how to cook",
    icon: "🔥",
    completed: false
  }
];

const popularRecipes = [
  {
    id: 1,
    title: "Classic Pasta",
    time: "25 min",
    difficulty: "Easy",
    rating: 4.8,
    image: "🍝"
  },
  {
    id: 2,
    title: "Grilled Chicken",
    time: "35 min",
    difficulty: "Medium",
    rating: 4.9,
    image: "🍗"
  },
  {
    id: 3,
    title: "Fresh Salad",
    time: "10 min",
    difficulty: "Easy",
    rating: 4.7,
    image: "🥗"
  }
];

export default function HomeScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, isLoading } = useAuthStore();

  const handleStartCooking = () => {
    router.push("/(tabs)/assistant");
  };

  const handleStepPress = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleRecipePress = (recipeId: number) => {
    router.push("/(tabs)/assistant");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>RECIPE BUILDER</Text>
                <Text style={styles.subtitle}>Create your perfect recipe in 3 easy steps</Text>
              </View>
            </View>

            {/* Main Action Button */}
            <Card style={styles.mainCard}>
              <Button
                variant="primary"
                size="large"
                onPress={handleStartCooking}
                style={styles.startButton}
              >
                START COOKING
              </Button>
            </Card>

            {/* Recipe Steps */}
            <View style={styles.stepsContainer}>
              {recipeSteps.map((step, index) => (
                <TouchableOpacity
                  key={step.id}
                  style={[
                    styles.stepCard,
                    currentStep === index && styles.activeStepCard
                  ]}
                  onPress={() => handleStepPress(index)}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.id}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                  <View style={styles.stepIcon}>
                    <Text style={styles.stepEmoji}>{step.icon}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular Recipes */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Recipes</Text>
            </View>

            <View style={styles.recipesGrid}>
              {popularRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleRecipePress(recipe.id)}
                >
                  <View style={styles.recipeImageContainer}>
                    <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                  </View>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeInfo}>
                    <View style={styles.recipeInfoItem}>
                      <Clock size={12} color="#64748b" />
                      <Text style={styles.recipeInfoText}>{recipe.time}</Text>
                    </View>
                    <View style={styles.recipeInfoItem}>
                      <Star size={12} color="#fbbf24" />
                      <Text style={styles.recipeInfoText}>{recipe.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/search")}
              >
                <Text style={styles.quickActionText}>Browse All Recipes</Text>
                <ArrowRight size={16} color="#64748b" />
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
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 32,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 20,
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  activeStepCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#f8faff',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  stepIcon: {
    marginLeft: 16,
  },
  stepEmoji: {
    fontSize: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  recipeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  recipeEmoji: {
    fontSize: 28,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recipeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  difficultyBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});