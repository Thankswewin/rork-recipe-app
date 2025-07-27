import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import {
  X,
  Search,
  Star,
  Users,
  ChefHat,
  Plus,
  Crown,
  Globe,
  Lock,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Chef } from '../../stores/chatStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ChefSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (chef: Chef) => void;
  currentChefId?: string;
}

const DEFAULT_CHEFS: Chef[] = [
  {
    id: 'default',
    name: 'Chef Adunni',
    description: 'Your friendly AI cooking assistant with expertise in global cuisines and cooking techniques.',
    avatar: '👨‍🍳',
    specialty: 'General Cooking',
    specialties: ['General Cooking', 'Recipe Development', 'Cooking Techniques'],
    rating: 4.8,
    usageCount: 15420,
    isDefault: true,
    isPublic: true,
    personality: 'Helpful, encouraging, and knowledgeable with a friendly and supportive style'
  },
  {
    id: 'italian',
    name: 'Chef Marco',
    description: 'Passionate Italian chef specializing in authentic pasta, pizza, and regional Italian dishes.',
    avatar: '🇮🇹',
    specialty: 'Italian Cuisine',
    specialties: ['Italian Cuisine', 'Pasta Making', 'Pizza', 'Wine Pairing'],
    rating: 4.9,
    usageCount: 8930,
    isDefault: false,
    isPublic: true,
    personality: 'Passionate, traditional, and detailed with an enthusiastic and authentic style'
  },
  {
    id: 'asian',
    name: 'Chef Sakura',
    description: 'Expert in Asian cuisines including Japanese, Chinese, Thai, and Korean cooking.',
    avatar: '🌸',
    specialty: 'Asian Cuisine',
    specialties: ['Asian Cuisine', 'Sushi', 'Stir-fry', 'Fermentation'],
    rating: 4.7,
    usageCount: 12100,
    isDefault: false,
    isPublic: true,
    personality: 'Precise, mindful, and creative with a calm and methodical style'
  },
  {
    id: 'healthy',
    name: 'Chef Wellness',
    description: 'Nutrition-focused chef specializing in healthy, balanced meals and dietary accommodations.',
    avatar: '🥗',
    specialty: 'Healthy Cooking',
    specialties: ['Healthy Cooking', 'Nutrition', 'Dietary Restrictions', 'Meal Prep'],
    rating: 4.6,
    usageCount: 9850,
    isDefault: false,
    isPublic: true,
    personality: 'Health-conscious, informative, and supportive with an educational and motivating style'
  },
  {
    id: 'baking',
    name: 'Chef Patissier',
    description: 'Master baker and pastry chef with expertise in breads, cakes, and delicate desserts.',
    avatar: '🧁',
    specialty: 'Baking',
    specialties: ['Baking', 'Pastry', 'Desserts', 'Bread Making'],
    rating: 4.9,
    usageCount: 7200,
    isDefault: false,
    isPublic: true,
    isPremium: true,
    personality: 'Precise, creative, and patient with a detailed and encouraging style'
  },
  {
    id: 'quick',
    name: 'Chef Express',
    description: 'Speed cooking specialist for busy lifestyles. Quick, easy, and delicious meals in 30 minutes or less.',
    avatar: '⚡',
    specialty: 'Quick Meals',
    specialties: ['Quick Meals', '30-Minute Recipes', 'One-Pot Dishes', 'Meal Planning'],
    rating: 4.5,
    usageCount: 18500,
    isDefault: false,
    isPublic: true,
    personality: 'Efficient, practical, and energetic with a fast-paced and solution-focused style'
  }
];

