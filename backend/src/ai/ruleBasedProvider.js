// SOLID-OCP: Fallback — system works without Gemini (OCP guarantee)
// SOLID-LSP: Same interface as geminiProvider

/** @type {import('../interfaces/IMatchingEngine')} */
const ruleBasedProvider = {
  async matchStudentToJob(studentProfile, jobListing) {
    let score = 0;
    
    // CGPA weight: 40%
    if (studentProfile.cgpa >= jobListing.min_cgpa) {
      score += 0.4;
    }

    // Skills weight: 60%
    const studentSkills = new Set(studentProfile.skills.map(s => s.toLowerCase()));
    const jobSkills = jobListing.required_skills.map(s => s.toLowerCase());
    
    const matches = jobSkills.filter(skill => studentSkills.has(skill));
    const skillScore = jobSkills.length > 0 ? (matches.length / jobSkills.length) * 0.6 : 0.6;
    
    score += skillScore;
    
    const cgpaMet = studentProfile.cgpa >= jobListing.min_cgpa ? 'met' : 'not met';
    const reason = `Matched ${matches.length} of ${jobSkills.length} required skills. CGPA requirement ${cgpaMet}.`;
    const confidence = score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low';

    return { 
      score: parseFloat(score.toFixed(2)), 
      reason, 
      confidence 
    };
  }
};

module.exports = ruleBasedProvider;
