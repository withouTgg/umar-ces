CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text NOT NULL,
  description text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL,
  best_months text[] NOT NULL DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.destinations TO anon;
GRANT SELECT ON public.destinations TO authenticated;
GRANT ALL ON public.destinations TO service_role;

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Destinations are publicly readable"
ON public.destinations FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.destinations (name, region, description, tags, difficulty, best_months, latitude, longitude) VALUES
('Baltit Fort','Hunza','700-year-old Tibetan-influenced fort with guided tours and rooftop valley views','{history,photography}','easy','{April,May,September,October}',36.3256,74.6698),
('Eagle''s Nest Point','Hunza','Sunrise/sunset viewpoint over Rakaposhi and Lady Finger Peak','{photography,nature}','easy','{April,May,September,October}',36.3244,74.6903),
('Duiker Hill','Hunza','Highest village in the valley, panoramic sunrise hike known as the Roof of Hunza','{adventure,nature,photography}','moderate','{April,May,September,October}',36.3244,74.6907),
('Katpana Cold Desert','Skardu','Rare cold desert with sand dunes set against snow-capped peaks','{nature,photography}','easy','{April,May,June,September,October}',35.3158,75.5996),
('Kharphocho Fort','Skardu','16th-century hilltop fort with a moderate uphill hike and sunset views over Skardu','{history,adventure}','moderate','{April,May,September,October}',35.3041,75.6394),
('Chunda Valley','Skardu','Terraced orchards and green fields above Skardu city, best in spring blossom season','{nature,relaxation,photography}','easy','{April,May,September,October}',35.3373,75.4954),
('Naran Valley','Naran/Kaghan','Lakeside base town known for river rafting on the Kunhar and cool mountain weather','{adventure,nature}','easy','{June,July,August,September}',34.9093,73.6507),
('Fizagat','Swat','Riverside park and base town for day trips to Malam Jabba and Kalam','{relaxation,nature}','easy','{April,May,June,September,October}',34.7954,72.4001),
('Jarogo Waterfall','Swat','200ft waterfall reached via a 1-2 hour hike, best visited in summer','{adventure,nature}','moderate','{June,July,August}',35.1019,72.2132),
('Fairy Meadows National Park','Fairy Meadows','Face-to-face views of Nanga Parbat, reached via a rough jeep track and hike','{adventure,nature,photography}','hard','{May,June,July,August,September}',35.3832,74.5717),
('Deosai National Park','Deosai','World''s second-highest plateau at ~4,100m, alpine plains and wildlife','{nature,adventure,photography}','hard','{June,July,August,September}',34.9705,75.4718);
