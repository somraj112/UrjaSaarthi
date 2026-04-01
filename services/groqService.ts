import Groq from "groq-sdk";
import { UserInput, SolarAnalysis } from "../types";

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getSolarAnalysis = async (input: UserInput, retryCount = 0): Promise<SolarAnalysis> => {
  const applianceList = Object.entries(input.appliances)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => `${id}: ${count}`)
    .join(", ");

  const systemPrompt = `You are an expert Solar Energy Consultant in India. You always return valid, non-zero JSON data for energy audits. Never use placeholders or zeros for financial metrics. Return ONLY a valid JSON object.`;

  const technicalAnalysisPrompt = `
    Perform a professional solar energy audit for a household in ${input.location}.
    MONTHLY BILL: ₹${input.monthlyBill}
    APPLIANCES: ${applianceList || "Standard household lighting"}
    HOUSE TYPE: ${input.houseType}

    CRITICAL RULES:
    - YOU MUST NOT RETURN 0 FOR recommendedCapacityKw, investmentCost, or monthlySavings.
    - If the monthly bill is ₹${input.monthlyBill}, calculate a realistic solar plant (1kW per ₹1000-1500 of bill).
    - ROI MUST be between 3 and 6 years.
    - generate exactly 10 points for graphData.
    - Include 4 certified solar installation companies matching the location in localProviders (or fallback values if unsure).

    Return ONLY a JSON object exactly matching this structure (no markdown, no other text):
    {
      "recommendedCapacityKw": number,
      "estimatedPanels": number,
      "monthlySavings": number,
      "paybackYears": number,
      "co2Reduction": number,
      "investmentCost": number,
      "potentialScore": number,
      "detailedAnalysis": "string",
      "graphData": [ { "year": number, "cumulativeSavings": number, "initialCost": number } ],
      "subsidies": [ { "name": "string", "details": "string", "eligibility": "string", "applicationProcess": "string", "link": "string" } ],
      "localProviders": [ { "name": "string", "description": "string", "url": "string" } ]
    }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: technicalAnalysisPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(responseContent);

    // Validation Check
    if (!data.recommendedCapacityKw || data.recommendedCapacityKw <= 0) {
      if (retryCount < 2) {
        await delay(2000 * (retryCount + 1));
        return getSolarAnalysis(input, retryCount + 1);
      }
      throw new Error("Analysis generated invalid data.");
    }

    // Assign fallback providers if they are missing
    if (!data.localProviders || data.localProviders.length < 2) {
      data.localProviders = [
        { name: "Tata Power Solar", description: "India's largest integrated solar company.", url: "https://www.tatapowersolar.com/" },
        { name: "Luminous Solar", description: "Trusted residential solar solutions.", url: "https://www.luminousindia.com/" },
        { name: "Waaree Energies", description: "Premier solar module manufacturer.", url: "https://www.waaree.com/" },
        { name: "Adani Solar", description: "Scalable solar power infrastructure.", url: "https://www.adanisolar.com/" }
      ];
    }

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      input,
      ...data
    };
  } catch (err: any) {
    if (retryCount < 2) {
      console.warn(`Retry attempt ${retryCount + 1} for Groq analysis. Backing off...`);
      await delay(2000 * Math.pow(2, retryCount));
      return getSolarAnalysis(input, retryCount + 1);
    }
    throw err;
  }
};