export function ChefSelector({ visible, onClose, onSelect, currentChefId }: ChefSelectorProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chefs, setChefs] = useState<Chef[]>(DEFAULT_CHEFS);
  const [filteredChefs, setFilteredChefs] = useState<Chef[]>(DEFAULT_CHEFS);

  const categories = [
    { id: 'all', name: 'All Chefs', icon: '👥' },
    { id: 'default', name: 'Default', icon: '⭐' },
    { id: 'popular', name: 'Popular', icon: '🔥' },
    { id: 'premium', name: 'Premium', icon: '👑' },
    { id: 'community', name: 'Community', icon: '🌍' },
  ];

  useEffect(() => {
    filterChefs();
  }, [searchQuery, selectedCategory, chefs]);

  const filterChefs = () => {
    let filtered = [...chefs];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(chef => 
        chef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chef.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chef.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by category
    switch (selectedCategory) {
      case 'default':
        filtered = filtered.filter(chef => chef.isDefault);
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);
        break;
      case 'premium':
        filtered = filtered.filter(chef => chef.isPremium);
        break;
      case 'community':
        filtered = filtered.filter(chef => !chef.isDefault && chef.creator);
        break;
    }

    setFilteredChefs(filtered);
  };

  const handleChefSelect = (chef: Chef) => {
    onSelect(chef);
    onClose();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={12} color="#F59E0B" fill="#F59E0B" style={{ opacity: 0.5 }} />
      );
    }

    return stars;
  };

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderChefCard = (chef: Chef) => (
    <TouchableOpacity
      key={chef.id}
      style={[
        styles.chefCard,
        currentChefId === chef.id && styles.selectedChefCard
      ]}
      onPress={() => handleChefSelect(chef)}
    >
      <LinearGradient
        colors={currentChefId === chef.id ? ['#3B82F6', '#1D4ED8'] : ['#1F2937', '#111827']}
        style={styles.chefCardGradient}
      >
        {/* Chef Avatar and Status */}
        <View style={styles.chefHeader}>
          <View style={styles.chefAvatarContainer}>
            <Text style={styles.chefAvatar}>{chef.avatar}</Text>
            {chef.isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#F59E0B" />
              </View>
            )}
            {chef.isDefault && (
              <View style={styles.defaultBadge}>
                <Zap size={12} color="#10B981" />
              </View>
            )}
          </View>
          
          <View style={styles.chefInfo}>
            <Text style={[
              styles.chefName,
              currentChefId === chef.id && styles.selectedChefName
            ]}>
              {chef.name}
            </Text>
            
            <View style={styles.chefRating}>
              <View style={styles.starsContainer}>
                {renderStars(chef.rating)}
              </View>
              <Text style={styles.ratingText}>{chef.rating}</Text>
              <View style={styles.usageContainer}>
                <Users size={10} color="#6B7280" />
                <Text style={styles.usageText}>{formatUsageCount(chef.usageCount)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Description */}
        <Text style={[
          styles.chefDescription,
          currentChefId === chef.id && styles.selectedChefDescription
        ]}>
          {chef.description}
        </Text>
        
        {/* Specialties */}
        <View style={styles.specialtiesContainer}>
          {chef.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={[
              styles.specialtyTag,
              currentChefId === chef.id && styles.selectedSpecialtyTag
            ]}>
              <Text style={[
                styles.specialtyText,
                currentChefId === chef.id && styles.selectedSpecialtyText
              ]}>
                {specialty}
              </Text>
            </View>
          ))}
          {chef.specialties.length > 3 && (
            <Text style={styles.moreSpecialties}>+{chef.specialties.length - 3} more</Text>
          )}
        </View>
        
        {/* Personality Traits */}
        {chef.personality && (
          <View style={styles.personalityContainer}>
            <Text style={styles.personalityLabel}>Personality:</Text>
            <Text style={[
              styles.personalityText,
              currentChefId === chef.id && styles.selectedPersonalityText
            ]}>
              {chef.personality}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ChefHat size={24} color="#3B82F6" />
            <Text style={styles.headerTitle}>Choose Your Chef</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chefs by name, specialty, or cuisine..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Chefs List */}
        <ScrollView 
          style={styles.chefsContainer}
          contentContainerStyle={styles.chefsContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredChefs.length > 0 ? (
            filteredChefs.map(renderChefCard)
          ) : (
            <View style={styles.emptyState}>
              <ChefHat size={48} color="#6B7280" />
              <Text style={styles.emptyStateTitle}>No chefs found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Create Custom Chef Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.createChefButton}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.createChefGradient}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createChefText}>Create Custom Chef</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F3F4F6',
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedCategoryButton: {
    backgroundColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F3F4F6',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  chefsContainer: {
    flex: 1,
  },
  chefsContent: {
    padding: 20,
  },
  chefCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedChefCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  chefCardGradient: {
    padding: 20,
  },
  chefHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chefAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  chefAvatar: {
    fontSize: 48,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 4,
  },
  defaultBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 4,
  },
  chefInfo: {
    flex: 1,
  },
  chefName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  selectedChefName: {
    color: '#FFFFFF',
  },
  chefRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginRight: 12,
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  chefDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectedChefDescription: {
    color: '#E5E7EB',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedSpecialtyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  specialtyText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  selectedSpecialtyText: {
    color: '#FFFFFF',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  personalityContainer: {
    marginTop: 8,
  },
  personalityLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  personalityText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  selectedPersonalityText: {
    color: '#D1D5DB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  createChefButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createChefGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createChefText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});