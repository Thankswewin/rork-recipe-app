import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import {
  cardStyles,
  shadows,
  spacing,
  borderRadius,
} from '@/constants/designSystem';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact' | 'elevated';
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  shadow?: boolean;
  border?: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  padding,
  shadow = false,
  border = true,
  disabled = false,
}) => {
  const { colors } = useTheme();
  
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'compact':
        return {
          ...cardStyles.compact,
          backgroundColor: colors.cardBackground,
          borderColor: border ? colors.border : 'transparent',
        };
      case 'elevated':
        return {
          ...cardStyles.base,
          backgroundColor: colors.cardBackground,
          borderColor: border ? colors.border : 'transparent',
          ...shadows.lg,
        };
      default:
        return {
          ...cardStyles.base,
          backgroundColor: colors.cardBackground,
          borderColor: border ? colors.border : 'transparent',
        };
    }
  };
  
  const cardStyle: ViewStyle = {
    ...getVariantStyles(),
    ...(shadow && variant !== 'elevated' && shadows.md),
    ...(padding && { padding: spacing[padding] }),
    opacity: disabled ? 0.6 : 1,
  };
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});