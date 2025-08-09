import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Filter, Search as SearchIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/constants/designSystem';

interface HeaderProps {
  title?: string;
  canGoBack?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onChangeSearchText?: (text: string) => void;
  rightActionIcon?: 'filter' | 'none';
  onRightActionPress?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  canGoBack,
  onBackPress,
  showSearch = false,
  searchPlaceholder = 'Search...',
  searchValue,
  onChangeSearchText,
  rightActionIcon = 'none',
  onRightActionPress,
  containerStyle,
  titleStyle,
  testID,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const RightIcon = useMemo(() => {
    if (rightActionIcon === 'filter') return Filter;
    return null;
  }, [rightActionIcon]);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }, containerStyle]} testID={testID}>
      <View style={styles.topRow}>
        {canGoBack ? (
          <Button
            variant="outline"
            size="icon"
            icon={ArrowLeft}
            onPress={onBackPress ?? (() => router.back())}
            accessibilityLabel="Go back"
            testID="header-back"
          />
        ) : (
          <View style={{ width: 40, height: 40 }} />
        )}

        {!!title && (
          <Text style={[styles.title, { color: colors.text }, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}

        <View style={styles.rightGroup}>
          {RightIcon && (
            <Button
              variant="outline"
              size="icon"
              icon={RightIcon}
              onPress={onRightActionPress}
              accessibilityLabel="Open filters"
              testID="header-filter"
              style={{ marginRight: spacing.sm }}
            />
          )}
          <ThemeToggle />
        </View>
      </View>

      {showSearch && (
        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}> 
          <SearchIcon size={18} color={colors.muted} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={searchValue}
            onChangeText={onChangeSearchText}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            testID="header-search-input"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.weights.bold,
    maxWidth: '60%',
    textAlign: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
  },
});

export default Header;
