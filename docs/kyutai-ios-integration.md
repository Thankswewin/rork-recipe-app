# Kyutai TTS iOS Integration Guide

This guide explains how to integrate Kyutai's low-latency Text-to-Speech into your React Native iOS app.

## Overview

Kyutai TTS offers ultra-low latency speech synthesis using their MLX implementation for Apple Silicon. This integration provides:

- **~50ms first audio latency**
- **Streaming audio output**
- **On-device inference** (no internet required)
- **High-quality natural voice**

## Prerequisites

1. **iOS Device**: iPhone with A12 Bionic or newer (for optimal MLX performance)
2. **Xcode**: Latest version with iOS 15+ deployment target
3. **React Native**: 0.70+ with Expo SDK 50+
4. **MLX Framework**: Apple's machine learning framework

## Integration Steps

### 1. Install MLX Dependencies

```bash
# Install moshi-mlx package
pip install moshi-mlx

# Or using uv
uv add moshi-mlx
```

### 2. Download Kyutai Models

```bash
# Download the MLX-optimized model
python -c "
from moshi_mlx import load_model
model = load_model('kyutai/stt-1b-en_fr-mlx')
print('Model downloaded successfully')
"
```

### 3. Create Native iOS Module

Create a new native module to bridge Kyutai TTS with React Native:

#### 3.1 Create the Native Module Files

**KyutaiTTS.h**
```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface KyutaiTTS : RCTEventEmitter <RCTBridgeModule>
@end
```

**KyutaiTTS.m**
```objc
#import "KyutaiTTS.h"
#import <MLCompute/MLCompute.h>

@implementation KyutaiTTS

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onTTSStart", @"onTTSChunk", @"onTTSComplete", @"onTTSError"];
}

RCT_EXPORT_METHOD(synthesize:(NSString *)text
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            // Initialize MLX model (this would be the actual implementation)
            [self sendEventWithName:@"onTTSStart" body:@{@"text": text}];
            
            // Process text through Kyutai model
            // This is where you'd integrate with the moshi-swift codebase
            NSData *audioData = [self processTextWithKyutai:text options:options];
            
            if (audioData) {
                [self sendEventWithName:@"onTTSComplete" body:@{
                    @"audioData": [audioData base64EncodedStringWithOptions:0],
                    @"format": @"wav"
                }];
                resolve(@{@"success": @YES});
            } else {
                reject(@"TTS_ERROR", @"Failed to synthesize audio", nil);
            }
        } @catch (NSException *exception) {
            reject(@"TTS_ERROR", exception.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(synthesizeStreaming:(NSString *)text
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            [self sendEventWithName:@"onTTSStart" body:@{@"text": text}];
            
            // Stream audio chunks as they're generated
            [self processTextStreamingWithKyutai:text options:options];
            
            resolve(@{@"success": @YES});
        } @catch (NSException *exception) {
            reject(@"TTS_ERROR", exception.reason, nil);
        }
    });
}

- (NSData *)processTextWithKyutai:(NSString *)text options:(NSDictionary *)options {
    // This would integrate with the actual Kyutai MLX implementation
    // For now, return nil to indicate not implemented
    return nil;
}

- (void)processTextStreamingWithKyutai:(NSString *)text options:(NSDictionary *)options {
    // This would handle streaming synthesis
    // Emit chunks as they're generated:
    // [self sendEventWithName:@"onTTSChunk" body:@{@"chunk": chunkData}];
}

@end
```

### 4. Integrate moshi-swift

Clone and integrate the moshi-swift repository:

```bash
git clone https://github.com/kyutai-labs/moshi-swift.git
```

Add the Swift files to your iOS project and modify the native module to use them.

### 5. Update React Native TTS Service

Modify your TTS service to use the native module:

