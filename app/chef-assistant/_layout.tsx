import { Stack } from 'expo-router';

export default function ChefAssistantLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="chat" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}