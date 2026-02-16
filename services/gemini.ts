
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Generates an embedding vector for the given text.
 * Used for semantic search similarity matching.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text.trim()) return [];
  
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    content: { parts: [{ text }] },
  });

  return response.embedding.values;
};

export const analyzeNote = async (content: string): Promise<AIAnalysisResponse> => {
  if (!content.trim()) throw new Error("Content is empty");

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: content,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      systemInstruction: `You are an advanced cognitive assistant. 
      Analyze the note and provide metadata.
      If the note mentions specific dates, deadlines, or future plans, suggest them as 'suggested_events'.
      Today's date is ${new Date().toISOString().split('T')[0]}.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improved_title: { type: Type.STRING },
          summary: { type: Type.STRING },
          category: { type: Type.STRING },
          note_type: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          action_items: { type: Type.ARRAY, items: { type: Type.STRING } },
          common_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggested_links: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggested_events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" }
              },
              required: ["title", "date"]
            }
          }
        },
        required: ["improved_title", "summary", "category", "note_type", "tags", "key_points", "action_items", "common_topics", "suggested_links", "suggested_events"]
      }
    }
  });

  return JSON.parse(response.text) as AIAnalysisResponse;
};

export const chatWithNote = async (noteContent: string, history: any[], userPrompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { role: 'user', parts: [{ text: `CONTEXT NOTE CONTENT:\n${noteContent}` }] },
      ...history.map(m => ({ 
        role: m.role === 'user' ? 'user' : 'model', 
        parts: [{ text: m.text }] 
      })),
      { role: 'user', parts: [{ text: userPrompt }] }
    ],
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      systemInstruction: "You are an expert knowledge assistant. Use the note content provided."
    }
  });

  return response.text;
};
