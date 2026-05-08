CREATE TABLE camping_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES camping_essentials(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_name)
);

ALTER TABLE camping_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select" ON camping_likes FOR SELECT USING (true);
CREATE POLICY "insert" ON camping_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete" ON camping_likes FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE camping_likes;
