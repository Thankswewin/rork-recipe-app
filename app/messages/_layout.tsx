// This layout has been removed as messaging functionality is no longer needed
import { Stack } from "expo-router";

export default function RemovedMessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}