import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Mic, Brain, Globe, ChefHat, Bot, Video, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import BackButton from "@/components/BackButton";
import GradientText from "@/components/GradientText";

export default function AssistantScreen() {
  const { colors } = useTheme();

  const features = [
    {
      id: "1",
      title: "Real-time Camera Analysis",
      description: "Get instant feedback on your cooking techniques",
      icon: Camera,
      gradient: ["#3B82F6", "#1D4ED8"],
      iconBg: "#3B82F6",
    },
    {
      id: "2", 
      title: "Voice Commands",
      description: "Hands-free cooking with voice interaction",
      icon: Mic,
      gradient: ["#10B981", "#047857"],
      iconBg: "#10B981",
    },
    {
      id: "3",
      title: "Custom AI Training", 
      description: "Train your own cooking AI with videos and recipes",
      icon: Brain,
      gradient: ["#F59E0B", "#D97706"],
      iconBg: "#F59E0B",
    },
    {
      id: "4",
      title: "Multi-language Support",
      description: "Available in English, Yoruba, Igbo, and Hausa",
      icon: Globe,
      gradient: ["#EF4444", "#DC2626"],
      iconBg: "#EF4444",
    },
  ];

  const quickActions = [
    {
      id: "1",
      title: "Start Cooking Session",
      icon: ChefHat,
      type: "primary",
      iconBg: "#10B981",
    },
    {
      id: "2", 
      title: "Create Custom Agent",
      icon: Bot,
      type: "secondary",
      iconBg: "#8B5CF6",
    },
    {
      id: "3",
      title: "Upload Training Video", 
      icon: Video,
      type: "secondary",
      iconBg: "#FACC15",
    },
  ];

  const handleFeaturePress = (featureId: string) => {
    console.log(`Feature ${featureId} pressed`);
  };

  const handleQuickActionPress = (actionId: string) => {
    console.log(`Quick action ${actionId} pressed`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton />
            <View style={styles.titleContainer}>
              <GradientText
                colors={["#EF4444", "#F59E0B", "#3B82F6"]}
                style={styles.title}
              >
                MANU ASSIST
              </GradientText>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Features Section */}
          <View style={[styles.featuresCard, { 
            backgroundColor: 'transparent',
            borderColor: colors.iconBorder,
          }]}>
            <View style={styles.sectionTitleContainer}>
              <GradientText
                colors={["#8B5CF6", "#3B82F6"]}
                style={styles.sectionTitle}
              >
                MANU ASSIST Features
              </GradientText>
            </View>
            
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureItem}
                onPress={() => handleFeaturePress(feature.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.iconBg, borderColor: colors.iconBorder }]}>
                  <feature.icon size={20} color="black" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.muted }]}>{feature.description}</Text>
                </View>
                <View style={[styles.arrowIconContainer, { backgroundColor: '#E5E7EB', borderColor: colors.iconBorder }]}>
                  <ArrowRight size={16} color="black" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionTitleContainer}>
              <GradientText
                colors={["#10B981", "#059669"]}
                style={styles.sectionTitle}
              >
                Quick Actions
              </GradientText>
            </View>
            
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButtonContainer}
                onPress={() => handleQuickActionPress(action.id)}
                activeOpacity={0.8}
              >
                {action.type === "primary" ? (
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    style={styles.quickActionButton}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: action.iconBg, borderColor: colors.iconBorder }]}>
                      <action.icon size={18} color="black" />
                    </View>
                    <Text style={[styles.quickActionText, { color: "white" }]}>
                      {action.title}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.quickActionButton, styles.secondaryButton, { 
                    backgroundColor: 'transparent',
                    borderColor: colors.iconBorder,
                  }]}>
                    <View style={[styles.actionIconContainer, { backgroundColor: action.iconBg, borderColor: colors.iconBorder }]}>
                      <action.icon size={18} color="black" />
                    </View>
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      {action.title}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  featuresCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitleContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  arrowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionButtonContainer: {
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});