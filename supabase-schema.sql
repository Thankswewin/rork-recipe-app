-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT[] NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view recipes" ON recipes;
DROP POLICY IF EXISTS "Users can create recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for recipes
CREATE POLICY "Anyone can view recipes" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with security definer to bypass RLS
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.recipes TO anon, authenticated;
GRANT ALL ON public.favorites TO anon, authenticated;