const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// SOLID-OCP: Implements IMatchingEngine. Adding new provider = new file only.
// SOLID-LSP: Drop-in replaceable with ruleBasedProvider.

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/** @type {import('../interfaces/IMatchingEngine')} */
const geminiProvider = {
  async matchStudentToJob(studentProfile, jobListing) {
    if (!genAI) {
      console.warn('Gemini API key missing. GeminiProvider unavailable.');
      return null;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        You are a placement matching engine. Given this student profile and job listing, 
        return ONLY valid JSON with no markdown formatting or code blocks:
        { 
          "score": number between 0 and 1, 
          "reason": "one sentence human readable explanation",
          "confidence": "high" or "medium" or "low" 
        }

        Student: skills=[${studentProfile.skills.join(', ')}], cgpa=${studentProfile.cgpa}, branch=${studentProfile.branch}
        Job: title="${jobListing.title}", required_skills=[${jobListing.required_skills.join(', ')}], min_cgpa=${jobListing.min_cgpa}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean potential markdown if the model hallucinated it
      const jsonStr = text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return null; // Triggers fallback to RuleBasedProvider
    }
  }
};

module.exports = geminiProvider;
