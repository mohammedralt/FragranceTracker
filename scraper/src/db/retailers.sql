-- Run this in Supabase SQL editor to update retailer records
-- Replaces old/incorrect entries with the verified list

DELETE FROM retailers;

INSERT INTO retailers (key, name, base_url, currency) VALUES
  ('fragrancebuy',    'FragranceBuy.ca',     'https://www.fragrancebuy.ca',           'CAD'),
  ('beautyhouse',     'Beauty House',         'https://beautyhouse.com',               'USD'),
  ('arvella',         'Arvella Fragrance',    'https://arvellafragrance.com',          'USD'),
  ('aura',            'Aura Fragrance',       'https://www.aurafragrance.com',         'USD'),
  ('venba',           'Venba Fragrance',      'https://www.venbafragrance.com',        'USD'),
  ('olfactory',       'Olfactory Factory',    'https://www.olfactoryfactoryllc.com',   'USD'),
  ('fragranceneveah', 'Fragrance Nevaeh',     'https://fragrance-nevaeh.com',          'USD'),
  ('emntscents',      'Emnt Scents',          'https://emntscents.com',                'USD'),
  ('fragrancelord',   'Fragrance Lord',       'https://www.fragrancelord.com',         'USD'),
  ('jomashop',        'Jomashop',             'https://www.jomashop.com',              'USD')
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name,
      base_url = EXCLUDED.base_url,
      currency = EXCLUDED.currency,
      is_active = true;
