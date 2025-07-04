import React from "react";
import { Tabs } from "expo-router";
import { Home, Search, Heart, User, Bot } from "lucide-react-native";
import { StyleSheet, View, Text } from "react-native";
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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={color} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Search} color={color} focused={focused} label="Explore" />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Bot} color={color} focused={focused} label="Assistant" />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Heart} color={color} focused={focused} label="Favorites" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={User} color={color} focused={focused} label="Profile" />
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

function TabBarIcon({ icon: Icon, color, focused, label }: TabBarIconProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.tabIconContainer}>
      {focused ? (
        <LinearGradient
          colors={["#EF4444", "#DC2626"]}
          style={styles.activeTabContainer}
        >
          <Icon size={18} color="white" />
          <Text style={styles.labelText}>{label}</Text>
        </LinearGradient>
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