```typescript
// lib/kyutai-native.ts
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { KyutaiTTS } = NativeModules;
const kyutaiEmitter = new NativeEventEmitter(KyutaiTTS);

export class KyutaiNativeTTS {
  private eventListeners: any[] = [];

  async synthesize(text: string, options: any = {}) {
    if (Platform.OS !== 'ios') {
      throw new Error('Kyutai native TTS only available on iOS');
    }

    return new Promise((resolve, reject) => {
      const startListener = kyutaiEmitter.addListener('onTTSStart', () => {
        options.onStart?.();
      });

      const completeListener = kyutaiEmitter.addListener('onTTSComplete', (data) => {
        this.cleanup();
        options.onComplete?.(data);
        resolve(data);
      });

      const errorListener = kyutaiEmitter.addListener('onTTSError', (error) => {
        this.cleanup();
        options.onError?.(error);
        reject(error);
      });

      this.eventListeners = [startListener, completeListener, errorListener];

      KyutaiTTS.synthesize(text, options)
        .catch((error: any) => {
          this.cleanup();
          reject(error);
        });
    });
  }

  async synthesizeStreaming(text: string, options: any = {}) {
    if (Platform.OS !== 'ios') {
      throw new Error('Kyutai native TTS only available on iOS');
    }

    const chunkListener = kyutaiEmitter.addListener('onTTSChunk', (data) => {
      options.onChunk?.(data);
    });

    this.eventListeners.push(chunkListener);

    return this.synthesize(text, options);
  }

  private cleanup() {
    this.eventListeners.forEach(listener => listener.remove());
    this.eventListeners = [];
  }
}

export const kyutaiNative = new KyutaiNativeTTS();
```

### 6. Update Main TTS Service

```typescript
// lib/tts.ts (update the speakKyutaiMLX method)
import { kyutaiNative } from './kyutai-native';

private async speakKyutaiMLX(text: string, options: KyutaiTTSOptions) {
  try {
    await kyutaiNative.synthesizeStreaming(text, {
      streaming: options.streaming,
      rate: options.rate,
      pitch: options.pitch,
      onStart: options.onStart,
      onChunk: (data: any) => {
        // Handle streaming audio chunks
        console.log('Received audio chunk:', data);
      },
      onComplete: (data: any) => {
        // Play the complete audio
        this.playAudioData(data.audioData, options);
      },
      onError: options.onError,
    });
  } catch (error) {
    console.error('MLX TTS Error:', error);
    throw error;
  }
}
```

## Performance Optimization

### Model Quantization

For better performance on mobile devices:

```python
# Quantize the model for faster inference
python scripts/tts_mlx.py text_input.txt output.wav --quantize 8
```

### Memory Management

- Load models lazily
- Implement model caching
- Use background queues for processing
- Clean up resources after use

## Testing

1. **Test on Device**: MLX requires actual iOS hardware
2. **Performance Testing**: Measure latency and memory usage
3. **Fallback Testing**: Ensure graceful fallback to expo-speech

```typescript
// Test the integration
import { ttsService } from '@/lib/tts';

const testKyutaiTTS = async () => {
  try {
    await ttsService.speak("Hello from Kyutai TTS!", {
      lowLatency: true,
      streaming: true,
      onStart: () => console.log('TTS started'),
      onDone: () => console.log('TTS completed'),
      onError: (error) => console.error('TTS error:', error),
    });
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## Deployment Considerations

1. **App Size**: MLX models can be large (1-2GB)
2. **Device Compatibility**: Requires A12+ for optimal performance
3. **Battery Usage**: On-device inference uses more power
4. **Privacy**: All processing happens on-device (no data sent to servers)

## Troubleshooting

### Common Issues

1. **Model Loading Fails**
   - Check device storage space
   - Verify model file integrity
   - Ensure iOS version compatibility

2. **Poor Performance**
   - Use model quantization
   - Check device thermal state
   - Optimize batch sizes

3. **Memory Issues**
   - Implement proper cleanup
   - Use background processing
   - Monitor memory usage

### Debug Mode

Enable debug logging:

```typescript
// Enable debug mode in development
if (__DEV__) {
  ttsService.setDebugMode(true);
}
```

## Next Steps

1. **Implement the native module** with actual moshi-swift integration
2. **Add model management** (download, cache, update)
3. **Optimize performance** for your specific use case
4. **Add voice customization** options
5. **Implement offline capabilities**

## Resources

- [Kyutai TTS GitHub](https://github.com/kyutai-labs/delayed-streams-modeling)
- [moshi-swift Repository](https://github.com/kyutai-labs/moshi-swift)
- [MLX Documentation](https://ml-explore.github.io/mlx/)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-ios)

---

This integration provides cutting-edge TTS capabilities with minimal latency, perfect for real-time cooking assistance and interactive voice applications.