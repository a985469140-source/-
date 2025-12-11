export const COLORS = {
  EMERALD: '#004225', // Deep Trump-style green
  GOLD: '#FFD700',    // High gloss gold
  SILVER: '#C0C0C0',
  RED_VELVET: '#800000',
  WARM_LIGHT: '#ffaa33'
};

export const CONFIG = {
  FOLIAGE_COUNT: 4500,
  ORNAMENT_COUNT: 200,
  PHOTO_COUNT: 30,
  TREE_HEIGHT: 12,
  TREE_RADIUS: 4.5,
  CHAOS_RADIUS: 25,
  GEMINI_INTERVAL_MS: 800, // Check gesture every 800ms to balance perf/latency
};

// Prompt for Gemini Vision
export const GESTURE_PROMPT = `
Analyze this image from a webcam. 
Focus on the user's hand.
1. If the hand is OPEN (fingers splayed) or if the user is making an expansive gesture, the state is 'CHAOS'.
2. If the hand is CLOSED (fist) or fingers together, or if no hand is visible, the state is 'FORMED'.
3. Estimate the center of the hand relative to the frame center: x (-1 left to 1 right), y (-1 bottom to 1 top).

Return purely valid JSON with no markdown formatting:
{
  "state": "CHAOS" | "FORMED",
  "handX": number,
  "handY": number,
  "confidence": number
}
`;