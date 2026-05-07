-- Trips table
CREATE TABLE trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Trip members
CREATE TABLE trip_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, email)
);

-- Checklist items
CREATE TABLE checklist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  completed boolean DEFAULT false,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Trips: viewable by creator or members
CREATE POLICY "Users can view trips they belong to" ON trips
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() OR email = auth.email())
  );

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trip creator can update" ON trips
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Trip creator can delete" ON trips
  FOR DELETE USING (created_by = auth.uid());

-- Trip members: viewable by trip participants
CREATE POLICY "Trip participants can view members" ON trip_members
  FOR SELECT USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
    OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() OR email = auth.email())
  );

CREATE POLICY "Trip creator can manage members" ON trip_members
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

CREATE POLICY "Trip creator can remove members" ON trip_members
  FOR DELETE USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Checklist items: editable by trip participants
CREATE POLICY "Trip participants can view items" ON checklist_items
  FOR SELECT USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
    OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() OR email = auth.email())
  );

CREATE POLICY "Trip participants can add items" ON checklist_items
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
    OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() OR email = auth.email())
  );

CREATE POLICY "Trip participants can update items" ON checklist_items
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
    OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() OR email = auth.email())
  );

CREATE POLICY "Item creator or trip owner can delete items" ON checklist_items
  FOR DELETE USING (
    created_by = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Auto-add creator as owner member when trip is created
CREATE OR REPLACE FUNCTION add_trip_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_members (trip_id, user_id, email, role)
  VALUES (NEW.id, NEW.created_by, (SELECT email FROM auth.users WHERE id = NEW.created_by), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trip_created
  AFTER INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION add_trip_owner();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
