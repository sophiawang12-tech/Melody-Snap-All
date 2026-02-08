// Use legacy API to avoid deprecation error until full migration
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';

// ⚠️ 实际开发中请将 Key 放入 .env 文件或安全存储
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface MusicStyleResult {
  text: string;   // 音乐风格描述
  weight: number; // 权重 (0.0 - 2.0)
}

export const analyzeImageForMusic = async (imageUri: string): Promise<MusicStyleResult[]> => {
  try {
    // 1. 将图片转换为 Base64
    const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // 2. 构建请求体
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `# Role
You are an expert AI Music Curator with "synesthesia" capabilities. Your goal is to analyze an input image and translate its visual mood, color palette, lighting, and subject matter into a specific "Sonic Recipe" for a generative music engine.

# Constraints (CRITICAL)
1. You MUST ONLY use music styles/instruments from the **Allowed Vocabulary List** below. Do NOT invent new genres (e.g., do not use "Jazz", "Rock", "Classical" unless they are in the list).
2. You must assign a **weight** to each selected style between **0.0** and **2.0**.
   - **1.5 - 2.0**: The dominant vibe of the image.
   - **0.8 - 1.4**: Secondary supporting elements or textures.
   - **0.1 - 0.7**: Subtle accents or background flavors.
   - **0**: Completely irrelevant styles (do not include these in the output).
3. Select between 3 to 6 styles that best represent the image. Do not select all of them.
 Allowed Vocabulary List (Strictly enforced)
- "Bossa Nova"
- "Chillwave"
- "Drum and Bass"
- "Post Punk"
- "Shoegaze"
- "Funk"
- "Chiptune"
- "Lush Strings"
- "Sparkling Arpeggios"
- "Staccato Rhythms"
- "Punchy Kick"
- "Dubstep"
- "K Pop"
- "Neo Soul"
- "Trip Hop"
- "Thrash"

# Visual-to-Audio Mapping Guidelines
- **Retro/Pixel Art/Game vibes** -> "Chiptune"
- **Neon lights, Cyberpunk, Futuristic, Purple/Blue hues** -> "Chillwave", "Dubstep", "Trip Hop"
- **Chaotic, High energy, Aggressive action** -> "Thrash", "Punchy Kick", "Drum and Bass"
- **Dreamy, Hazy, Soft focus, Abstract** -> "Shoegaze", "Lush Strings", "Sparkling Arpeggios"
- **Urban, Cool, Stylish, Groovy** -> "Neo Soul", "Funk", "K Pop"
- **Melancholic, Dark, Gritty** -> "Post Punk"
- **Sunny, Relaxed, Warm colors** -> "Bossa Nova"
- **Sharp/Spiky shapes** -> "Staccato Rhythms"

# Selection Strategy (Guideline for high-quality output)
To create the best sounding music, do not select more than 4 styles. Aim for a balanced mix using this structure:
1. **Core Genre (Base)**: Select 1 main genre style (e.g., "Funk", "Bossa Nova", "Chillwave"). Assign High Weight (1.2 - 1.8).
2. **Texture/Atmosphere**: Select 1 textural element (e.g., "Lush Strings", "Sparkling Arpeggios", "Shoegaze"). Assign Medium Weight (0.8 - 1.2).
3. **Rhythm/Accent**: Select 1 rhythmic element (e.g., "Punchy Kick", "Staccato Rhythms", "Drum and Bass"). Assign Low/Medium Weight (0.6 - 1.0).
Avoid conflicting combinations (e.g., do not mix "Thrash" with "Bossa Nova" unless the image specifically looks like chaotic relaxation).


# Output Format
Return ONLY a valid JSON object containing an array of "prompts". Do not include markdown formatting (like \`\`\`json).
Example Output:
{
  "prompts": [
    { "text": "Chillwave", "weight": 1.8 },
    { "text": "Sparkling Arpeggios", "weight": 1.2 },
    { "text": "Punchy Kick", "weight": 0.8 }
  ]
}`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64ImageData
              }
            }
          ]
        }
      ]
    };

    // 3. 调用 Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    // 4. 解析响应
    const rawText = data.candidates[0].content.parts[0].text;
    
    // 清理可能存在的 Markdown 标记 (```json ... ```)
    const jsonString = rawText.replace(/```json|```/g, '').trim();
    
    const parsedData = JSON.parse(jsonString);
    const results: MusicStyleResult[] = parsedData.prompts || parsedData;
    return results;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // 返回默认值以防失败
    return [{ text: "lo-fi hip hop", weight: 0.8 }];
  }
};
