import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface FinancialInsight {
  title: string;
  description: string;
  suggestion: string;
  detectedIssue: boolean;
}

export async function getFinancialInsights(
  transactions: any[],
  budgetLimit: number,
  currentMonth: string
): Promise<FinancialInsight[]> {
  const transactionSummary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
  }));

  const prompt = `
    As a smart personal finance advisor, analyze the following transactions for the month of ${currentMonth}.
    Monthly Budget Limit: ₹${budgetLimit} (Currency is INR)
    
    Transactions:
    ${JSON.stringify(transactionSummary)}

    Provide 3 punchy, actionable insights. 
    Focus on:
    1. Highest expense category.
    2. Overspending patterns or budget risks.
    3. Specific savings suggestions based on the spending habits shown.

    Return the response as a JSON array of objects with fields: title, description, suggestion, detectedIssue (boolean).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              detectedIssue: { type: Type.BOOLEAN },
            },
            required: ["title", "description", "suggestion", "detectedIssue"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return [{
      title: "Insight Unavailable",
      description: "We couldn't generate insights at this moment.",
      suggestion: "Try adding more transactions to get better analysis.",
      detectedIssue: false
    }];
  }
}
