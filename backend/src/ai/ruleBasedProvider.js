// SOLID-OCP: Fallback — the system keeps working without Gemini.
// SOLID-LSP: Same interface as geminiProvider.

const normalise = (skills) => (skills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);

/** @type {import('../interfaces/IMatchingEngine')} */
const ruleBasedProvider = {
  name: 'rule-based',

  async matchStudentToJob(studentProfile, jobListing) {
    const cgpa = Number(studentProfile.cgpa) || 0;
    const minCgpa = Number(jobListing.min_cgpa) || 0;
    const cgpaMet = cgpa >= minCgpa;

    const studentSkills = new Set(normalise(studentProfile.skills));
    const jobSkills = [...new Set(normalise(jobListing.required_skills))];
    const matches = jobSkills.filter((skill) => studentSkills.has(skill));

    // Weights: CGPA eligibility 40%, skill coverage 60%.
    const skillScore = jobSkills.length > 0 ? (matches.length / jobSkills.length) * 0.6 : 0.6;
    const score = (cgpaMet ? 0.4 : 0) + skillScore;

    const confidence = score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low';
    const reason = `Matched ${matches.length} of ${jobSkills.length} required skills. CGPA requirement ${cgpaMet ? 'met' : 'not met'}.`;

    return { score: Math.round(score * 100) / 100, reason, confidence };
  },
};

module.exports = ruleBasedProvider;
