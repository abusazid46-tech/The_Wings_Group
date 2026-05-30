WITH upsert_category AS (
  INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
  VALUES (
    'cat_tank_wash',
    'Tankwash',
    'tankwash',
    'Overhead and underground water tank cleaning packages.',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
),
selected_category AS (
  SELECT "id" FROM upsert_category
  UNION
  SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'tankwash'
  LIMIT 1
)
INSERT INTO "Service" (
  "id", "categoryId", "name", "slug", "description", "icon", "imageUrl", "basePrice",
  "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel",
  "durationMin", "sortOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  data."id", selected_category."id", data."name", data."slug", data."description", data."icon", data."imageUrl", data."basePrice"::INTEGER,
  data."groupLabel", data."priceLabel", data."originalPrice"::INTEGER, data."originalPriceLabel", data."discountLabel",
  data."durationMin"::INTEGER, data."sortOrder"::INTEGER, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM selected_category
CROSS JOIN (
  VALUES
    ('svc_tank_500_one', 'One 500 litre overhead tank wash', 'one-500-litre-overhead-tank-wash', 'Cleaning and sanitization for one 500 litre overhead tank.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 499, '500 Litre Overhead Tank Wash', NULL, NULL, NULL, NULL, 90, 1),
    ('svc_tank_500_two', 'Two 500 litre overhead tank wash', 'two-500-litre-overhead-tank-wash', 'Cleaning and sanitization for two 500 litre overhead tanks.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 848, '500 Litre Overhead Tank Wash', '848.3', 998, '998', '15% discount', 130, 2),
    ('svc_tank_500_three', 'Three or more 500 litre overhead tank wash', 'three-or-more-500-litre-overhead-tank-wash', 'Cleaning and sanitization for three or more 500 litre overhead tanks.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 1198, '500 Litre Overhead Tank Wash', '1198.4', 1498, '1498', '20% discount', 180, 3),
    ('svc_tank_1000_one', 'One 1000 litre overhead tank wash', 'one-1000-litre-overhead-tank-wash', 'Cleaning and sanitization for one 1000 litre overhead tank.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 599, '1000 Litre Overhead Tank Wash', NULL, NULL, NULL, NULL, 100, 4),
    ('svc_tank_1000_two', 'Two 1000 litre overhead tank wash', 'two-1000-litre-overhead-tank-wash', 'Cleaning and sanitization for two 1000 litre overhead tanks.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 1018, '1000 Litre Overhead Tank Wash', '1018.3', 1198, '1198', '15% discount', 150, 5),
    ('svc_tank_1000_three', 'Three or more 1000 litre overhead tank wash', 'three-or-more-1000-litre-overhead-tank-wash', 'Cleaning and sanitization for three or more 1000 litre overhead tanks.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 1438, '1000 Litre Overhead Tank Wash', '1437.6', 1797, '1797', '20% discount', 210, 6),
    ('svc_underground_tank_bleach', 'Underground tank wash with 3-layer bleaching treatment', 'underground-tank-wash-with-3-layer-bleaching-treatment', 'Underground tank wash with three-layer bleaching treatment.', 'tank', 'https://images.unsplash.com/photo-1581091870622-2f8e93f08e54?w=500&q=85&fit=crop&crop=center', 2550, 'Underground Tank Wash', '2550', 3000, '3000', '15% discount', 240, 7)
) AS data("id", "name", "slug", "description", "icon", "imageUrl", "basePrice", "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel", "durationMin", "sortOrder")
ON CONFLICT ("slug") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "imageUrl" = EXCLUDED."imageUrl",
  "basePrice" = EXCLUDED."basePrice",
  "groupLabel" = EXCLUDED."groupLabel",
  "priceLabel" = EXCLUDED."priceLabel",
  "originalPrice" = EXCLUDED."originalPrice",
  "originalPriceLabel" = EXCLUDED."originalPriceLabel",
  "discountLabel" = EXCLUDED."discountLabel",
  "durationMin" = EXCLUDED."durationMin",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH upsert_category AS (
  INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
  VALUES (
    'cat_kitchen_appliances',
    'Kitchen & Appliances',
    'kitchen-appliances',
    'Kitchen, chimney, appliance, fan, window, and door cleaning services.',
    5,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
),
selected_category AS (
  SELECT "id" FROM upsert_category
  UNION
  SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'kitchen-appliances'
  LIMIT 1
)
INSERT INTO "Service" (
  "id", "categoryId", "name", "slug", "description", "icon", "imageUrl", "basePrice",
  "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel",
  "durationMin", "sortOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  data."id", selected_category."id", data."name", data."slug", data."description", data."icon", data."imageUrl", data."basePrice"::INTEGER,
  data."groupLabel", data."priceLabel", data."originalPrice"::INTEGER, data."originalPriceLabel", data."discountLabel",
  data."durationMin"::INTEGER, data."sortOrder"::INTEGER, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM selected_category
CROSS JOIN (
  VALUES
    ('svc_kitchen_chimney_regular_499', 'Kitchen chimney regular cleaning', 'kitchen-chimney-regular-cleaning-499', 'Regular chimney filter and exterior cleaning.', 'kitchen', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e8d?w=500&q=85&fit=crop&crop=center', 499, 'Kitchen Chimney', NULL, NULL, NULL, NULL, 75, 1),
    ('svc_kitchen_chimney_deep_1199', 'Kitchen chimney deep cleaning', 'kitchen-chimney-deep-cleaning-1199', 'Deep chimney cleaning for grease, filters, mesh, and body.', 'kitchen', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e8d?w=500&q=85&fit=crop&crop=center', 1199, 'Kitchen Chimney', NULL, NULL, NULL, NULL, 120, 2),
    ('svc_complete_kitchen_cleaning', 'Complete kitchen cleaning', 'complete-kitchen-cleaning', 'Complete kitchen cleaning package for counters, tiles, sink, cabinets, and surfaces.', 'kitchen', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=85&fit=crop&crop=center', 999, 'Kitchen Cleaning', 'Starts Rs. 999', NULL, NULL, NULL, 180, 3),
    ('svc_gas_stove_cleaning', 'Gas stove cleaning', 'gas-stove-cleaning', 'Gas stove cleaning and degreasing.', 'appliance', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=85&fit=crop&crop=center', 99, 'Appliance Cleaning', 'Starts Rs. 99', NULL, NULL, NULL, 45, 4),
    ('svc_fridge_cleaning_start_199', 'Fridge cleaning', 'fridge-cleaning-start-199', 'Fridge interior and exterior cleaning.', 'appliance', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&q=85&fit=crop&crop=center', 199, 'Appliance Cleaning', 'Starts Rs. 199', NULL, NULL, NULL, 60, 5),
    ('svc_microwave_cleaning_start_9', 'Microwave cleaning', 'microwave-cleaning-start-9', 'Microwave cleaning and food stain removal.', 'appliance', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&q=85&fit=crop&crop=center', 9, 'Appliance Cleaning', 'Starts Rs. 9', NULL, NULL, NULL, 30, 6),
    ('svc_ceiling_fan_cleaning', 'Ceiling fan cleaning', 'ceiling-fan-cleaning', 'Ceiling fan blade and body cleaning.', 'cleaning', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=85&fit=crop&crop=center', 99, 'Fan Cleaning', NULL, NULL, NULL, NULL, 30, 7),
    ('svc_kitchen_exhaust_fan_cleaning', 'Kitchen exhaust fan cleaning', 'kitchen-exhaust-fan-cleaning', 'Kitchen exhaust fan cleaning and degreasing.', 'kitchen', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e8d?w=500&q=85&fit=crop&crop=center', 99, 'Fan Cleaning', NULL, NULL, NULL, NULL, 45, 8),
    ('svc_window_door_cleaning_each', 'Window or door cleaning', 'window-or-door-cleaning-each', 'Window or door cleaning priced per unit.', 'cleaning', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&q=85&fit=crop&crop=center', 49, 'Window & Door Cleaning', 'Rs. 49 each', NULL, NULL, NULL, 20, 9)
) AS data("id", "name", "slug", "description", "icon", "imageUrl", "basePrice", "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel", "durationMin", "sortOrder")
ON CONFLICT ("slug") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "imageUrl" = EXCLUDED."imageUrl",
  "basePrice" = EXCLUDED."basePrice",
  "groupLabel" = EXCLUDED."groupLabel",
  "priceLabel" = EXCLUDED."priceLabel",
  "originalPrice" = EXCLUDED."originalPrice",
  "originalPriceLabel" = EXCLUDED."originalPriceLabel",
  "discountLabel" = EXCLUDED."discountLabel",
  "durationMin" = EXCLUDED."durationMin",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH upsert_category AS (
  INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
  VALUES (
    'cat_aya_housemaid',
    'Aya and Housemaid',
    'aya-housemaid',
    'Instant maid, housemaid, baby care, and patient care services.',
    9,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
),
selected_category AS (
  SELECT "id" FROM upsert_category
  UNION
  SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'aya-housemaid'
  LIMIT 1
)
INSERT INTO "Service" (
  "id", "categoryId", "name", "slug", "description", "icon", "imageUrl", "basePrice",
  "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel",
  "durationMin", "sortOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  data."id", selected_category."id", data."name", data."slug", data."description", data."icon", data."imageUrl", data."basePrice"::INTEGER,
  data."groupLabel", data."priceLabel", data."originalPrice"::INTEGER, data."originalPriceLabel", data."discountLabel",
  data."durationMin"::INTEGER, data."sortOrder"::INTEGER, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM selected_category
CROSS JOIN (
  VALUES
    ('svc_instant_maid_hourly', 'Instant maid', 'instant-maid-hourly', 'Hourly instant maid service.', 'home', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=85&fit=crop&crop=center', 99, 'Aya and Housemaid', 'Rs. 99 per hour', NULL, NULL, NULL, 60, 1),
    ('svc_maid_service_meeting', 'Maid service one-time meeting', 'maid-service-one-time-meeting', 'One-time meeting charge for maid service placement.', 'home', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=85&fit=crop&crop=center', 1500, 'Aya and Housemaid', NULL, NULL, NULL, NULL, 60, 2),
    ('svc_baby_care_meeting', 'Baby care service one-time meeting', 'baby-care-service-one-time-meeting', 'One-time meeting charge for baby care service placement.', 'home', 'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=500&q=85&fit=crop&crop=center', 1500, 'Baby Care', NULL, NULL, NULL, NULL, 60, 3),
    ('svc_patient_care_12_hours', 'Patient care 12 hours duty shift', 'patient-care-12-hours-duty-shift', 'Patient care service for a 12 hours duty shift.', 'home', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=85&fit=crop&crop=center', 400, 'Patient Care', 'Rs. 400 per shift', NULL, NULL, NULL, 720, 4)
) AS data("id", "name", "slug", "description", "icon", "imageUrl", "basePrice", "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel", "durationMin", "sortOrder")
ON CONFLICT ("slug") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "imageUrl" = EXCLUDED."imageUrl",
  "basePrice" = EXCLUDED."basePrice",
  "groupLabel" = EXCLUDED."groupLabel",
  "priceLabel" = EXCLUDED."priceLabel",
  "originalPrice" = EXCLUDED."originalPrice",
  "originalPriceLabel" = EXCLUDED."originalPriceLabel",
  "discountLabel" = EXCLUDED."discountLabel",
  "durationMin" = EXCLUDED."durationMin",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH upsert_category AS (
  INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
  VALUES (
    'cat_pest_control',
    'Pest Control',
    'pest-control',
    'Pest control packages for home and commercial spaces.',
    7,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
),
selected_category AS (
  SELECT "id" FROM upsert_category
  UNION
  SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pest-control'
  LIMIT 1
)
INSERT INTO "Service" (
  "id", "categoryId", "name", "slug", "description", "icon", "imageUrl", "basePrice",
  "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel",
  "durationMin", "sortOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  data."id", selected_category."id", data."name", data."slug", data."description", data."icon", data."imageUrl", data."basePrice"::INTEGER,
  data."groupLabel", data."priceLabel", data."originalPrice"::INTEGER, data."originalPriceLabel", data."discountLabel",
  data."durationMin"::INTEGER, data."sortOrder"::INTEGER, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM selected_category
CROSS JOIN (
  VALUES
    ('svc_pest_control_start_999', 'Pest control', 'pest-control-start-999', 'Pest control service for homes and common pest issues.', 'pest', 'https://images.unsplash.com/photo-1583912267550-d44c6c26c02a?w=500&q=85&fit=crop&crop=center', 999, 'Pest Control', 'Starts Rs. 999', NULL, NULL, NULL, 120, 1)
) AS data("id", "name", "slug", "description", "icon", "imageUrl", "basePrice", "groupLabel", "priceLabel", "originalPrice", "originalPriceLabel", "discountLabel", "durationMin", "sortOrder")
ON CONFLICT ("slug") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "imageUrl" = EXCLUDED."imageUrl",
  "basePrice" = EXCLUDED."basePrice",
  "groupLabel" = EXCLUDED."groupLabel",
  "priceLabel" = EXCLUDED."priceLabel",
  "originalPrice" = EXCLUDED."originalPrice",
  "originalPriceLabel" = EXCLUDED."originalPriceLabel",
  "discountLabel" = EXCLUDED."discountLabel",
  "durationMin" = EXCLUDED."durationMin",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
