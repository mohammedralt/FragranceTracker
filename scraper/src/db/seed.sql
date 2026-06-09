-- Niche fragrance seed data
-- Run this AFTER schema.sql
-- Paste into Supabase SQL editor

INSERT INTO fragrances (name, brand, gender, fragrance_type) VALUES
  -- Creed
  ('Aventus',                    'Creed',                   'male',   'EDP'),
  ('Green Irish Tweed',          'Creed',                   'male',   'EDT'),
  ('Viking',                     'Creed',                   'male',   'EDP'),
  ('Silver Mountain Water',      'Creed',                   'male',   'EDT'),
  ('Royal Oud',                  'Creed',                   'unisex', 'EDP'),
  ('Himalaya',                   'Creed',                   'male',   'EDT'),
  ('Millisime Imperial',         'Creed',                   'unisex', 'EDT'),

  -- Tom Ford Private Blend
  ('Tobacco Vanille',            'Tom Ford',                'unisex', 'EDP'),
  ('Oud Wood',                   'Tom Ford',                'unisex', 'EDP'),
  ('Black Orchid',               'Tom Ford',                'unisex', 'EDP'),
  ('Neroli Portofino',           'Tom Ford',                'unisex', 'EDP'),
  ('Lost Cherry',                'Tom Ford',                'unisex', 'EDP'),
  ('Soleil Blanc',               'Tom Ford',                'unisex', 'EDP'),
  ('Noir de Noir',               'Tom Ford',                'unisex', 'EDP'),
  ('Rose Prick',                 'Tom Ford',                'unisex', 'EDP'),

  -- Parfums de Marly
  ('Layton',                     'Parfums de Marly',        'male',   'EDP'),
  ('Herod',                      'Parfums de Marly',        'male',   'EDP'),
  ('Pegasus',                    'Parfums de Marly',        'male',   'EDP'),
  ('Delina',                     'Parfums de Marly',        'female', 'EDP'),
  ('Sedley',                     'Parfums de Marly',        'male',   'EDP'),
  ('Greenley',                   'Parfums de Marly',        'male',   'EDP'),
  ('Carlisle',                   'Parfums de Marly',        'unisex', 'EDP'),

  -- Maison Francis Kurkdjian
  ('Baccarat Rouge 540',         'Maison Francis Kurkdjian','unisex', 'EDP'),
  ('Baccarat Rouge 540 Extrait', 'Maison Francis Kurkdjian','unisex', 'Extrait'),
  ('Oud Satin Mood',             'Maison Francis Kurkdjian','unisex', 'EDP'),
  ('Grand Soir',                 'Maison Francis Kurkdjian','unisex', 'EDP'),
  ('Aqua Universalis',           'Maison Francis Kurkdjian','unisex', 'EDT'),

  -- Byredo
  ('Gypsy Water',                'Byredo',                  'unisex', 'EDP'),
  ('Bal d''Afrique',             'Byredo',                  'unisex', 'EDP'),
  ('Mojave Ghost',               'Byredo',                  'unisex', 'EDP'),
  ('Bibliotheque',               'Byredo',                  'unisex', 'EDP'),
  ('Blanche',                    'Byredo',                  'female', 'EDP'),
  ('Sundazed',                   'Byredo',                  'unisex', 'EDP'),

  -- Amouage
  ('Interlude Man',              'Amouage',                 'male',   'EDP'),
  ('Gold Man',                   'Amouage',                 'male',   'EDP'),
  ('Reflection Man',             'Amouage',                 'male',   'EDP'),
  ('Memoir Man',                 'Amouage',                 'male',   'EDP'),
  ('Jubilation XXV Man',         'Amouage',                 'male',   'EDP'),
  ('Interlude Woman',            'Amouage',                 'female', 'EDP'),

  -- Maison Margiela Replica
  ('Jazz Club',                  'Maison Margiela',         'unisex', 'EDT'),
  ('Beach Walk',                 'Maison Margiela',         'unisex', 'EDT'),
  ('By the Fireplace',           'Maison Margiela',         'unisex', 'EDT'),
  ('Flower Market',              'Maison Margiela',         'unisex', 'EDT'),
  ('Sailing Day',                'Maison Margiela',         'unisex', 'EDT'),
  ('Coffee Break',               'Maison Margiela',         'unisex', 'EDT'),

  -- Xerjoff
  ('Naxos',                      'Xerjoff',                 'unisex', 'EDP'),
  ('Nio',                        'Xerjoff',                 'unisex', 'EDP'),
  ('Alexandria II',              'Xerjoff',                 'unisex', 'EDP'),
  ('Lira',                       'Xerjoff',                 'unisex', 'EDP'),

  -- Initio
  ('Oud for Greatness',          'Initio Parfums Prives',   'unisex', 'EDP'),
  ('Atomic Rose',                'Initio Parfums Prives',   'unisex', 'EDP'),
  ('Side Effect',                'Initio Parfums Prives',   'unisex', 'EDP'),
  ('Rehab',                      'Initio Parfums Prives',   'unisex', 'EDP'),

  -- Kilian
  ('Black Phantom',              'Kilian Paris',            'unisex', 'EDP'),
  ('Good Girl Gone Bad',         'Kilian Paris',            'female', 'EDP'),
  ('Angels'' Share',             'Kilian Paris',            'unisex', 'EDP'),
  ('Love Don''t Be Shy',         'Kilian Paris',            'unisex', 'EDP'),

  -- Nishane
  ('Hacivat',                    'Nishane',                 'unisex', 'Extrait'),
  ('Ani',                        'Nishane',                 'unisex', 'Extrait'),
  ('Sultan Vetiver',             'Nishane',                 'unisex', 'Extrait'),
  ('Wulong Cha',                 'Nishane',                 'unisex', 'Extrait'),

  -- Roja Parfums
  ('Elysium Pour Homme',         'Roja Parfums',            'male',   'Parfum'),
  ('Scandal Pour Homme',         'Roja Parfums',            'male',   'Parfum'),
  ('Enigma Pour Homme',          'Roja Parfums',            'male',   'Parfum'),
  ('Danger Pour Homme',          'Roja Parfums',            'male',   'EDP'),

  -- Serge Lutens
  ('Ambre Sultan',               'Serge Lutens',            'unisex', 'EDP'),
  ('Chergui',                    'Serge Lutens',            'unisex', 'EDP'),
  ('Feminite du Bois',           'Serge Lutens',            'unisex', 'EDP'),

  -- Orto Parisi
  ('Megamare',                   'Orto Parisi',             'unisex', 'EDP'),
  ('Terroni',                    'Orto Parisi',             'unisex', 'EDP'),
  ('Seminalis',                  'Orto Parisi',             'unisex', 'EDP'),

  -- Zoologist
  ('Bat',                        'Zoologist',               'unisex', 'EDP'),
  ('Hummingbird',                'Zoologist',               'unisex', 'EDP'),
  ('Civet',                      'Zoologist',               'unisex', 'EDP')

ON CONFLICT (name, brand) DO NOTHING;
