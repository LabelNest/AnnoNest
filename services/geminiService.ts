import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export class AIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AIError';
  }
}

export const geminiService = {
  // Uses Pro model for complex entity extraction and structured data reasoning
  async extractEntities(content: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the following text and extract potential financial entities (GPs, LPs, Portfolio Companies, Funds, Contacts). 
        IMPORTANT: For each entity, strictly identify their specific location breakdown.
        Hierarchy Rule: City -> State -> Country.
        Context: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, description: 'One of: LP, GP, Fund, PortCo, Contact' },
                location: {
                  type: Type.OBJECT,
                  properties: {
                    city: { type: Type.STRING },
                    state: { type: Type.STRING },
                    country: { type: Type.STRING }
                  }
                },
                confidence: { type: Type.NUMBER },
                summary: { type: Type.STRING }
              },
              required: ['name', 'type', 'location', 'confidence']
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (e: any) {
      if (e.status === 429 || e.message?.includes('429') || e.message?.includes('quota')) {
        throw new AIError(429, "AI Quota Exhausted: Please check your billing or wait a few minutes before retrying.");
      }
      console.error("Gemini API Error:", e);
      throw e;
    }
  },

  // Uses Pro model for logical grouping and reasoning across multiple signal headlines
  async clusterNewsSignals(articles: {id: string, headline: string}[]) {
    try {
      const ai = getAI();
      const articleList = articles.map(a => `[ID: ${a.id}] ${a.headline}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze these news headlines and group them into logical "Event Clusters". 
        A cluster consists of articles describing the same real-world event (e.g., a specific funding round, a merger, or a person move).
        
        Headlines:
        ${articleList}
        
        Output format: Array of clusters.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Clear name for this event cluster' },
                article_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                reason: { type: Type.STRING, description: 'Why are these grouped?' },
                confidence: { type: Type.NUMBER }
              },
              required: ['name', 'article_ids', 'reason', 'confidence']
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (e: any) {
      console.error("Clustering Error:", e);
      return [];
    }
  },

  // Uses Flash model for basic summarization task
  async summarizeSignal(content: string) {
    try {
      const ai = getAI();
      // Expanded buffer to handle large documents (10k chars)
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a concise 1-sentence summary of this signal: ${content.substring(0, 10000)}`,
      });
      return response.text || "No summary available.";
    } catch (e: any) {
      return "Extraction failed.";
    }
  }
};