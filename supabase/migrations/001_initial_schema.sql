-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own saves" ON public.game_saves
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saves" ON public.game_saves
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Set up RLS for user achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX user_id_idx ON public.user_achievements (user_id);
CREATE INDEX achievement_id_idx ON public.user_achievements (achievement_id);

-- Function to unlock achievements
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  achievement_name TEXT
) RETURNS VOID AS $
DECLARE
  v_achievement_id UUID;
BEGIN
  -- Get the achievement ID
  SELECT id INTO v_achievement_id
  FROM public.achievements
  WHERE name = achievement_name;
  
  -- If achievement exists and not already unlocked
  IF v_achievement_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_achievements
    WHERE user_id = auth.uid() AND achievement_id = v_achievement_id
  ) THEN
    -- Insert new achievement for user
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (auth.uid(), v_achievement_id);
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Game saves table
CREATE TABLE IF NOT EXISTS public.game_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  state_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS for game saves
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saves" ON public.game_saves
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saves" ON public.game_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "