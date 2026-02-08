# product_context
**Product Name**: MelodySnap
**Product Definition**: A Synesthetic AI Music Creator iOS APP.
This app transforms the user's visual reality into sound. It allows users to capture or upload a photo, which the AI analyzes for emotion, vibe of this picture. It then use the AI analysing result of this image as a prompt to generate a personalized, contextual music track via the Suno API.

**Core User Flow**:
1. **Capture/Upload**: User takes a photo or selects one.
2. **The image understanding**: The app sends data (Image) to the audio prompt generating agent.
3. **Audio Generation**: the audio prompt generating agent sends prompt result to Suno through Suno API.
4. **Seamless Transition**: Once the music is ready, the interface transitions immediately to the 'player' interface. 
5. **Auto-Play**: The music plays automatically, syncing with the photo the user took.
</product_context>

# /UI_style>
## Original Prompt
Light Mode Spatial UI iOS app screen for MelodySnap "Genre Selection" onboarding.

CRITICAL REQUIREMENTS:
- Background: Volumetric daylight atmosphere - soft pale silver-white with subtle pastel gradients (pink → cyan). Holographic/iridescent vibes. NO dark backgrounds.
- Typography: Swiss style (Helvetica Now, Inter, or Satoshi). Large elegant header (48-56px bold). 
- Lighting: Studio soft-box lighting. Rim lighting with soft glow around card borders. Subsurface scattering effect on translucent cards creating internal luminosity.
- Aesthetic: Neumorphism, Glassmorphism, Clean, Pastel gradients, Ethereal, Futuristic, Airborne. Minimal, elegant, sophisticated.
- Navigation: Minimal skip button top right corner, floating glowing Next button at bottom center
- Safe areas: Proper iOS top/bottom safe area padding
Please reference this design when implementing the component.
</UI_style>


# Kindly_reminder
Make sure each page is mobile-friendly.
We will start with the Ul right now and make it lookbeautiful and then we will integrate (the database) later on to add the full-stack functionality


# Task1: build a photo upload page
## Role
You are a Senior React Native Developer.

## Task
Build the "Capture/Upload Page" (CreateScreen) using **Expo Camera** and **React Native**.

## 1. UI Layout & Style
- **Background**: Full-screen camera viewfinder.
- **Top Bar (Transparent)**:
  - Left: Back button (Icon).
  - Center: Title "MelodySnap".
  - Subtitle below: "Snap, listen and feel the music".
- **Bottom Control Area**:
  - **Center**: A large, circular "Shutter" button (Camera Icon inside).
  - **Below Center**: "Gallery" button (Upload Icon).
  - **Right side**: "Flip Camera" button.

## 2. State Logic (The "Mock" Flow)
The page has 2 visual states:

**State A: Camera Preview (Default)**
- Show camera stream.
- Ask for permissions on mount.
- "Shutter" button takes a photo.
- "Gallery" button opens system image picker.
- "Flip" button toggles front/back camera.

**State B: Image Review (After photo is taken/selected)**
- **Display**: Show the captured image (frozen) full screen.
- **Buttons**:
  - Left: "Retake" (Go back to State A).
  - Right: "Use Photo" (Primary Action).

## 3. Interaction Details (Crucial)
- **Action for "Use Photo"**:
  - Do NOT call a real API.
  - **Mock the process**: Create a function `handleUpload()` that waits for 2 seconds (using `setTimeout`).
  - **During the 2 seconds**: The "Use Photo" button must show a **Loading Spinner** and be disabled.
  - **After 2 seconds**: Navigate to the route named `LoadingScreen`.

## Output
Provide the clean, modular frontend code.

--------------------------------------------------------------------------------------------
# Task2: build a home page

## Task
Build the **"home page"**.
No real backend integration is needed at this stage, but we need to mock the async process to handle UI states.

##  1. Layout Structure
1.  **Header**:
    - Left: Location  & Weather  (Icon + Text). Texts from user‘s location and the weather, fetched from backend. when you can't fetch the user's location and wearther data, keep it blank.
    - Right: Notification Bell (Circle button).
2.  **Hero Section (Center)**:
    - Large Title: "SNAP MUSIC" (Use a heavy, display font).
    - Subtitle: "Turn your reality into a unique sound".
    - **Main Action Button**: A large (w-48 h-48), circular button with a "Camera" icon. It should have the "Retro Pulse" effect (layered circles).
3.  **Bottom Navigation (Tab Bar)**:
    - Custom Tab Bar implementation.
    - Icons: Home, Create, **Play (Floating Center)**, Feed, Profile.

##  2. Interaction Details (Crucial)
- **Crucial**: When the user taps the large central **"Capture" Button** OR the **"Upload Image" Button**:
  - Navigate to the `Capture/Upload Page` (The page we built in the previous task).
  - when click Back button (Icon) on the `Capture/Upload Page`, the user go back to 'home page'

# Visual Style Definition: "Digital Wellness" (Mobile App Optimized)

Please apply the following design system to the React Native code.

## 1. Color Palette (Soft & Healing)
- **Background**: `#FDFCF8` (Warm Off-white)
- **Surface/Cards**: `#FFFFFF` with low opacity (Glass effect)
- **Secondary (Sage)**: `#E8EFE8` (For tags or secondary buttons)
- **Highlight (Lavender)**: `#EFEDF4` (For active states)
- **Primary Accent (Peach/Coral)**: `#FFB7B2` 
  - *Usage Rule*: Use `#292524` (Dark Stone) for text on top of this color.
- **Text**: 
  - Dark: `#292524`
  - Muted: `#78716C`

## 2. Typography (Specific to MelodySnap UI)
- **Primary Font**: `Outfit` (Sans-serif) via `@expo-google-fonts/outfit`.
  - **Main Title ("SNAP MUSIC")**: Use `Outfit_800ExtraBold`. Size: `42px`. Letter-spacing: `-1px`. 
  - **Subtitle ("Turn your reality...")**: Use `Outfit_400Regular`. Size: `14px`. Color: `#78716C`.
  - **Button Text ("CAPTURE", "UPLOAD")**: Use `Outfit_600SemiBold`. Uppercase. Size: `16px`.

- **Accent Font**: `Reenie Beanie` (Handwritten/Cursive) via `@expo-google-fonts/reenie-beanie`.
  - **Target Element**: Specifically for the **Weather/Mood Widget** in the header (e.g., text like "Rainy Vibes").
  - **Size**: `28px` (Ensure readability).

## 3. Visual Effects (React Native Compatible)
- **Corner Smoothing**: Use `borderRadius: 32` for the main card/button containers.
- **Shadows**: Soft, diffused shadows:
  - `shadowColor: "#000"`, `shadowOffset: {width: 0, height: 8}`, `shadowOpacity: 0.06`, `shadowRadius: 16`.
  - Android: `elevation: 4`.
- **Texture**: Use a static semi-transparent grain image overlay if possible, or just keep the clean soft gradient look.

## 4. Animations (Reanimated)
- **Floating Effect**: Apply `react-native-reanimated` to the background blobs (The CD, The Smiley Face) to make them gently float up and down (breathing effect).