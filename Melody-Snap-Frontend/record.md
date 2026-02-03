# Changelog

## 2026-02-02: Gemini API Integration for Image Analysis

### 1. Gemini Service Implementation
- **Goal**: Implement logic to analyze images using Google Gemini API and extract music styles.
- **Changes**:
  - Created `app/services/geminiService.ts`.
  - Implemented `analyzeImageForMusic` function to convert images to Base64 and call the Gemini API.
  - Defined data interfaces for the API response.
- **Files Affected**:
  - `app/services/geminiService.ts` (New file)

### 2. Dependencies
- **Goal**: Enable file system access to read image files.
- **Changes**:
  - Installed `expo-file-system` package.
- **Files Affected**:
  - `package.json`
  - `package-lock.json`

### 3. Capture Screen Integration
- **Goal**: Connect the UI "Use Photo" button to the analysis service.
- **Changes**:
  - Updated `handleUpload` function in `app/capture.tsx`.
  - Added logic to call `analyzeImageForMusic`.
  - Transformed API results into `setWeightedPrompts` compatible format.
  - Passed generated prompts via route parameters to the next screen.
- **Files Affected**:
  - `app/capture.tsx`

### 4. Environment Configuration
- **Goal**: Securely manage the Gemini API Key.
- **Changes**:
  - Created `.env` file to store `EXPO_PUBLIC_GEMINI_API_KEY`.
  - Updated `.gitignore` to exclude `.env` file from version control.
  - Updated `geminiService.ts` to read the key from `process.env`.
- **Files Affected**:
  - `.env` (New file)
  - `.gitignore`
  - `app/services/geminiService.ts`

### 5. Bug Fixes
- **Goal**: Fix deprecation warnings.
- **Changes**:
  - Updated `FileSystem.readAsStringAsync` encoding option from `FileSystem.EncodingType.Base64` to `'base64'` in `geminiService.ts`.
- **Files Affected**:
  - `app/services/geminiService.ts`

### 6. System Prompt & Logic Updates
- **Goal**: Align Gemini's music generation output with Prompt DJ's vocabulary and data structure.
- **Changes**:
  - Replaced the initial system prompt in `geminiService.ts` with the detailed version from `prompt.md`.
  - Updated prompt constraints: added Allowed Vocabulary List, Weight range (0.0-2.0), and Visual-to-Audio mapping guidelines.
  - Updated API response parsing logic to handle `{ "prompts": [] }` JSON structure.
  - Fixed `promptdj-midi` build errors by installing missing dependencies (`lit`) and configuring `moduleResolution: "node"`.
- **Files Affected**:
  - `app/services/geminiService.ts`
  - `promptdj-midi/tsconfig.json`
  - `promptdj-midi/package.json` (via npm install)

### 7. Native-Web Music Player Integration
- **Goal**: Enable music playback by embedding the Prompt DJ web app into the React Native mobile app via WebView.
- **Changes**:
  - Installed `react-native-webview`.
  - Created `app/player.tsx`: A dedicated screen that hosts the WebView and bridges data (prompts) from Native to Web.
  - Updated `app/LoadingScreen.tsx`: Added navigation logic to forward Gemini results to the Player screen after a simulated delay.
  - Updated `promptdj-midi/index.tsx`: Added a window message listener to receive prompt data from React Native and trigger the music engine (`liveMusicHelper`).
- **Files Affected**:
  - `package.json`
  - `app/player.tsx` (New file)
  - `app/LoadingScreen.tsx`
  - `promptdj-midi/index.tsx`

  ### 8. Prompt DJ Web App Deployment
- **Goal**: Deploy the static web app to Firebase Hosting to serve as the WebView source.
- **Changes**:
  - Initialized Firebase Hosting for `promptdj-midi` subdirectory.
  - Configured build output directory to `dist`.
  - Enabled Single Page App (SPA) rewrite rules.
  - Created a new Firebase project (ID: `melody-snap`).
- **Files Affected**:
  - `promptdj-midi/firebase.json` (New file)
  - `promptdj-midi/.firebaserc` (New file)
