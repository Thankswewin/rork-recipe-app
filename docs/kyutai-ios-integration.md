# Kyutai TTS iOS Integration Guide

## Overview
This guide explains how to integrate Kyutai's low-latency Text-to-Speech into your React Native iOS app using the MLX implementation for on-device inference.

## Architecture

### Current Implementation
- **expo-speech**: Basic TTS with robotic voices
- **Web fallback**: Browser speech synthesis
- **Cross-platform**: Works on iOS, Android, and Web

### Kyutai Integration
- **iOS MLX**: On-device inference using Apple Silicon acceleration
- **Server fallback**: For Android/Web using Rust server
- **Streaming**: Low-latency audio streaming
- **Natural voices**: High-quality, human-like speech

## Integration Steps

### 1. Native Module Setup
Create a React Native native module that wraps the moshi-swift implementation:

```swift
// ios/KyutaiTTS.swift
import Foundation
import React
import MLX

@objc(KyutaiTTS)
class KyutaiTTS: NSObject {
  private var model: TTSModel?
  private var isInitialized = false
  
  @objc
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Load the MLX TTS model
        self.model = try TTSModel.load(modelPath: "kyutai-tts-mlx")
        self.isInitialized = true
        DispatchQueue.main.async {
          resolve(["success": true])
        }
      } catch {
        DispatchQueue.main.async {
          reject("INIT_ERROR", "Failed to initialize Kyutai TTS", error)
        }
      }
    }
  }
  
  @objc
  func synthesize(_ text: String, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard isInitialized, let model = model else {
      reject("NOT_INITIALIZED", "Kyutai TTS not initialized", nil)
      return
    }
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let audioData = try model.synthesize(text: text, options: options)
        DispatchQueue.main.async {
          resolve(["audioData": audioData])
        }
      } catch {
        DispatchQueue.main.async {
          reject("SYNTHESIS_ERROR", "Failed to synthesize speech", error)
        }
      }
    }
  }
}
```

### 2. Model Integration
Download and bundle the MLX model with your app:

```bash
# Download the MLX model
curl -L "https://huggingface.co/kyutai/tts-mlx/resolve/main/model.mlx" -o ios/model.mlx

# Add to Xcode project bundle
```

### 3. React Native Bridge
```typescript
// lib/KyutaiTTSNative.ts
import { NativeModules, Platform } from 'react-native';

interface KyutaiTTSNative {
  initialize(): Promise<{success: boolean}>;
  synthesize(text: string, options: any): Promise<{audioData: string}>;
}

const { KyutaiTTS } = NativeModules;

export default KyutaiTTS as KyutaiTTSNative;
```

## Performance Benefits

### Latency Comparison
- **expo-speech**: 500-1000ms initial delay
- **Kyutai TTS**: 50-100ms initial delay
- **Streaming**: Audio starts playing immediately

### Quality Comparison
- **expo-speech**: Robotic, synthetic voices
- **Kyutai TTS**: Natural, human-like voices
- **Customization**: Multiple voice styles available

## Implementation Status

### ✅ Completed
- Basic TTS service architecture
- Cross-platform fallbacks
- React hooks integration
- UI components

### 🚧 In Progress
- Native module development
- MLX model integration
- Streaming audio playback

### 📋 TODO
- iOS native module
- Model bundling
- Performance optimization
- Voice selection UI

## Usage Example

```typescript
import { useTTS } from '@/hooks/useTTS';

const MyComponent = () => {
  const { speak, isSpeaking } = useTTS({
    lowLatency: true,  // Enables Kyutai on iOS
    streaming: true,   // Enables streaming playback
    voice: 'natural-female'
  });

  const handleSpeak = () => {
    speak("Hello! This is Kyutai's natural-sounding voice.");
  };

  return (
    <TouchableOpacity onPress={handleSpeak}>
      <Text>{isSpeaking ? 'Speaking...' : 'Speak'}</Text>
    </TouchableOpacity>
  );
};
```

## Development Notes

1. **Model Size**: MLX models are ~100-500MB, consider lazy loading
2. **Memory Usage**: Monitor memory usage during synthesis
3. **Battery Impact**: MLX is optimized for efficiency on Apple Silicon
4. **Fallbacks**: Always provide expo-speech fallback for compatibility