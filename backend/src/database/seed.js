const db = require('../db');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    const userCheck = await db.query('SELECT count(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    console.log('Seeding database...');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const officerPass = await bcrypt.hash('officer123', 10);
    const recruiterPass = await bcrypt.hash('recruiter123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    // Insert Users
    const users = await db.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin User', 'admin@placement.dev', '${adminPass}', 'admin'),
      ('Placement Officer', 'officer@placement.dev', '${officerPass}', 'placement_officer'),
      ('John Recruiter', 'rec1@techcorp.com', '${recruiterPass}', 'recruiter'),
      ('Jane Recruiter', 'rec2@infosys.com', '${recruiterPass}', 'recruiter'),
      ('Student One', 'student1@college.edu', '${studentPass}', 'student'),
      ('Student Two', 'student2@college.edu', '${studentPass}', 'student'),
      ('Student Three', 'student3@college.edu', '${studentPass}', 'student'),
      ('Student Four', 'student4@college.edu', '${studentPass}', 'student'),
      ('Student Five', 'student5@college.edu', '${studentPass}', 'student')
      RETURNING id, email, role;
    `);

    const userMap = {};
    users.rows.forEach(u => userMap[u.email] = u.id);

    // Insert Student Profiles
    await db.query(`
      INSERT INTO student_profiles (user_id, branch, cgpa, skills) VALUES
      (${userMap['student1@college.edu']}, 'CSE', 8.9, ARRAY['Python','React','SQL','Node.js']),
      (${userMap['student2@college.edu']}, 'CSE', 7.4, ARRAY['Java','Spring','MySQL']),
      (${userMap['student3@college.edu']}, 'ECE', 8.1, ARRAY['Python','ML','TensorFlow']),
      (${userMap['student4@college.edu']}, 'ME', 6.8, ARRAY['AutoCAD','MATLAB','C++']),
      (${userMap['student5@college.edu']}, 'CSE', 9.2, ARRAY['React','TypeScript','AWS'])
    `);

    // Insert Companies
    const companies = await db.query(`
      INSERT INTO companies (name, industry, recruiter_id) VALUES
      ('TechCorp', 'Software', ${userMap['rec1@techcorp.com']}),
      ('Infosys', 'IT Services', ${userMap['rec2@infosys.com']})
      RETURNING id, name;
    `);

    const companyMap = {};
    companies.rows.forEach(c => companyMap[c.name] = c.id);

    // Insert Job Listings
    const jobs = await db.query(`
      INSERT INTO job_listings (company_id, title, description, required_skills, min_cgpa, salary_lpa, deadline) VALUES
      (${companyMap['TechCorp']}, 'Full Stack Developer', 'Exciting role for full stack devs', ARRAY['React','Node.js','SQL'], 8.0, 12.5, CURRENT_DATE + 60),
      (${companyMap['TechCorp']}, 'ML Engineer', 'Work on cutting edge AI', ARRAY['Python','ML','TensorFlow'], 8.5, 15.0, CURRENT_DATE + 45),
      (${companyMap['Infosys']}, 'System Associate', 'Entry level IT role', ARRAY['Java','SQL'], 7.0, 4.5, CURRENT_DATE + 30)
      RETURNING id, title;
    `);

    const jobMap = {};
    jobs.rows.forEach(j => jobMap[j.title] = j.id);

    // Deadlines are relative to the seed date so the live demo never shows only expired jobs.
    // Insert Applications
    await db.query(`
      INSERT INTO applications (student_id, job_id, ai_match_score, ai_match_reason) VALUES
      (${userMap['student1@college.edu']}, ${jobMap['Full Stack Developer']}, 0.95, 'High skill overlap in React and Node.js with strong CGPA.'),
      (${userMap['student3@college.edu']}, ${jobMap['ML Engineer']}, 0.92, 'Expertise in ML and TensorFlow matches job requirements perfectly.'),
      (${userMap['student2@college.edu']}, ${jobMap['System Associate']}, 0.75, 'Solid foundation in Java and SQL meets the core criteria.'),
      (${userMap['student5@college.edu']}, ${jobMap['Full Stack Developer']}, 0.88, 'Strong frontend skills and cloud experience align well.')
    `);

    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

module.exports = { seedData };
