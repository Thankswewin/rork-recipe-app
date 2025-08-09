import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, ViewStyle, TextStyle } from 'react-native';
import { Button } from '@/components/ui/Button';
import { spacing, borderRadius, colorPalette, animations, typography } from '@/constants/designSystem';

interface SwipeableRowProps {
  children: React.ReactNode;
  rightActionText?: string;
  rightActionColor?: string;
  onRightAction?: () => void;
  leftActionText?: string;
  leftActionColor?: string;
  onLeftAction?: () => void;
  height?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  rightActionText,
  rightActionColor,
  onRightAction,
  leftActionText,
  leftActionColor,
  onLeftAction,
  height = 72,
  style,
  testID,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const openedSide = useRef<'left' | 'right' | null>(null);

  const maxReveal = 120;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        const newX = Math.min(Math.max(gesture.dx, -maxReveal), maxReveal);
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpenRight = gesture.dx < -40 && !!rightActionText;
        const shouldOpenLeft = gesture.dx > 40 && !!leftActionText;
        if (shouldOpenRight) {
          openedSide.current = 'right';
          Animated.timing(translateX, { toValue: -maxReveal, duration: animations.normal, useNativeDriver: true }).start();
        } else if (shouldOpenLeft) {
          openedSide.current = 'left';
          Animated.timing(translateX, { toValue: maxReveal, duration: animations.normal, useNativeDriver: true }).start();
        } else {
          openedSide.current = null;
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handleActionPress = (side: 'left' | 'right') => {
    Animated.timing(translateX, { toValue: 0, duration: animations.normal, useNativeDriver: true }).start(() => {
      if (side === 'right') onRightAction && onRightAction();
      if (side === 'left') onLeftAction && onLeftAction();
    });
  };

  return (
    <View style={[styles.container, { height }, style]} testID={testID}>
      <View style={styles.actionsContainer} pointerEvents="box-none">
        {!!leftActionText && (
          <View style={[styles.action, styles.leftAction, { backgroundColor: leftActionColor ?? colorPalette.green[500] }]}> 
            <Text style={styles.actionText}>{leftActionText}</Text>
          </View>
        )}
        {!!rightActionText && (
          <View style={[styles.action, styles.rightAction, { backgroundColor: rightActionColor ?? colorPalette.primary[600] }]}> 
            <Text style={styles.actionText}>{rightActionText}</Text>
          </View>
        )}
      </View>

      <Animated.View style={[styles.card, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>

      {!!leftActionText && (
        <View style={[StyleSheet.absoluteFill, styles.touchOverlayLeft]} pointerEvents="box-none">
          <Button
            title={leftActionText}
            style={styles.overlayButton}
            onPress={() => handleActionPress('left')}
            variant="ghost"
            testID="swipe-left-action"
          />
        </View>
      )}
      {!!rightActionText && (
        <View style={[StyleSheet.absoluteFill, styles.touchOverlayRight]} pointerEvents="box-none">
          <Button
            title={rightActionText}
            style={styles.overlayButton}
            onPress={() => handleActionPress('right')}
            variant="ghost"
            testID="swipe-right-action"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  leftAction: {
    alignSelf: 'center',
  },
  rightAction: {
    alignSelf: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: typography.base,
  },
  card: {
    backgroundColor: 'transparent',
  },
  touchOverlayLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  touchOverlayRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  overlayButton: {
    backgroundColor: 'transparent',
  },
});

export default SwipeableRow;
