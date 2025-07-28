# Troubleshooting Guide: Voice & Chat System

This guide will help you diagnose and fix issues with both the voice system (unmute.sh) and chat system in your recipe app.

## Quick Diagnosis Checklist

### 1. Environment Configuration

**Missing .env file**: Your app needs a `.env` file with proper configuration.

**Create `.env` file:**
```bash
# Copy the example file
cp .env.example .env
```

**Edit `.env` with your actual values:**
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend Configuration  
EXPO_PUBLIC_RORK_API_BASE_URL=https://toolkit.rork.com
```

### 2. Chat System Issues

**Problem**: Chat not responding or showing errors

**Diagnosis Steps:**
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try sending a message
4. Check if request to `https://toolkit.rork.com/text/llm/` fails

**Common Issues:**
- **Network Error**: Check internet connection
- **CORS Error**: API endpoint may be down
- **401/403 Error**: Authentication issue
- **500 Error**: Server-side problem

**Solutions:**
- Verify `https://toolkit.rork.com/text/llm/` is accessible
- Check if API requires authentication headers
- Try alternative LLM endpoint if available

### 3. Voice System (Unmute.sh) Issues

**Problem**: Voice recording/playback not working

**Current Configuration:**
- Default server: `ws://localhost:8000/ws`
- Model: `kyutai/moshi-1-7b-8kHz`

**Diagnosis Steps:**

#### Step 1: Check Unmute Server Status
```bash
# Check if unmute server is running locally
curl http://localhost:8000/health

# Or check WebSocket connection
wscat -c ws://localhost:8000/ws
```

#### Step 2: Check App Connection Status
1. Open app → Unmute tab
2. Look for connection status indicator
3. Check debug logs (if available)

#### Step 3: Common Issues & Solutions

**Issue**: "Connection Failed" or "Disconnected"
- **Cause**: Unmute server not running
- **Solution**: Start unmute server or configure different endpoint

**Issue**: "WebSocket connection error"
- **Cause**: Wrong server URL or firewall blocking
- **Solution**: 
  - Verify server URL in app settings
  - Try different port or host
  - Check firewall settings

**Issue**: "Audio permission denied"
- **Cause**: Microphone permissions not granted
- **Solution**: Grant microphone permissions in device settings

### 4. Setting Up Unmute Server

#### Option A: Local Setup
```bash
# Clone unmute repository
git clone https://github.com/kyutai-labs/unmute
cd unmute

# Install dependencies
pip install -r requirements.txt

# Run server
python server.py --host 0.0.0.0 --port 8000
```

#### Option B: RunPod Setup (Recommended)
1. Use the provided `deploy-unmute.ps1` script
2. Follow `RUNPOD_DEPLOYMENT.md` instructions
3. Update app settings with RunPod WebSocket URL

#### Option C: Alternative Voice Service
If unmute.sh is not working, you can use the built-in TTS service:
- Go to app settings
- Disable unmute.sh
- Enable built-in voice features

### 5. Testing Both Systems

#### Test Chat System:
1. Open app → Assistant tab
2. Type a simple message: "Hello"
3. Check if AI responds
4. If no response, check browser console for errors

#### Test Voice System:
1. Open app → Unmute tab
2. Check connection status
3. Try recording a short message
4. Check if transcription appears
5. Check if AI voice response plays

### 6. Debug Mode

**Enable Debug Logging:**
1. Open Unmute tab
2. Look for debug/logs button
3. Enable debug mode
4. Check logs for specific error messages

**Common Debug Messages:**
- `WebSocket connection failed`: Server not reachable
- `Audio permission denied`: Microphone access blocked
- `Model loading failed`: Server-side model issue
- `Network timeout`: Connection or server issue

### 7. Alternative Solutions

#### If Chat System Fails:
- Check if `toolkit.rork.com` is accessible
- Consider using local LLM (Ollama, etc.)
- Implement fallback to different AI service

#### If Voice System Fails:
- Use text-only mode temporarily
- Try different unmute server endpoint
- Use device's built-in speech recognition

### 8. Getting Help

**Collect This Information:**
1. Error messages from browser console
2. Network requests status (success/failed)
3. Unmute connection status
4. Device/platform information
5. Server logs (if running locally)

**Check These Logs:**
- Browser developer console
- App debug logs (Unmute tab)
- Server logs (if running unmute locally)
- Network tab in browser dev tools

### 9. Quick Fixes

**Restart Everything:**
```bash
# Stop development server
# Ctrl+C in terminal

# Clear cache and restart
npm start -- --clear
```

**Reset App State:**
1. Clear app data/cache
2. Restart app
3. Reconfigure settings

**Check Permissions:**
- Microphone access
- Camera access (if using vision features)
- Network access

---

## Next Steps

1. **Create `.env` file** with proper configuration
2. **Test chat system** with a simple message
3. **Check unmute server** status and connection
4. **Enable debug mode** to see detailed error messages
5. **Follow specific solutions** based on error messages

If issues persist, check the debug logs and error messages for more specific guidance.