import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bot, Mic, MessageSquare, Settings, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AssistantScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>
            Choose how you want to interact with our AI
          </Text>
        </View>

        {/* Voice Chat Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/voice-chat')}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Mic size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardBadge}>
                <Zap size={12} color="#10B981" />
                <Text style={styles.badgeText}>Real-time</Text>
              </View>
            </View>
            
            <Text style={styles.cardTitle}>Voice Chat</Text>
            <Text style={styles.cardDescription}>
              Experience natural conversations with Kyutai's advanced voice AI. 
              Ultra-low latency real-time speech interaction.
            </Text>
            
            <View style={styles.cardFeatures}>
              <Text style={styles.featureText}>• Natural speech recognition</Text>
              <Text style={styles.featureText}>• Human-like responses</Text>
              <Text style={styles.featureText}>• Multiple voice options</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Text Chat Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/chef-assistant')}
        >
          <View style={styles.textCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, styles.textCardIcon]}>
                <MessageSquare size={24} color="#3B82F6" />
              </View>
              <View style={[styles.cardBadge, styles.textCardBadge]}>
                <Bot size={12} color="#6B7280" />
                <Text style={[styles.badgeText, styles.textBadgeText]}>Smart</Text>
              </View>
            </View>
            
            <Text style={[styles.cardTitle, styles.textCardTitle]}>Chef Assistant</Text>
            <Text style={[styles.cardDescription, styles.textCardDescription]}>
              Get cooking help, recipe suggestions, and culinary guidance 
              through our intelligent text-based assistant.
            </Text>
            
            <View style={styles.cardFeatures}>
              <Text style={[styles.featureText, styles.textFeatureText]}>• Recipe recommendations</Text>
              <Text style={[styles.featureText, styles.textFeatureText]}>• Cooking instructions</Text>
              <Text style={[styles.featureText, styles.textFeatureText]}>• Ingredient substitutions</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Coming Soon Cards */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonHeader}>
              <Settings size={20} color="#9CA3AF" />
              <Text style={styles.comingSoonTitle}>Advanced Settings</Text>
            </View>
            <Text style={styles.comingSoonDescription}>
              Customize AI behavior, voice preferences, and conversation styles
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  card: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 24,
  },
  textCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCardIcon: {
    backgroundColor: '#EFF6FF',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
  },
  textCardBadge: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textBadgeText: {
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textCardTitle: {
    color: '#111827',
  },
  cardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 16,
  },
  textCardDescription: {
    color: '#6B7280',
  },
  cardFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  textFeatureText: {
    color: '#9CA3AF',
  },
  comingSoonSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  comingSoonCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});