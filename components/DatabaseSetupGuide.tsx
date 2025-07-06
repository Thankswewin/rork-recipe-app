import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Copy, CheckCircle, AlertCircle, Database } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import * as Clipboard from 'expo-clipboard';

// Safe platform detection
const isWeb = () => {
  try {
    return Platform.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
};

export default function DatabaseSetupGuide() {
  const { colors } = useTheme();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = async (text: string, stepNumber: number) => {
    try {
      if (isWeb()) {
        // Use web clipboard API
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } else {
        await Clipboard.setStringAsync(text);
      }
      setCopiedStep(stepNumber);
      setTimeout(() => setCopiedStep(null), 2000);
      Alert.alert('Copied!', 'SQL script copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const sqlScript = `-- Run this in your Supabase SQL Editor
-- This script sets up all required tables and policies

-- Clean setup script for Supabase database
-- This script safely handles existing policies and tables

-- First, drop all existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on storage.objects
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
    
    -- Drop all policies on our tables
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('conversations', 'conversation_participants', 'messages', 'profiles')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || (SELECT tablename FROM pg_policies WHERE policyname = r.policyname AND schemaname = 'public' LIMIT 1);
    END LOOP;
END $$;

-- Drop existing tables and functions to start fresh
DROP TRIGGER IF EXISTS create_profile_after_signup ON auth.users;
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS create_profile_for_new_user();
DROP FUNCTION IF EXISTS update_conversation_last_message();
DROP FUNCTION IF EXISTS find_conversation_between_users(uuid, uuid);

DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT
);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (email is required, username is optional initially)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Security policies for conversations
CREATE POLICY "Users can only view conversations they are participants in"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants 
      WHERE conversation_id = conversations.id
    )
  );

CREATE POLICY "Users can insert conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (true);

-- Security policies for conversation_participants
CREATE POLICY "Users can view participants in conversations they are part of"
  ON conversation_participants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants 
      WHERE conversation_id = conversation_participants.conversation_id
    )
  );

CREATE POLICY "Users can insert participants"
  ON conversation_participants
  FOR INSERT
  WITH CHECK (true);

-- Security policies for messages
CREATE POLICY "Users can only view messages in conversations they are part of"
  ON messages
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id
    )
  );

CREATE POLICY "Users can send messages in conversations they are part of"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT user_id FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id
    )
  );

-- Security policies for profiles
CREATE POLICY "Users can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );

-- Function to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_message_at
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER create_profile_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Function to find conversation between two users
CREATE OR REPLACE FUNCTION find_conversation_between_users(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.id IN (
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    WHERE cp1.user_id = user1_id
  )
  AND c.id IN (
    SELECT cp2.conversation_id
    FROM conversation_participants cp2
    WHERE cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Database size={32} color={colors.tint} />
          <Text style={[styles.title, { color: colors.text }]}>Database Setup Required</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your Supabase database needs to be configured with the required tables and policies.
          </Text>
        </View>

        <View style={styles.steps}>
          <View style={[styles.step, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Open Supabase Dashboard</Text>
            </View>
            <Text style={[styles.stepDescription, { color: colors.muted }]}>
              Go to your Supabase project dashboard and navigate to the SQL Editor.
            </Text>
          </View>

          <View style={[styles.step, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Run SQL Script</Text>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: copiedStep === 2 ? colors.tint : 'transparent', borderColor: colors.tint }]}
                onPress={() => copyToClipboard(sqlScript, 2)}
              >
                {copiedStep === 2 ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <Copy size={16} color={colors.tint} />
                )}
                <Text style={[styles.copyButtonText, { color: copiedStep === 2 ? 'white' : colors.tint }]}>
                  {copiedStep === 2 ? 'Copied!' : 'Copy SQL'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.stepDescription, { color: colors.muted }]}>
              Copy and paste the SQL script below into the SQL Editor and run it. This will create all necessary tables, policies, and functions.
            </Text>
          </View>

          <View style={[styles.step, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Restart App</Text>
            </View>
            <Text style={[styles.stepDescription, { color: colors.muted }]}>
              After running the SQL script, restart the app to refresh the database connection.
            </Text>
          </View>
        </View>

        <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={[styles.warningText, { color: '#92400E' }]}>
            Important: This script will drop existing tables if they exist. Make sure to backup any important data first.
          </Text>
        </View>

        <View style={[styles.sqlContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Text style={[styles.sqlLabel, { color: colors.text }]}>SQL Script:</Text>
          <ScrollView style={styles.sqlScroll} horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.sqlText, { color: colors.muted }]}>{sqlScript}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  steps: {
    marginBottom: 24,
  },
  step: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  sqlContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    maxHeight: 300,
  },
  sqlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sqlScroll: {
    flex: 1,
  },
  sqlText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});