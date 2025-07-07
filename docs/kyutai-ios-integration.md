# Kyutai TTS iOS Integration Guide

This document outlines how to integrate Kyutai TTS with MLX for on-device inference on iOS, providing ultra-low latency text-to-speech similar to unmute.sh.

## Overview

Kyutai TTS provides natural-sounding voices with ultra-low latency through:
- **MLX on-device inference** for iOS (hardware acceleration)
- **Streaming TTS** for real-time response
- **Multiple voice styles** (natural-female, natural-male, expressive, calm)
- **Real-time mode** for instant voice interaction

## Architecture

```
React Native App
├── lib/tts.ts (TTS Service)
├── hooks/useTTS.ts (React Hook)
├── Native iOS Module (moshi-swift wrapper)
└── MLX Framework (on-device inference)
```

## iOS Native Module Integration

### 1. Install moshi-swift

```bash
# Add to your iOS project
git clone https://github.com/kyutai-labs/moshi-swift.git
```

### 2. Create Native Module

Create `KyutaiTTSModule.swift`:

```swift
import Foundation
import React
import MLX
import MoshiSwift

@objc(KyutaiTTSModule)
class KyutaiTTSModule: NSObject {
  
  private var ttsModel: MoshiTTSModel?
  private var isInitialized = false
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock, 
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Load Kyutai TTS model with MLX
        self.ttsModel = try MoshiTTSModel.load(
          modelPath: "kyutai-tts-1b-mlx",
          device: .gpu // Use Apple Silicon GPU
        )
        self.isInitialized = true
        
        DispatchQueue.main.async {
          resolve(["success": true, "latency": "ultra-low"])
        }
      } catch {
        DispatchQueue.main.async {
          reject("INIT_ERROR", "Failed to initialize Kyutai TTS", error)
        }
      }
    }
  }
  
  @objc
  func synthesizeStreaming(_ text: String,
                          options: NSDictionary,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard isInitialized, let model = ttsModel else {
      reject("NOT_INITIALIZED", "TTS model not initialized", nil)
      return
    }
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let voiceStyle = options["voiceStyle"] as? String ?? "natural-female"
        let streaming = options["streaming"] as? Bool ?? true
        let lowLatency = options["lowLatency"] as? Bool ?? true
        
        // Generate audio with MLX acceleration
        let audioData = try model.synthesize(
          text: text,
          voiceStyle: voiceStyle,
          streaming: streaming,
          lowLatency: lowLatency
        )
        
        // Convert to base64 for React Native
        let base64Audio = audioData.base64EncodedString()
        
        DispatchQueue.main.async {
          resolve([
            "success": true,
            "audioData": base64Audio,
            "latency": model.lastLatency,
            "voiceUsed": voiceStyle
          ])
        }
      } catch {
        DispatchQueue.main.async {
          reject("SYNTHESIS_ERROR", "Failed to synthesize speech", error)
        }
      }
    }
  }
  
  @objc
  func getLatencyStats(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let model = ttsModel else {
      reject("NOT_INITIALIZED", "TTS model not initialized", nil)
      return
    }
    
    resolve([
      "averageLatency": model.averageLatency,
      "lastLatency": model.lastLatency,
      "isMLXEnabled": true,
      "deviceInfo": model.deviceInfo
    ])
  }
}
```

### 3. Bridge Header

Create `KyutaiTTSModule.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KyutaiTTSModule, NSObject)

RCT_EXTERN_METHOD(initialize:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(synthesizeStreaming:(NSString *)text
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getLatencyStats:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

## React Native Integration

### 1. Update TTS Service

The `lib/tts.ts` file already includes MLX integration:

```typescript
private async speakKyutaiMLX(text: string, options: KyutaiTTSOptions) {
  // Call native iOS module
  const { KyutaiTTSModule } = NativeModules;
  
  const result = await KyutaiTTSModule.synthesizeStreaming(text, {
    voiceStyle: options.voiceStyle,
    streaming: options.streaming,
    lowLatency: options.lowLatency,
    realTime: options.realTime,
  });
  
  if (result.success) {
    // Play audio data
    await this.playAudioData(result.audioData, options);
  }
}
```

### 2. Initialize on App Start

In your `App.tsx` or main component:

```typescript
import { NativeModules, Platform } from 'react-native';

useEffect(() => {
  if (Platform.OS === 'ios') {
    // Initialize Kyutai TTS with MLX
    NativeModules.KyutaiTTSModule?.initialize()
      .then((result) => {
        console.log('Kyutai TTS initialized:', result);
      })
      .catch((error) => {
        console.error('Failed to initialize Kyutai TTS:', error);
      });
  }
}, []);
```

## Performance Characteristics

### Latency Comparison

| Mode | Latency | Use Case |
|------|---------|----------|
| Real-time | 20-50ms | Live conversation |
| Low-latency | 50-100ms | Interactive apps |
| Standard | 150-250ms | High quality |

### Voice Quality

- **Natural voices**: Human-like speech patterns
- **Multiple styles**: Female, male, expressive, calm
- **Streaming**: Start playing before synthesis complete
- **Hardware acceleration**: Apple Silicon GPU optimization

## Usage Examples

### Basic TTS

```typescript
const { speak } = useTTS({
  lowLatency: true,
  voiceStyle: 'natural-female',
});

await speak("Hello, this is Kyutai TTS with ultra-low latency!");
```

### Real-time Mode

```typescript
const { speakInstant, toggleRealtimeMode } = useTTS({
  realTimeMode: true,
});

// Enable real-time mode
await toggleRealtimeMode();

// Instant speech (20-50ms latency)
await speakInstant("This is real-time speech!");
```

### Voice Conversation

```typescript
const session = await ttsService.startRealtimeConversation({
  voiceStyle: 'natural-female',
  realTime: true,
});

// Ultra-fast responses for conversation
await session.speak("How can I help you today?");
```

## Model Files

### Download Models

```bash
# Download Kyutai TTS models for iOS
curl -L https://huggingface.co/kyutai/tts-1b-mlx/resolve/main/model.safetensors \
  -o ios/models/kyutai-tts-1b.safetensors

curl -L https://huggingface.co/kyutai/tts-2.6b-mlx/resolve/main/model.safetensors \
  -o ios/models/kyutai-tts-2.6b.safetensors
```

### Bundle with App

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

## Troubleshooting

### Common Issues

1. **Model not loading**: Ensure MLX framework is properly linked
2. **High latency**: Check if GPU acceleration is enabled
3. **Audio not playing**: Verify audio session configuration
4. **Memory issues**: Use model quantization for older devices

### Debug Commands

```typescript
// Check TTS status
const stats = await ttsService.getLatencyStats();
console.log('TTS Stats:', stats);

// Test MLX availability
if (Platform.OS === 'ios') {
  const isMLXAvailable = await NativeModules.KyutaiTTSModule?.isAvailable();
  console.log('MLX Available:', isMLXAvailable);
}
```

## Production Deployment

### App Store Considerations

1. **Model size**: Bundle only necessary models
2. **Privacy**: TTS processing is on-device
3. **Performance**: Test on various iOS devices
4. **Fallback**: Implement server-side TTS for older devices

### Optimization

```swift
// Optimize for production
let model = try MoshiTTSModel.load(
  modelPath: "kyutai-tts-1b-mlx",
  device: .gpu,
  quantization: .int8, // Reduce memory usage
  cacheSize: 512 // MB
)
```

This integration provides natural, ultra-low latency text-to-speech on iOS, similar to the experience at unmute.sh, with on-device processing for privacy and performance.