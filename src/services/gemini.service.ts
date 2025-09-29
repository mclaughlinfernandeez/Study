
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  
  constructor() {
    // This is a placeholder for environments where process.env is not defined.
    // In a real Applet environment, process.env.API_KEY would be available.
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
      ? process.env.API_KEY 
      : 'YOUR_API_KEY_HERE';
      
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn("API key is not set. Please set the API_KEY environment variable.");
    } else {
       this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.ai) {
      return Promise.reject("Gemini AI client is not initialized. Please check your API key.");
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        return text;
      } else {
        throw new Error("Received an empty response from the API.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Failed to generate content from Gemini API.");
    }
  }
}
