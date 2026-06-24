
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Scores (one row per completed level attempt)
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level >= 1 AND level <= 20),
  points INT NOT NULL CHECK (points >= 0),
  time_seconds INT NOT NULL CHECK (time_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scores_user_level_idx ON public.scores(user_id, level);
CREATE INDEX scores_level_points_idx ON public.scores(level, points DESC);
GRANT SELECT ON public.scores TO anon, authenticated;
GRANT INSERT ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores are viewable by everyone" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup; username comes from raw_user_meta_data.username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  -- ensure uniqueness by appending suffix if needed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) THEN
    uname := uname || '_' || substr(NEW.id::text, 1, 6);
  END IF;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, uname);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leaderboard views
CREATE OR REPLACE VIEW public.leaderboard_global AS
  SELECT p.id AS user_id, p.username, COALESCE(SUM(s.points), 0)::INT AS total_points,
         COUNT(s.id)::INT AS plays, MAX(s.level) AS highest_level
  FROM public.profiles p
  LEFT JOIN public.scores s ON s.user_id = p.id
  GROUP BY p.id, p.username;
GRANT SELECT ON public.leaderboard_global TO anon, authenticated;

CREATE OR REPLACE VIEW public.leaderboard_per_level AS
  SELECT s.level, s.user_id, p.username,
         MAX(s.points) AS best_points,
         MIN(s.time_seconds) AS best_time
  FROM public.scores s JOIN public.profiles p ON p.id = s.user_id
  GROUP BY s.level, s.user_id, p.username;
GRANT SELECT ON public.leaderboard_per_level TO anon, authenticated;
