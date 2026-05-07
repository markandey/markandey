CREATE TABLE camping_plans (
  id text PRIMARY KEY,
  content text NOT NULL DEFAULT '',
  essentials_content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE camping_essentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  item text NOT NULL,
  brought_by text NOT NULL DEFAULT 'TBD',
  checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE camping_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE camping_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE camping_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  who text NOT NULL,
  what text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE camping_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_essentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON camping_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_essentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_signups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_logs FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE camping_essentials;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_logs;
