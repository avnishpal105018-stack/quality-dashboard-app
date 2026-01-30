
import { GoogleGenAI, Type } from "@google/genai";
import { BaseNGRecord, PredictionData } from "../types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictionService = {
  generateQualityPredictions: async (records: any[]): Promise<PredictionData | null> => {
    if (records.length === 0) return null;

    // Prepare data summary for the AI
    const summary = records.map(r => ({
      date: r.date,
      station: r.station,
      area: r.moduleType,
      qty: r.quantity,
      issue: r.issueCategory || r.issueDescription
    })).slice(-100); // Last 100 records for context

    try {
      // Use ai.models.generateContent to query GenAI with model and prompt.
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analyze this historical NG (Non-Good) production data and provide a detailed quality forecast and risk assessment for Kimbal Technology manufacturing plant.
        
        Data Summary: ${JSON.stringify(summary)}
        
        Requirements:
        1. Predict the most likely issue category to occur next.
        2. Identify the highest risk station (1-12) based on failure frequency and recent volatility.
        3. Forecast NG quantities for next day and next week based on trend analysis.
        4. Provide a professional management insight.
        5. Assign risk levels to stations.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedTopIssue: { type: Type.STRING },
              predictedHighRiskStation: { type: Type.STRING },
              predictedArea: { type: Type.STRING },
              forecastedQuantityNextDay: { type: Type.NUMBER },
              forecastedQuantityNextWeek: { type: Type.NUMBER },
              confidenceLevel: { type: Type.NUMBER, description: "0-100 percentage" },
              managementInsight: { type: Type.STRING },
              stationRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    station: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, description: "Low, Medium, or High" },
                    confidence: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  },
                  required: ["station", "riskLevel", "reason"]
                }
              },
              forecastTrend: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    predicted: { type: Type.NUMBER }
                  },
                  required: ["date", "predicted"]
                }
              }
            },
            required: ["predictedTopIssue", "predictedHighRiskStation", "forecastedQuantityNextDay", "managementInsight", "stationRisks", "forecastTrend"]
          }
        }
      });

      // Extract generated text directly via the .text property.
      const result = JSON.parse(response.text || '{}');
      return result as PredictionData;
    } catch (error) {
      console.error("Prediction Error:", error);
      return null;
    }
  }
};
