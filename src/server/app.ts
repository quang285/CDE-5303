import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const FACT_PACKAGE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    caseTitle: { type: Type.STRING },
    category: { 
      type: Type.STRING,
      description: "One of the SG CaseCategory values"
    },
    urgency: {
      type: Type.STRING,
      description: "Low, Medium, High, or Critical"
    },
    urgencyReason: { type: Type.STRING },
    summary: { type: Type.STRING },
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          source: { type: Type.STRING },
          status: { type: Type.STRING, description: "verified, alleged, or disputed" },
          timestamp: { type: Type.STRING, description: "Optional timestamp or date associated with this fact" }
        },
        required: ["statement", "source", "status"]
      }
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          significance: { type: Type.STRING }
        },
        required: ["date", "description", "significance"]
      }
    },
    actionList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "question, document, or action" },
          label: { type: Type.STRING },
          description: { type: Type.STRING },
          completed: { type: Type.BOOLEAN }
        },
        required: ["id", "type", "label", "description", "completed"]
      }
    },
    keyQuestionsForLawyer: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    recommendedNextStep: { type: Type.STRING },
    workflowStatus: {
      type: Type.STRING,
      description: "TRIAGE, READINESS, MATCHING, or COMPLETED"
    },
    legalAssessment: {
      type: Type.OBJECT,
      properties: {
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        weaknesses: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        estimatedTimeline: { type: Type.STRING },
        potentialRemedies: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        lawyerConsultationGuide: { type: Type.STRING }
      },
      required: ["strengths", "weaknesses", "estimatedTimeline", "potentialRemedies", "lawyerConsultationGuide"]
    }
  },
  required: ["caseTitle", "category", "urgency", "urgencyReason", "summary", "facts", "timeline", "actionList", "keyQuestionsForLawyer", "recommendedNextStep", "workflowStatus"]
};

const app = express();
app.use(express.json());

// API routes
app.post("/api/analyze", async (req, res) => {
  try {
    const { text, existingPackage } = req.body;
    
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `You are an expert legal triage AI specialized in Singapore Jurisdiction. 
    Your primary goal is to analyze user inputs and identify CRITICAL MISSING INFORMATION needed to provide a professional legal assessment under Singapore law.
    
    JURISDICTION CONTEXT (Singapore):
    - Employment: Employment Act, TADM processes, MOM regulations.
    - Family: Women's Charter, Syariah Law (if applicable), HDB eligibility.
    - Property: HDB rules, URA guidelines, Tenancy Agreements.
    - Criminal: Penal Code, CPC.
    
    ANALYSIS STRATEGY:
    1. Identify the core legal issue.
    2. Determine what is MISSING to give a lawyer a complete picture. 
    3. For every 'question' in the 'actionList', you MUST provide a detailed 'description' that:
       - Explains WHY this detail matters for the case.
       - Cites the relevant Singapore law, statute, or rule (e.g., "Section 14 of the Employment Act", "Rule 5 of the Family Justice Rules").
       - Explains how this detail helps classify the case or determine the legal remedy.
    
    OUTPUT REQUIREMENTS:
    - 'caseTitle': Concise name of the matter.
    - 'category': One of the SG CaseCategory values.
    - 'urgency': Based on court deadlines or immediate risks in SG.
    - 'actionList': 
      - Priority 1: 'question' - Specific, pointed questions for the user to answer NOW. The description MUST include legal citations and justifications.
      - Priority 2: 'document' - SG-specific docs needed (e.g., NRIC, CPF statement, Letter of Demand).
    - 'recommendedNextStep': Clear, actionable advice for the user.
    - 'legalAssessment': ONLY provide this if you have enough information to form a preliminary view. It should include:
      - 'strengths': Legal points in the user's favor under SG law.
      - 'weaknesses': Risks or gaps in the user's position.
      - 'estimatedTimeline': How long such cases usually take in SG courts/tribunals.
      - 'potentialRemedies': What the user can realistically hope to achieve (e.g., compensation, injunction).
      - 'lawyerConsultationGuide': Specific advice on what to ask a lawyer during the first meeting.
    
    Be precise, authoritative yet helpful. If the user provides more info, update the package and remove answered questions. If all critical questions are answered, set 'workflowStatus' to 'COMPLETED' and provide a full 'legalAssessment'.`;

    const prompt = existingPackage 
      ? `Update this Singapore Legal Triage Package: ${JSON.stringify(existingPackage)}\n\nWith this new user input: ${text}`
      : `Analyze this legal situation in Singapore: ${text}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: FACT_PACKAGE_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error("Failed to get analysis from AI");
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

export { app };
