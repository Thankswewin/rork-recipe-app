import React, { useMemo, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  Animated,
  Platform,
  GestureResponderEvent,
  AccessibilityRole,
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
  onLongPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  shadow?: boolean;
  children?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
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
  onLongPress,
  style,
  textStyle,
  fullWidth = false,
  shadow = false,
  children,
  testID,
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const { colors, isDark } = useTheme();

  const variantStyle = buttonVariants[variant];
  const sizeStyle = buttonSizes[size];

  const pressAnim = useRef(new Animated.Value(0)).current;

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98],
  });

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (e?: GestureResponderEvent) => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const defaultIconSize = useMemo(() => (
    iconSize || ({
      sm: 16,
      md: 18,
      lg: 20,
      icon: 20,
      iconLg: 24,
    } as const)[size]
  ), [iconSize, size]);

  const buttonColors = useMemo(() => {
    if (disabled) {
      return {
        backgroundColor: isDark ? colorPalette.gray[700] : colorPalette.gray[300],
        color: isDark ? colorPalette.gray[500] : colorPalette.gray[500],
        borderColor: 'transparent',
      } as const;
    }

    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.tint, color: '#FFFFFF', borderColor: 'transparent' } as const;
      case 'secondary':
        return { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border } as const;
      case 'outline':
        return { backgroundColor: 'transparent', color: colors.tint, borderColor: colors.tint } as const;
      case 'ghost':
        return { backgroundColor: 'transparent', color: colors.text, borderColor: 'transparent' } as const;
      case 'success':
        return { backgroundColor: colorPalette.green[500], color: '#FFFFFF', borderColor: 'transparent' } as const;
      case 'purple':
        return { backgroundColor: colorPalette.purple[500], color: '#FFFFFF', borderColor: 'transparent' } as const;
      default:
        return variantStyle as unknown as { backgroundColor: string; color: string; borderColor: string };
    }
  }, [disabled, isDark, variant, colors.tint, colors.inputBackground, colors.text, colors.border, variantStyle]);

  const computedGradient = useMemo((): string[] => {
    if (gradientColors && gradientColors.length > 0) return gradientColors;
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
  }, [gradientColors, variant, buttonColors.backgroundColor]);

  const containerBase: ViewStyle = {
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
    fontSize: (sizeStyle as { fontSize?: number }).fontSize ?? typography.base,
    fontWeight: typography.weights.semibold,
    ...textStyle,
  };

  const iconElement = Icon ? (
    <Icon size={defaultIconSize} color={buttonColors.color} />
  ) : null;

  const textElement = title ? (
    <Text style={textStyleComputed} numberOfLines={1}>
      {title}
    </Text>
  ) : null;

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={buttonColors.color} />;
    }

    if (children) {
      if (typeof children === 'string') {
        return <Text style={textStyleComputed}>{children}</Text>;
      }
      return children;
    }

    if (Icon && title) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {iconPosition === 'left' && iconElement}
          {textElement}
          {iconPosition === 'right' && iconElement}
        </View>
      );
    }

    return iconElement || textElement;
  };

  const animatedStyle = { transform: [{ scale }] } as const;

  const commonTouchableProps = {
    onPress,
    onLongPress,
    disabled: disabled || loading,
    activeOpacity: 0.8,
    testID,
    accessibilityLabel: accessibilityLabel ?? title,
    accessibilityRole,
  } as const;

  if (gradient && !disabled) {
    return (
      <Animated.View style={[animatedStyle, { borderRadius: (sizeStyle as { borderRadius?: number }).borderRadius ?? 8 }]}>
        <TouchableOpacity
          {...commonTouchableProps}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[{ borderRadius: (sizeStyle as { borderRadius?: number }).borderRadius ?? 8 }, style]}
        >
          <LinearGradient
            colors={computedGradient as [string, string, ...string[]]}
            style={[containerBase, { backgroundColor: 'transparent' }]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        {...commonTouchableProps}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerBase, style]}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({});