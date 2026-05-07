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

CREATE POLICY "select" ON camping_plans FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON camping_plans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete" ON camping_plans FOR DELETE USING (true);

CREATE POLICY "select" ON camping_essentials FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_essentials FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON camping_essentials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete" ON camping_essentials FOR DELETE USING (true);

CREATE POLICY "select" ON camping_signups FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON camping_signups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete" ON camping_signups FOR DELETE USING (true);

CREATE POLICY "select" ON camping_notes FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON camping_notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete" ON camping_notes FOR DELETE USING (true);

CREATE POLICY "select" ON camping_logs FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON camping_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete" ON camping_logs FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE camping_essentials;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_logs;
