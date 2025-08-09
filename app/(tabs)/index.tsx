import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Clock, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { spacing, typography, borderRadius, colorPalette, shadows } from "@/constants/designSystem";

const recipeSteps = [
  { id: 1, title: "Choose base", subtitle: "Select your main ingredient", icon: "🥘" },
  { id: 2, title: "Add toppings", subtitle: "Build your flavor", icon: "🧄" },
  { id: 3, title: "Cooking method", subtitle: "Choose how to cook", icon: "🔥" },
] as const;

const popularRecipes = [
  { id: 1, title: "Classic Pasta", time: "25 min", difficulty: "Easy", rating: 4.8, image: "🍝" },
  { id: 2, title: "Grilled Chicken", time: "35 min", difficulty: "Medium", rating: 4.9, image: "🍗" },
  { id: 3, title: "Fresh Salad", time: "10 min", difficulty: "Easy", rating: 4.7, image: "🥗" },
] as const;

export default function HomeScreen() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isLoading } = useAuthStore();

  const appearAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(appearAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [appearAnim]);

  const containerStyle = {
    opacity: appearAnim,
    transform: [{ translateY: appearAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  } as const;

  const handleStartCooking = () => {
    router.push("/(tabs)/assistant");
  };

  const handleStepPress = (stepIndex: number) => setCurrentStep(stepIndex);
  const handleRecipePress = (recipeId: number) => router.push("/(tabs)/assistant");

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.appBackground }]}> 
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}> 
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <Animated.View style={[styles.content, containerStyle]}> 
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: colors.text }]}>Recipe builder</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Create your perfect recipe in 3 easy steps</Text>
              </View>
            </View>

            <Card style={[styles.mainCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
              <Button
                variant="purple"
                size="lg"
                gradient
                onPress={handleStartCooking}
                fullWidth
                testID="start-cooking"
                accessibilityLabel="Start cooking"
              >
                <Text>Start cooking</Text>
              </Button>
            </Card>

            <View style={styles.stepsContainer}>
              {recipeSteps.map((step, index) => {
                const focused = currentStep === index;
                return (
                  <AnimatedTouchable
                    key={step.id}
                    onPress={() => handleStepPress(index)}
                    style={[
                      styles.stepCard,
                      { backgroundColor: colors.cardBackground, borderColor: focused ? colors.tint : colors.border },
                    ]}
                    testID={`step-${index}`}
                  >
                    <View style={[styles.stepNumber, { backgroundColor: focused ? colors.tint : colors.inputBackground }]}> 
                      <Text style={[styles.stepNumberText, { color: focused ? '#fff' : colors.muted }]}>{step.id}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{step.subtitle}</Text>
                    </View>
                    <View style={styles.stepIcon}>
                      <Text style={styles.stepEmoji}>{step.icon}</Text>
                    </View>
                  </AnimatedTouchable>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular recipes</Text>
            </View>

            <View style={styles.recipesGrid}>
              {popularRecipes.map((recipe) => (
                <AnimatedTouchable
                  key={recipe.id}
                  style={[styles.recipeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => handleRecipePress(recipe.id)}
                  testID={`recipe-${recipe.id}`}
                >
                  <View style={[styles.recipeImageContainer, { backgroundColor: isDark ? '#111827' : '#f1f5f9' }]}> 
                    <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                  </View>
                  <Text style={[styles.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>
                  <View style={styles.recipeInfo}>
                    <View style={styles.recipeInfoItem}>
                      <Clock size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                      <Text style={[styles.recipeInfoText, { color: colors.muted }]}>{recipe.time}</Text>
                    </View>
                    <View style={styles.recipeInfoItem}>
                      <Star size={12} color={colorPalette.secondary[400]} />
                      <Text style={[styles.recipeInfoText, { color: colors.muted }]}>{recipe.rating}</Text>
                    </View>
                  </View>
                  <View style={[styles.difficultyBadge, { backgroundColor: isDark ? '#111827' : '#f1f5f9' }]}> 
                    <Text style={[styles.difficultyText, { color: colors.muted }]}>{recipe.difficulty}</Text>
                  </View>
                </AnimatedTouchable>
              ))}
            </View>

            <View style={styles.quickActions}>
              <AnimatedTouchable 
                style={[styles.quickActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)/search")}
                testID="browse-all"
              >
                <Text style={[{ fontSize: 16, fontWeight: '600' }, { color: colors.text }]}>Browse all recipes</Text>
                <ArrowRight size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </AnimatedTouchable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity as any) as React.ComponentType<React.ComponentProps<typeof TouchableOpacity>>;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  scrollView: { flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontWeight: '500' },
  header: { alignItems: 'center', marginBottom: 28 },
  headerContent: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    ...shadows.md,
  },
  stepsContainer: { marginBottom: 24 },
  stepCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: { fontSize: 16, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  stepSubtitle: { fontSize: 13 },
  stepIcon: { marginLeft: 12 },
  stepEmoji: { fontSize: 22 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  recipesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  recipeCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    ...shadows.sm,
  },
  recipeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  recipeEmoji: { fontSize: 28 },
  recipeTitle: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recipeInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeInfoText: { fontSize: 12, fontWeight: '500' },
  difficultyBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'center' },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  quickActions: { gap: 12 },
  quickActionButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
});