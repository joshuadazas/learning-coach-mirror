
import type { FormData } from './types';

export const LEARNING_PREFERENCES: string[] = ['Podcasts', 'Books', 'Courses', 'Articles', 'Videos'];

export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1u-W7UOxT1hQlq80c77OfQ7nSFpD3o2o-mslHekaM_Z4/export?format=csv&gid=0';

export const MOCK_WORKFLOW_DATA: FormData = {
  name: 'Alex Chen',
  email: 'alex.chen@ontop.com',
  country: 'United States',
  area: 'Engineering',
  current_position: 'Software Engineer II',
  time_in_current_role: '1 year 2 months',
  short_term_goals: 'Get promoted to Senior Software Engineer. I want to improve my system design skills and become more proficient in our backend stack (Go, Kubernetes).',
  long_term_goals: 'Transition into a Tech Lead role within the next 2 years. I want to be able to mentor junior engineers and lead a small project from a technical perspective.',
  hard_skills: 'System Design, Go (Golang), Kubernetes',
  soft_skills: 'Mentorship, Technical Leadership, Communication',
  learning_preferences: ['Courses', 'Books', 'Articles'],
  time_available_per_week: '5-7 hours',
  additional_comments: 'I\'m really interested in distributed systems and microservices architecture. Any resources on those topics would be great!',
};