const { z } = require('zod');

const APPLICATION_STATUSES = ['applied', 'shortlisted', 'interview_scheduled', 'offered', 'rejected'];
const ROLES = ['student', 'recruiter', 'placement_officer', 'admin'];

const skills = z
  .array(z.string().trim().min(1).max(50))
  .max(50)
  .transform((list) => [...new Set(list)]);

const isDateString = (value) => !Number.isNaN(Date.parse(value));

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const login = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// Deliberately has no `is_placed`: placement status is set by the system when
// a recruiter marks an application "offered", never by the student.
const studentProfile = z.object({
  branch: z.string().trim().min(1).max(100),
  cgpa: z.coerce.number().min(0).max(10),
  skills,
  resume_text: z.string().max(20_000).optional().nullable(),
  year_of_passing: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
});

const createJob = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().max(10_000).optional().nullable(),
  required_skills: skills.refine((list) => list.length > 0, 'At least one skill is required'),
  min_cgpa: z.coerce.number().min(0).max(10),
  salary_lpa: z.coerce.number().min(0).max(1000).optional().nullable(),
  deadline: z
    .string()
    .refine(isDateString, 'Invalid date')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

const applicationStatus = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

const scheduleInterview = z.object({
  application_id: z.coerce.number().int().positive(),
  scheduled_at: z.string().refine(isDateString, 'Invalid date/time'),
  mode: z.string().trim().min(1).max(30),
  meeting_link: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

const createUser = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  role: z.enum(ROLES),
});

const aiConfig = z.object({
  threshold: z.coerce.number().min(0).max(1),
});

module.exports = {
  APPLICATION_STATUSES,
  idParam,
  login,
  studentProfile,
  createJob,
  applicationStatus,
  scheduleInterview,
  createUser,
  aiConfig,
};
