-- Multimodal AI Recipe Chat App Database Schema
-- This migration adds support for AI chefs, chat sessions, and multimodal messages

-- AI Chef Profiles Table
CREATE TABLE ai_chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  personality JSONB DEFAULT '{}',
  knowledge_base JSONB DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  creator_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Sessions Table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  chef_id UUID REFERENCES ai_chefs(id) NOT NULL,
  title TEXT,
  context JSONB DEFAULT '{}', -- Cooking context, ingredients, recipe progress
  session_type TEXT CHECK (session_type IN ('cooking', 'recipe_planning', 'general')) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('user', 'ai')) NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'voice', 'image', 'video', 'file')) NOT NULL,
  content TEXT, -- Text content or file URLs
  metadata JSONB DEFAULT '{}', -- Voice duration, image analysis, etc.
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'completed',
  reply_to_id UUID REFERENCES messages(id), -- For threaded conversations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Messages Table (for unmute.sh integration)
CREATE TABLE voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  unmute_session_id TEXT, -- unmute.sh session identifier
  processing_status TEXT CHECK (processing_status IN ('pending', 'transcribing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image/Video Analysis Table
CREATE TABLE media_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
  analysis_results JSONB DEFAULT '{}', -- AI vision analysis results
  detected_objects TEXT[] DEFAULT '{}',
  detected_ingredients TEXT[] DEFAULT '{}',
  cooking_stage TEXT,
  confidence_score DECIMAL(3,2),
  processing_status TEXT CHECK (processing_status IN ('pending', 'analyzing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe Context Table (for tracking cooking progress)
CREATE TABLE recipe_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID, -- Reference to recipes table if exists
  recipe_name TEXT,
  ingredients JSONB DEFAULT '[]',
  steps JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  cooking_stage TEXT,
  estimated_completion_time INTERVAL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chef Ratings Table
CREATE TABLE chef_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES ai_chefs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  chat_session_id UUID REFERENCES chat_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chef_id, user_id)
);

-- User Preferences Table
CREATE TABLE user_chat_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  preferred_chef_id UUID REFERENCES ai_chefs(id),
  voice_enabled BOOLEAN DEFAULT true,
  camera_enabled BOOLEAN DEFAULT true,
  auto_transcribe BOOLEAN DEFAULT true,
  language_preference TEXT DEFAULT 'en',
  dietary_restrictions TEXT[] DEFAULT '{}',
  cooking_skill_level TEXT CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_chef_id ON chat_sessions(chef_id);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(is_active, last_message_at DESC);
CREATE INDEX idx_messages_chat_session ON messages(chat_session_id, created_at DESC);
CREATE INDEX idx_messages_content_type ON messages(content_type);
CREATE INDEX idx_ai_chefs_public ON ai_chefs(is_public, rating DESC);
CREATE INDEX idx_ai_chefs_creator ON ai_chefs(creator_id);
CREATE INDEX idx_voice_messages_status ON voice_messages(processing_status);
CREATE INDEX idx_media_analysis_status ON media_analysis(processing_status);

-- RLS (Row Level Security) Policies
ALTER TABLE ai_chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chat_preferences ENABLE ROW LEVEL SECURITY;

-- AI Chefs policies
CREATE POLICY "Users can view public chefs" ON ai_chefs
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create chefs" ON ai_chefs
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own chefs" ON ai_chefs
  FOR UPDATE USING (creator_id = auth.uid());

-- Chat Sessions policies
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages from their chat sessions" ON messages
  FOR SELECT USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their chat sessions" ON messages
  FOR INSERT WITH CHECK (
    chat_session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Voice Messages policies
CREATE POLICY "Users can view voice messages from their chats" ON voice_messages
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN chat_sessions cs ON m.chat_session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create voice messages in their chats" ON voice_messages
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN chat_sessions cs ON m.chat_session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

-- Media Analysis policies
CREATE POLICY "Users can view media analysis from their chats" ON media_analysis
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN chat_sessions cs ON m.chat_session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create media analysis in their chats" ON media_analysis
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN chat_sessions cs ON m.chat_session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

-- Recipe Contexts policies
CREATE POLICY "Users can view recipe contexts from their chat sessions" ON recipe_contexts
  FOR SELECT USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipe contexts in their chat sessions" ON recipe_contexts
  FOR ALL USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Chef Ratings policies
CREATE POLICY "Users can view all chef ratings" ON chef_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON chef_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON chef_ratings
  FOR UPDATE USING (user_id = auth.uid());

-- User Preferences policies
CREATE POLICY "Users can view their own preferences" ON user_chat_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences" ON user_chat_preferences
  FOR ALL USING (user_id = auth.uid());

-- Insert default AI chef
INSERT INTO ai_chefs (
  name,
  description,
  personality,
  knowledge_base,
  specialties,
  is_public,
  is_default
) VALUES (
  'Chef Adunni',
  'Your friendly AI cooking assistant with expertise in global cuisines and cooking techniques.',
  '{
    "personality_traits": ["helpful", "encouraging", "knowledgeable", "patient"],
    "communication_style": "friendly and supportive",
    "expertise_level": "professional chef"
  }',
  '{
    "cuisines": ["Italian", "French", "Asian", "Mediterranean", "American", "Mexican"],
    "techniques": ["sautéing", "roasting", "grilling", "baking", "steaming", "braising"],
    "dietary_knowledge": ["vegetarian", "vegan", "gluten-free", "keto", "paleo"]
  }',
  ARRAY['general cooking', 'recipe development', 'cooking techniques', 'ingredient substitution'],
  true,
  true
);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_ai_chefs_updated_at BEFORE UPDATE ON ai_chefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_contexts_updated_at BEFORE UPDATE ON recipe_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_chat_preferences_updated_at BEFORE UPDATE ON user_chat_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update chef ratings
CREATE OR REPLACE FUNCTION update_chef_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_chefs 
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM chef_ratings 
        WHERE chef_id = COALESCE(NEW.chef_id, OLD.chef_id)
    )
    WHERE id = COALESCE(NEW.chef_id, OLD.chef_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update chef ratings
CREATE TRIGGER update_chef_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chef_ratings
    FOR EACH ROW EXECUTE FUNCTION update_chef_rating();

-- Function to update last message timestamp
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.chat_session_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last message timestamp
CREATE TRIGGER update_chat_session_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_last_message();