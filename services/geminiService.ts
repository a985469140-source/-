import { GoogleGenAI } from "@google/genai";
import { GESTURE_PROMPT } from '../constants';
import { GestureResponse, AppState } from '../types';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const analyzeGesture = async (base64Image: string): Promise<GestureResponse | null> => {
  if (!ai) {
    console.warn("API Key missing");
    return null;
  }

  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: GESTURE_PROMPT
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;

    const result = JSON.parse(text) as GestureResponse;
    return result;

  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    return null; // Fail gracefully
  }
};