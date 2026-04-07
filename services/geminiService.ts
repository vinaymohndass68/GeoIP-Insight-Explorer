
import { GoogleGenAI, Type } from "@google/genai";
import { LocationInsight, IpData } from "../types";

export interface SearchGroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  data: IpData;
  sources: SearchGroundingSource[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getIpLocationViaSearch = async (ip: string): Promise<SearchResult> => {
  const prompt = `Perform a technical lookup for the geolocation of IP address ${ip || 'my current IP'}. 
  Return the result in JSON format with the following keys: 
  ip, city, region, country_name, latitude, longitude, asn, org, timezone, postal. 
  Try to be as precise as possible based on web data.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ip: { type: Type.STRING },
            city: { type: Type.STRING },
            region: { type: Type.STRING },
            country_name: { type: Type.STRING },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            asn: { type: Type.STRING },
            org: { type: Type.STRING },
            timezone: { type: Type.STRING },
            postal: { type: Type.STRING },
          },
          required: ["ip", "city", "country_name"]
        }
      }
    });

    const data = JSON.parse(response.text.trim());
    const sources: SearchGroundingSource[] = [];
    
    // Extract search grounding URLs as required by API rules
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { data, sources };
  } catch (error) {
    console.error("Gemini Search Fallback error:", error);
    throw new Error("Deep Search failed to locate the IP.");
  }
};

export const getLocationInsights = async (city: string, country: string): Promise<LocationInsight> => {
  const prompt = `Provide interesting regional insights for ${city}, ${country}. Include a short summary, a fun fact, and the top landmark.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A 2-sentence summary of the city's character." },
            funFact: { type: Type.STRING, description: "One unique and surprising fact about this place." },
            topLandmark: { type: Type.STRING, description: "The most iconic landmark to visit." }
          },
          required: ["summary", "funFact", "topLandmark"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini insight error:", error);
    return {
      summary: `Information for ${city} is currently being updated.`,
      funFact: "Every city has its own hidden history waiting to be discovered.",
      topLandmark: "Consult a local guide for the best spots!"
    };
  }
};
