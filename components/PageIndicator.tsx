import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

export default function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex 
              ? [styles.activeDot, { backgroundColor: colors.tint }]
              : [styles.inactiveDot, { backgroundColor: colors.tabIconDefault }],
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  dot: {
    marginHorizontal: 3,
    borderRadius: 4,
  },
  activeDot: {
    width: 12,
    height: 4,
  },
  inactiveDot: {
    width: 4,
    height: 4,
  },
});