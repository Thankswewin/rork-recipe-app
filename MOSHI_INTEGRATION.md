# Moshi Voice Chat Integration

This document describes the integration of Moshi voice chat functionality into the Rork Recipe App.

## Overview

The app now includes Moshi voice chat capabilities through the following components:
- **MoshiInterface**: Main voice chat interface
- **MoshiSettings**: Configuration panel for Moshi settings
- **MoshiClient**: WebSocket client for communicating with Moshi server
- **MoshiStore**: State management for Moshi functionality

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Moshi Server

The app is configured to connect to your RunPod Moshi server:
- **Default URL**: `wss://9lwbtc0ch3pawy-8998.proxy.runpod.net/ws`
- **Port**: 8998

Make sure your Moshi server is running on RunPod with the command:
```bash
python -m moshi.server --host 0.0.0.0 --port 8998
```

## Usage

### Voice Chat Tab
Navigate to the "Voice Chat" tab to access the Moshi interface:
- **Connect**: Tap the connect button to establish connection with Moshi server
- **Record**: Hold the microphone button to record voice messages
- **Settings**: Tap the settings icon to configure audio and connection settings

### Unmute Tab
The "Unmute" tab has been updated to use the same Moshi interface for consistency.

## Configuration

### Audio Settings
- **Sample Rate**: 24000 Hz (default)
- **Channels**: 1 (mono)
- **Bit Depth**: 16-bit
- **Push to Talk**: Enable/disable push-to-talk mode

### Connection Settings
- **Server URL**: Configure the Moshi server WebSocket URL
- **Auto-connect**: Automatically connect when the interface loads

## Features

### Real-time Voice Chat
- Bidirectional audio communication with Moshi AI
- Real-time audio streaming
- Voice activity detection

### Message History
- View conversation history
- Text and audio message support
- Timestamp tracking

### Debug Mode
- Connection status monitoring
- Error logging
- WebSocket event tracking

## Troubleshooting

### Connection Issues
1. Verify the Moshi server is running on RunPod
2. Check the server URL in settings
3. Ensure port 8998 is exposed in RunPod configuration
4. Try switching between HTTP and HTTPS protocols

### Audio Issues
1. Check microphone permissions
2. Verify audio settings (sample rate, channels)
3. Test with different devices
4. Enable debug mode to see audio events

### Performance
- The app uses efficient WebSocket communication
- Audio is streamed in real-time with minimal latency
- State management is optimized with Zustand

## File Structure

```
app/
├── (tabs)/
│   └── unmute.tsx          # Updated to use Moshi
├── voice-chat/
│   └── index.tsx           # Updated to use Moshi
components/
├── moshi/
│   ├── MoshiInterface.tsx  # Main interface
│   └── MoshiSettings.tsx   # Settings panel
lib/
└── moshi-client.ts         # WebSocket client
stores/
└── moshiStore.ts          # State management
```

## API Reference

### MoshiStore
```typescript
interface MoshiStore {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  
  // Audio state
  isRecording: boolean;
  
  // Messages
  messages: MoshiMessage[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendMessage: (text: string) => void;
}
```

### MoshiClient
```typescript
class MoshiClient {
  connect(url: string): Promise<void>;
  disconnect(): void;
  startRecording(): Promise<void>;
  stopRecording(): void;
  sendTextMessage(text: string): void;
}
```

## Next Steps

1. **Install dependencies**: Run `npm install` to add the WebSocket library
2. **Test connection**: Launch the app and test the Moshi connection
3. **Customize settings**: Adjust audio and connection settings as needed
4. **Deploy**: Build and deploy your app with Moshi integration

The integration is now complete and ready for use!