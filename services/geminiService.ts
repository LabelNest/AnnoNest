
import { GoogleGenAI, Type } from "@google/genai";

export class AIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AIError';
  }
}

export const geminiService = {
  // --- TRANSCRIPTION REFINERY ---
  async transcribeMedia(base64Data: string, mimeType: string, contextPrompt?: string, specialClauses?: string, targetScript: string = 'Latin') {
    try {
      if (!base64Data) throw new Error("No media data provided.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemContext = `
        You are a high-precision multi-script transcription engine for AnnoNest OS.
        
        TASK:
        1. Automatically detect the spoken language in the audio artifact.
        2. Transcribe the audio exactly in the target script: ${targetScript}.
        
        REFINERY CONTEXT: ${contextPrompt || 'General business/technical dialogue.'}
        FORMATTING RULES: ${specialClauses || 'Standard verbatim.'}
        
        OUTPUT FORMAT: 
        Return the transcript in speaker-turn format: "Speaker Name: [Text]"
        Use the script requested (${targetScript}) for the text content.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data.split(',')[1] || base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: systemContext,
            },
          ]
        },
      });
      return response.text || "Transcription yielded no data.";
    } catch (e: any) {
      console.error("AI Transcription Error:", e);
      throw new AIError(500, "Media synthesis failed.");
    }
  },

  // --- SALES & REFINERY HANDSHAKES ---
  async synthesizeSalesHook(entityName: string, website: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Search for current news for ${entityName} (${website}). Synthesize a professional outreach hook.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [] };
    } catch (e) { return { text: "Error generating hook.", sources: [] }; }
  },

  async translateText(text: string, targetLang: string, sourceLang: string = 'Auto-Detect') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLang}. Source: ${sourceLang}. Content: ${text}`,
      });
      return response.text || "";
    } catch (e: any) { throw new AIError(500, "Synthesis failed."); }
  },

  async extractEntities(content: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Extract detailed institutional signals from: ${content}. 
        Identify:
        - GPs (General Partners/Funds)
        - LPs (Limited Partners/Investors)
        - PortCos (Portfolio Companies/Startups)
        - Deals (Investments, M&A)
        - Service Providers (Legal, Audit, SPV)
        - Contacts (Personnel Names & Titles)
        - Vertical Profiles (Agritech, Blockchain, Healthcare specific signals)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { 
                name: { type: Type.STRING }, 
                type: { 
                  type: Type.STRING, 
                  description: "One of: GP, LP, Fund, PortCo, Service Provider, Deal, Contact, Agritech, Blockchain, Healthcare" 
                }, 
                summary: { type: Type.STRING } 
              },
              required: ['name', 'type']
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (e: any) { throw e; }
  },

  async askRefinery(query: string, systemState: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Query: ${query}. Metadata: ${JSON.stringify(systemState)}`,
      });
      return response.text || "Error.";
    } catch (e) { return "Refinery offline."; }
  }
};
