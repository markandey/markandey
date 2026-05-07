-- Camping plans (the random URL slug is the id)
CREATE TABLE camping_plans (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Essentials checklist
CREATE TABLE camping_essentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  item text NOT NULL,
  brought_by text NOT NULL DEFAULT 'TBD',
  checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Signups
CREATE TABLE camping_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notes
CREATE TABLE camping_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text REFERENCES camping_plans(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: allow public (anon) access to all tables
-- Security is via unguessable plan IDs

ALTER TABLE camping_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_essentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE camping_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON camping_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_essentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_signups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON camping_notes FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE camping_essentials;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE camping_notes;
