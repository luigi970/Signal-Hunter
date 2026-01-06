
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Problem } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export class SignalHunterService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Stage 1: Generate 5 aggressive search variations focused on pain points
   */
  async expandQuery(niche: string): Promise<string[]> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 specific, aggressive search queries to find real customer pain points, complaints, and "hated" aspects for the niche: "${niche}". 
      Focus on keywords like "hate", "nightmare", "cost", "manual process", "broken", "unreliable".
      Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [`${niche} pain points`, `${niche} reddit complaints`];
    }
  }

  /**
   * Stage 2 & 3: Hunt for data and Synthesize into structured business opportunities
   */
  async huntAndSynthesize(queries: string[]): Promise<{ problems: Problem[], sources: any[] }> {
    const combinedQueries = queries.join(", ");

    // We use Google Search grounding to perform the "Extraction" phase
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for real-world pain points regarding: ${combinedQueries}. 
      Look specifically for complaints on Reddit, specialized forums, and reviews.
      
      INTERNAL SYSTEM PROMPT:
      ROL: Eres un experto Analista de Mercado y Venture Builder. TAREA: Recibirás un texto "sucio" recopilado de internet sobre un nicho. Tu trabajo es ignorar el ruido y extraer oportunidades de negocio.
      REGLAS DE ANÁLISIS:
      1. Detectar Dolor: Busca emociones fuertes ("Odio", "Perdí dinero", "Imposible").
      2. Filtrar: Ignora quejas sobre precios bajos o estética. Busca problemas de funcionalidad o dinero.
      3. Ideación: Para cada problema grave, inventa una solución B2B o Micro-SaaS.
      
      FORMATO DE SALIDA (JSON ONLY):
      Devuelve un JSON con un array de objetos "problems". 
      Asigna una 'category' basada en el potencial: 'GOLD_MINE' (Alto dolor, Alta frecuencia), 'NICHE_GEM' (Alto dolor, baja frecuencia), 'NOISE' (Bajo impacto).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  pain_score: { type: Type.NUMBER },
                  frequency_score: { type: Type.NUMBER },
                  evidence: { type: Type.STRING },
                  category: { type: Type.STRING, enum: Object.values(Category) },
                  solution_idea: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      pitch: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ["SaaS", "Service"] }
                    }
                  }
                },
                required: ["title", "pain_score", "frequency_score", "evidence", "category", "solution_idea"]
              }
            }
          }
        }
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri,
      title: chunk.web?.title
    })).filter((s: any) => s.uri) || [];

    try {
      const parsed = JSON.parse(response.text || '{"problems": []}');
      // Add unique IDs
      const problemsWithIds = parsed.problems.map((p: any) => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9)
      }));
      return { problems: problemsWithIds, sources };
    } catch (e) {
      console.error("Synthesis failed", e);
      return { problems: [], sources: [] };
    }
  }
}
