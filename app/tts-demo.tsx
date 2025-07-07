import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Volume2, Zap, Settings, Play, Pause, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { TTSPlayer } from '@/components/TTSPlayer';
import BackButton from '@/components/BackButton';
import GradientText from '@/components/GradientText';

const sampleTexts = [
  {
    title: 'Cooking Instructions',
    text: 'Heat the oil in a large pan over medium heat. Add the onions and cook until translucent, about 5 minutes. Then add the garlic and cook for another minute until fragrant.',
    category: 'cooking',
  },
  {
    title: 'Recipe Introduction',
    text: 'Welcome to today\\'s cooking session! We\\'re making a delicious Nigerian Jollof Rice with perfectly seasoned chicken and fresh vegetables. This recipe serves 6 people and takes about 45 minutes.',
    category: 'intro',
  },
  {
    title: 'Safety Tips',
    text: 'Always wash your hands before handling food. Keep raw meat separate from other ingredients. Make sure your cooking oil is at the right temperature before adding ingredients.',
    category: 'safety',
  },
  {
    title: 'Ingredient List',
    text: 'You will need: 2 cups of jasmine rice, 1 pound of chicken, 1 large onion, 3 cloves of garlic, 2 tomatoes, 1 bell pepper, and your favorite spices.',
    category: 'ingredients',
  },
];

export default function TTSDemoScreen() {
  const { colors } = useTheme();
  const [selectedText, setSelectedText] = useState(sampleTexts[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.titleContainer}>
            <GradientText
              colors={['#F59E0B', '#EF4444', '#8B5CF6']}
              style={styles.title}
            >
              TTS DEMO
            </GradientText>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Low Latency Text-to-Speech
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}>
            <View style={[styles.settingsButton, { backgroundColor: '#8B5CF6', borderColor: colors.iconBorder }]}>
              <Settings size={20} color=\"black\" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Feature Highlights */}
          <View style={[styles.featuresContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>🚀 Kyutai TTS Features</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#10B981' }]}>
                  <Zap size={16} color=\"black\" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Ultra Low Latency</Text>
                  <Text style={[styles.featureDescription, { color: colors.muted }]}>
                    Streaming TTS with minimal delay for real-time conversations
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#3B82F6' }]}>
                  <Volume2 size={16} color=\"black\" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>High Quality Voice</Text>
                  <Text style={[styles.featureDescription, { color: colors.muted }]}>
                    Natural sounding speech with proper intonation and rhythm
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#F59E0B' }]}>
                  <Play size={16} color=\"black\" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Streaming Playback</Text>
                  <Text style={[styles.featureDescription, { color: colors.muted }]}>
                    Audio starts playing before the entire text is processed
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sample Text Selector */}
          <View style={[styles.sampleContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.sampleTitle, { color: colors.text }]}>Sample Texts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sampleScroll}>
              {sampleTexts.map((sample, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sampleButton,
                    selectedText.title === sample.title && styles.selectedSample,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedText(sample)}
                >
                  <Text style={[
                    styles.sampleButtonText,
                    selectedText.title === sample.title && styles.selectedSampleText,
                    { color: selectedText.title === sample.title ? 'white' : colors.text }
                  ]}>
                    {sample.title}
                  </Text>
                  <Text style={[
                    styles.sampleCategory,
                    { color: selectedText.title === sample.title ? 'rgba(255,255,255,0.8)' : colors.muted }
                  ]}>
                    {sample.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* TTS Player */}
          <TTSPlayer
            initialText={selectedText.text}
            showControls={true}
            showSettings={showAdvanced}
            lowLatency={true}
          />

          {/* Integration Guide */}
          <View style={[styles.integrationContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.integrationTitle, { color: colors.text }]}>📱 iOS Integration</Text>
            
            <View style={styles.integrationSteps}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>MLX Framework</Text>
                  <Text style={[styles.stepDescription, { color: colors.muted }]}>
                    Use Kyutai's MLX implementation for on-device inference on iPhone
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Swift Integration</Text>
                  <Text style={[styles.stepDescription, { color: colors.muted }]}>
                    Integrate with moshi-swift codebase for native iOS performance
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>React Native Bridge</Text>
                  <Text style={[styles.stepDescription, { color: colors.muted }]}>
                    Create native module bridge for seamless RN integration
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.learnMoreButton}
              onPress={() => Alert.alert(
                'Kyutai TTS Integration',
                'To integrate Kyutai TTS:\\n\\n1. Install moshi-mlx package\\n2. Set up MLX framework\\n3. Create React Native bridge\\n4. Configure streaming audio\\n\\nCheck the GitHub repo for detailed instructions.',
                [{ text: 'Got it!' }]
              )}
            >
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.learnMoreGradient}
              >
                <Text style={styles.learnMoreText}>Learn More</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Performance Stats */}
          <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>⚡ Performance</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>~50ms</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>First Audio</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>3x</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Real-time</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>1B</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Parameters</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  featuresContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sampleContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sampleScroll: {
    flexDirection: 'row',
  },
  sampleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 120,
  },
  selectedSample: {
    backgroundColor: '#3B82F6',
  },
  sampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedSampleText: {
    color: 'white',
  },
  sampleCategory: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  integrationContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  integrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  integrationSteps: {
    gap: 16,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  learnMoreButton: {
    borderRadius: 12,
  },
  learnMoreGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  learnMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
});