import { Stack } from "expo-router";

export default function ChefAssistantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}