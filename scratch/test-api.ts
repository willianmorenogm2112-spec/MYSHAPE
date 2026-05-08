import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

async function test() {
  if (!API_KEY) {
    console.error("API_KEY is missing!");
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"];
  
  for (const modelName of modelsToTry) {
    console.log(`\nTesting with model: ${modelName}...`);
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Respond 'OK' if you can hear me."
      });
      console.log(`Success with ${modelName}!`);
      console.log("Response:", response.text);
      return; // Stop after first success
    } catch (error: any) {
      console.error(`Error with ${modelName}:`, error.message || error);
    }
  }
}

test();
