import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import {
  inputStyles,
  spacing,
  typography,
  borderRadius,
  colorPalette,
} from '@/constants/designSystem';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  variant?: 'default' | 'search';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  style,
  inputStyle,
  disabled = false,
  required = false,
  ...textInputProps
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.sm,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          fontSize: typography.md,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          fontSize: typography.base,
        };
    }
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          borderRadius: borderRadius.xxl,
          backgroundColor: colors.inputBackground,
        };
      default:
        return {
          borderRadius: borderRadius.lg,
          backgroundColor: colors.inputBackground,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  
  const getBorderColor = () => {
    if (error) return colorPalette.primary[500];
    if (isFocused) return colors.tint;
    return colors.border;
  };
  
  const containerStyle: ViewStyle = {
    ...variantStyles,
    borderWidth: 1,
    borderColor: getBorderColor(),
    opacity: disabled ? 0.6 : 1,
  };
  
  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    ...sizeStyles,
  };
  
  const textInputStyle: TextStyle = {
    flex: 1,
    color: colors.text,
    fontSize: sizeStyles.fontSize,
    ...inputStyle,
  };
  
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const iconColor = colors.muted;
  
  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
            {required && (
              <Text style={[styles.required, { color: colorPalette.primary[500] }]}>
                {' *'}
              </Text>
            )}
          </Text>
        </View>
      )}
      
      <View style={[containerStyle]}>
        <View style={inputContainerStyle}>
          {LeftIcon && (
            <View style={styles.leftIconContainer}>
              <LeftIcon size={iconSize} color={iconColor} />
            </View>
          )}
          
          <TextInput
            style={textInputStyle}
            placeholderTextColor={colors.muted}
            editable={!disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...textInputProps}
          />
          
          {RightIcon && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              <RightIcon size={iconSize} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {(error || hint) && (
        <View style={styles.messageContainer}>
          {error ? (
            <Text style={[styles.errorText, { color: colorPalette.primary[500] }]}>
              {error}
            </Text>
          ) : hint ? (
            <Text style={[styles.hintText, { color: colors.muted }]}>
              {hint}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
  },
  required: {
    fontSize: typography.sm,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  messageContainer: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.xs,
    fontWeight: typography.weights.medium,
  },
  hintText: {
    fontSize: typography.xs,
  },
});