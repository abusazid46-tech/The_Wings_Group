UPDATE "ServiceCategory"
SET
  "name" = 'Tank Wash',
  "slug" = 'tank-wash',
  "description" = 'Overhead and underground water tank wash packages.',
  "sortOrder" = 2,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'tankwash'
  AND NOT EXISTS (SELECT 1 FROM "ServiceCategory" WHERE "slug" = 'tank-wash');

UPDATE "ServiceCategory"
SET
  "name" = 'AC & Repair',
  "slug" = 'ac-repair',
  "description" = 'AC servicing, repair, and electrical support.',
  "sortOrder" = 3,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'ac-appliance'
  AND NOT EXISTS (SELECT 1 FROM "ServiceCategory" WHERE "slug" = 'ac-repair');

UPDATE "ServiceCategory"
SET
  "name" = 'Deep Clean',
  "slug" = 'deep-clean',
  "description" = 'Complete home and room deep cleaning packages.',
  "sortOrder" = 5,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'cleaning'
  AND NOT EXISTS (SELECT 1 FROM "ServiceCategory" WHERE "slug" = 'deep-clean');

INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('cat_toilet_bath', 'Toilet & Bath', 'toilet-bath', 'Toilet, bathroom, and attached washroom cleaning packages.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_tank_wash', 'Tank Wash', 'tank-wash', 'Overhead and underground water tank wash packages.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_ac_repair', 'AC & Repair', 'ac-repair', 'AC servicing, repair, and electrical support.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_sofa_clean', 'Sofa Clean', 'sofa-clean', 'Sofa, couch, upholstery, and fabric cleaning.', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_deep_clean', 'Deep Clean', 'deep-clean', 'Complete home and room deep cleaning packages.', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_kitchen_appliances', 'Kitchen & Appliances', 'kitchen-appliances', 'Kitchen, chimney, and appliance cleaning services.', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_aya_housemaid', 'Aya and Housemaid', 'aya-housemaid', 'Maid, aya, baby care, and patient care services.', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_pest_control', 'Pest Control', 'pest-control', 'Pest control packages for homes and commercial spaces.', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_painter_plumber', 'Painter & Plumber', 'painter-plumber', 'Painting, plumbing, carpenter, and repair services.', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_saloon_spa', 'Saloon & Spa', 'saloon-spa', 'Salon, spa, beauty, and massage services.', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_security', 'Security', 'security', 'Security and facility management services.', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "ServiceCategory"
SET
  "isActive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" NOT IN (
  'toilet-bath',
  'tank-wash',
  'ac-repair',
  'sofa-clean',
  'deep-clean',
  'kitchen-appliances',
  'aya-housemaid',
  'pest-control',
  'painter-plumber',
  'saloon-spa',
  'security'
);
