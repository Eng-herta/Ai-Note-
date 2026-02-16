
export interface Note {
  id: string;
  guest_id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  note_type?: string;
  tags: string[];
  key_points?: string[];
  common_topics?: string[];
  suggested_links?: string[];
  created_at: string;
  updated_at: string;
}

export interface GithubConfig {
  repoUrl: string;
  token: string;
  branch: string;
}

export interface Task {
  id: string;
  note_id: string;
  guest_id: string;
  task_text: string;
  completed: boolean;
}

export interface Event {
  id: string;
  guest_id: string;
  note_id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface NoteImage {
  id: string;
  guest_id: string;
  note_id: string;
  image_url: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}

export enum AIActionType {
  ANALYZE = 'ANALYZE',
  CHAT = 'CHAT'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AIAnalysisResponse {
  improved_title: string;
  summary: string;
  category: string;
  note_type: string;
  tags: string[];
  key_points: string[];
  action_items: string[];
  common_topics: string[];
  suggested_links: string[];
  suggested_events: Array<{
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
  }>;
}
