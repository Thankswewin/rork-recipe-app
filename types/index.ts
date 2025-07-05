export interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  categoryColor: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  isFavorite: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  backgroundColor: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  notifications: number;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}