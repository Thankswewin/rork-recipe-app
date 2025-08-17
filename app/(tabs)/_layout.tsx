import React, { useMemo, useRef } from "react";
import { Tabs } from "expo-router";
import { Home, Compass, User, Bot } from "lucide-react-native";
import { StyleSheet, View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { AuthGuard } from "@/components/AuthGuard";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarShowLabel: false,
          tabBarStyle: [styles.tabBar, { backgroundColor: colors.gray800 }],
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="assistant"
          options={{
            title: "Assistant",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon icon={Bot} color={color} focused={focused} label="Assistant" testID="tab-assistant" />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon icon={Home} color={color} focused={focused} label="Home" testID="tab-home" />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon icon={Compass} color={color} focused={focused} label="Explore" testID="tab-explore" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon icon={User} color={color} focused={focused} label="Profile" testID="tab-profile" />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

interface TabBarIconProps {
  icon: any;
  color: string;
  focused: boolean;
  label: string;
}

function TabBarIcon({ icon: Icon, color, focused, label, testID }: TabBarIconProps & { testID?: string }) {
  const scaleRef = useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(scaleRef, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleRef]);

  const scale = scaleRef.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <View style={styles.tabIconContainer} testID={testID}>
      {focused ? (
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.activeTabContainer}>
            <Icon size={18} color="white" />
            <Text style={styles.labelText}>{label}</Text>
          </LinearGradient>
        </Animated.View>
      ) : (
        <Icon size={24} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 0,
    borderRadius: 30,
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 0,
    paddingHorizontal: 16,
  },
  tabIconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  labelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});