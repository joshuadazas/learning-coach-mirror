export interface FormData {
  name: string;
  email: string;
  country: string;
  area: string;
  current_position: string;
  time_in_current_role: string;
  short_term_goals: string;
  long_term_goals: string;
  hard_skills: string;
  soft_skills: string;
  learning_preferences: string[];
  price_preference: 'Any' | 'Free' | 'Paid';
  time_available_per_week: string;
  additional_comments: string;
}

export interface LearningResource {
  title: string;
  type: 'Podcast' | 'Book' | 'Course' | 'Article' | 'Video';
  url: string;
  price: string;
  description: string;
  keywords: string[];
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface LearningDrop {
  message: string;
  sources: SearchSource[];
}
