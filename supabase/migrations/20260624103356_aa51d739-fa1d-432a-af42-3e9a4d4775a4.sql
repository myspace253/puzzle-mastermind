
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Scores (one row per completed level attempt)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scores'
  ) THEN
    CREATE TABLE public.scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      level INT CHECK (level >= 1 AND level <= 20),
      points INT CHECK (points >= 0),
      time_seconds INT CHECK (time_seconds >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.scores ADD COLUMN user_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.scores ADD COLUMN level INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'points'
  ) THEN
    ALTER TABLE public.scores ADD COLUMN points INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'time_seconds'
  ) THEN
    ALTER TABLE public.scores ADD COLUMN time_seconds INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.scores ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS scores_user_level_idx ON public.scores(user_id, level);
CREATE INDEX IF NOT EXISTS scores_level_points_idx ON public.scores(level, points DESC);
GRANT SELECT ON public.scores TO anon, authenticated;
GRANT INSERT ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'scores' AND policyname = 'Scores are viewable by everyone'
  ) THEN
    CREATE POLICY "Scores are viewable by everyone" ON public.scores FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'scores' AND policyname = 'Users can insert own scores'
  ) THEN
    CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Leaderboard views
CREATE OR REPLACE VIEW public.leaderboard_global AS
  SELECT p.id AS user_id, p.username,
         COALESCE(SUM(COALESCE(s.points, 0)), 0)::INT AS total_points,
         COUNT(s.user_id)::INT AS plays,
         MAX(COALESCE(s.level, 0)) AS highest_level
  FROM public.profiles p
  LEFT JOIN public.scores s ON s.user_id = p.id
  GROUP BY p.id, p.username;
GRANT SELECT ON public.leaderboard_global TO anon, authenticated;

CREATE OR REPLACE VIEW public.leaderboard_per_level AS
  SELECT s.level, s.user_id, p.username,
         MAX(COALESCE(s.points, 0)) AS best_points,
         MIN(COALESCE(s.time_seconds, 0)) AS best_time
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  GROUP BY s.level, s.user_id, p.username;
GRANT SELECT ON public.leaderboard_per_level TO anon, authenticated;
