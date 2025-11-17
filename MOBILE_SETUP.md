# Mobile App Setup Guide

## The `adb` Error Explained

The `adb` (Android Debug Bridge) error appears when trying to run Android-specific commands, but **you don't need it for basic Expo development**.

## Development Options

### Option 1: Use Expo Go App (Recommended - Easiest)

1. **Install Expo Go on your phone:**
   - **iOS**: Download from App Store
   - **Android**: Download from Google Play Store

2. **Start the Expo server:**
   ```powershell
   cd mobile
   npm start
   ```

3. **Connect your phone:**
   - Scan the QR code that appears in the terminal
   - Or use the connection options shown (USB, LAN, etc.)

**No Android SDK or `adb` needed!**

### Option 2: Use Web Version

Run the mobile app in your browser:

```powershell
cd mobile
npm run web
```

This opens the app at `http://localhost:8081` or similar.

### Option 3: Install Android SDK (For Android Emulator)

If you want to run an Android emulator:

1. **Install Android Studio:**
   - Download from: https://developer.android.com/studio
   - Install Android SDK and tools
   - This includes `adb` automatically

2. **Create an Android Virtual Device (AVD):**
   - Open Android Studio
   - Tools → Device Manager → Create Device
   - Choose a device and Android version

3. **Start the emulator:**
   - Launch the AVD from Android Studio
   - Then run: `npm run android`

### Option 4: Use iOS Simulator (Mac Only)

If you're on a Mac:

```powershell
cd mobile
npm run ios
```

This requires Xcode to be installed.

## Recommended Approach

For development and testing, **use Expo Go app** - it's the fastest way to test on a real device without any additional setup.

## Troubleshooting

### "adb not found" Error
- **Solution**: Use Expo Go app or web version instead
- Or install Android Studio if you need emulator

### "Cannot connect to Metro bundler"
- Make sure your phone and computer are on the same WiFi network
- Try using "LAN" connection option in Expo Go
- Or use USB connection with `npm start --tunnel`

### Port Already in Use
- Change the port: `npx expo start --port 8082`
- Or kill the process using the port

## Quick Start

```powershell
# Start Expo development server
cd mobile
npm start

# Then:
# - Scan QR code with Expo Go app (easiest)
# - Or press 'w' to open in web browser
# - Or press 'a' for Android (requires Android Studio)
# - Or press 'i' for iOS (Mac only, requires Xcode)
```

## Notes

- The mobile app connects to the backend API
- Make sure backend is running on `http://localhost:5000`
- For physical devices, update API URL in `mobile/src/api/client.ts` to use your computer's IP address instead of `localhost`

