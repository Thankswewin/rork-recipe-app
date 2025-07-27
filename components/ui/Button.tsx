import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import {
  buttonVariants,
  buttonSizes,
  shadows,
  colorPalette,
  spacing,
  typography,
  type ButtonVariant,
  type ButtonSize,
} from '@/constants/designSystem';

interface ButtonProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  shadow?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  iconSize,
  loading = false,
  disabled = false,
  gradient = false,
  gradientColors,
  onPress,
  style,
  textStyle,
  fullWidth = false,
  shadow = false,
  children,
}) => {
  const { colors, isDark } = useTheme();
  
  const variantStyle = buttonVariants[variant];
  const sizeStyle = buttonSizes[size];
  
  // Determine icon size based on button size
  const defaultIconSize = iconSize || {
    sm: 16,
    md: 18,
    lg: 20,
    icon: 20,
    iconLg: 24,
  }[size];
  
  // Determine colors based on theme and variant
  const getButtonColors = () => {
    if (disabled) {
      return {
        backgroundColor: isDark ? colorPalette.gray[700] : colorPalette.gray[300],
        color: isDark ? colorPalette.gray[500] : colorPalette.gray[500],
        borderColor: 'transparent',
      };
    }
    
    // Use theme colors for better dark mode support
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.tint,
          color: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.tint,
          borderColor: colors.tint,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.text,
          borderColor: 'transparent',
        };
      case 'success':
        return {
          backgroundColor: colorPalette.green[500],
          color: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'purple':
        return {
          backgroundColor: colorPalette.purple[500],
          color: '#FFFFFF',
          borderColor: 'transparent',
        };
      default:
        return variantStyle;
    }
  };
  
  const buttonColors = getButtonColors();
  
  // Gradient colors based on variant
  const getGradientColors = (): string[] => {
    if (gradientColors) return gradientColors;
    
    switch (variant) {
      case 'primary':
        return [colorPalette.primary[500], colorPalette.primary[600]];
      case 'purple':
        return [colorPalette.purple[500], colorPalette.purple[600]];
      case 'success':
        return [colorPalette.green[500], colorPalette.green[600]];
      default:
        return [buttonColors.backgroundColor, buttonColors.backgroundColor];
    }
  };
  
  const buttonStyle: ViewStyle = {
    ...sizeStyle,
    backgroundColor: gradient ? 'transparent' : buttonColors.backgroundColor,
    borderColor: buttonColors.borderColor,
    borderWidth: variant === 'outline' ? 1 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    ...(shadow && shadows.md),
  };
  
  const textStyleComputed: TextStyle = {
    color: buttonColors.color,
    fontSize: (sizeStyle as any).fontSize || typography.base,
    fontWeight: typography.weights.semibold,
    ...textStyle,
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={buttonColors.color} 
        />
      );
    }
    
    const iconElement = Icon && (
      <Icon 
        size={defaultIconSize} 
        color={buttonColors.color} 
      />
    );
    
    const textElement = title && (
      <Text style={textStyleComputed}>
        {title}
      </Text>
    );
    
    if (children) {
      return children;
    }
    
    if (Icon && title) {
      return (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          {iconPosition === 'left' && iconElement}
          {textElement}
          {iconPosition === 'right' && iconElement}
        </View>
      );
    }
    
    return iconElement || textElement;
  };
  
  const ButtonContent = () => (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
  
  if (gradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[{ borderRadius: sizeStyle.borderRadius }, style]}
      >
        <LinearGradient
          colors={getGradientColors() as [string, string, ...string[]]}
          style={[buttonStyle, { backgroundColor: 'transparent' }]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return <ButtonContent />;
};

const styles = StyleSheet.create({
  // Additional styles if needed
});