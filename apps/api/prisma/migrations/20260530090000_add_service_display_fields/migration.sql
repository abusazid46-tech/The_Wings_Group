ALTER TABLE "Service" ADD COLUMN "groupLabel" TEXT;
ALTER TABLE "Service" ADD COLUMN "priceLabel" TEXT;
ALTER TABLE "Service" ADD COLUMN "originalPrice" INTEGER;
ALTER TABLE "Service" ADD COLUMN "originalPriceLabel" TEXT;
ALTER TABLE "Service" ADD COLUMN "discountLabel" TEXT;

WITH upsert_category AS (
  INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
  VALUES (
    'cat_toilet_bath',
    'Toilet & Bath',
    'toilet-bath',
    'Bathroom, toilet, and attached washroom cleaning packages.',
    1,
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
  SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'toilet-bath'
  LIMIT 1
)
INSERT INTO "Service" (
  "id",
  "categoryId",
  "name",
  "slug",
  "description",
  "icon",
  "imageUrl",
  "basePrice",
  "groupLabel",
  "priceLabel",
  "originalPrice",
  "originalPriceLabel",
  "discountLabel",
  "durationMin",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  data."id",
  selected_category."id",
  data."name",
  data."slug",
  data."description",
  data."icon",
  data."imageUrl",
  data."basePrice",
  data."groupLabel",
  data."priceLabel",
  data."originalPrice",
  data."originalPriceLabel",
  data."discountLabel",
  data."durationMin",
  data."sortOrder",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM selected_category
CROSS JOIN (
  VALUES
    ('svc_bath_combo_1', 'One attached toilet and bathroom cleaning', 'one-attached-toilet-and-bathroom-cleaning', 'Complete cleaning for one attached toilet and bathroom.', 'bathroom', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center', 699, 'Bathroom Cleaning', NULL, NULL, NULL, NULL, 120, 1),
    ('svc_bath_combo_2', 'Two attached toilet and bathroom cleaning', 'two-attached-toilet-and-bathroom-cleaning', 'Combo cleaning for two attached toilets and bathrooms.', 'bathroom', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center', 1188, 'Bathroom Cleaning', '1188.3', 1398, '1398', '15% discount', 150, 2),
    ('svc_bath_combo_3', 'Three attached toilet and bathroom cleaning', 'three-attached-toilet-and-bathroom-cleaning', 'Combo cleaning for three attached toilets and bathrooms.', 'bathroom', 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=500&q=85&fit=crop&crop=center', 1573, 'Bathroom Cleaning', '1572.7', 2097, '2097', '25% discount', 180, 3),
    ('svc_toilet_1', '1 toilet cleaning', '1-toilet-cleaning', 'Deep sanitization of one toilet.', 'bathroom', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center', 399, 'Toilet Cleaning', NULL, NULL, NULL, NULL, 75, 4),
    ('svc_toilet_2', '2 toilet cleaning', '2-toilet-cleaning', 'Deep sanitization of two toilets.', 'bathroom', 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?w=500&q=85&fit=crop&crop=center', 718, 'Toilet Cleaning', '718.2', 798, '798', '10%', 105, 5),
    ('svc_toilet_3', '3 toilet cleaning', '3-toilet-cleaning', 'Deep sanitization of three toilets.', 'bathroom', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center', 958, 'Toilet Cleaning', '957.6', 1197, '1197', '20%', 135, 6),
    ('svc_bathroom_1', '1 bathroom cleaning', '1-bathroom-cleaning', 'Tiles, floor, sink, mirror, and fixtures cleaning.', 'bathroom', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center', 399, 'Bathroom Cleaning', NULL, NULL, NULL, NULL, 75, 7),
    ('svc_bathroom_2', '2 bathroom cleaning', '2-bathroom-cleaning', 'Tiles, floor, sink, mirror, and fixtures cleaning for two bathrooms.', 'bathroom', 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=500&q=85&fit=crop&crop=center', 718, 'Bathroom Cleaning', '718.2', 798, '798', '10%', 105, 8),
    ('svc_bathroom_3', '3 bathroom cleaning', '3-bathroom-cleaning', 'Tiles, floor, sink, mirror, and fixtures cleaning for three bathrooms.', 'bathroom', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center', 958, 'Bathroom Cleaning', '957.6', 1197, '1197', '20%', 135, 9)
) AS data(
  "id",
  "name",
  "slug",
  "description",
  "icon",
  "imageUrl",
  "basePrice",
  "groupLabel",
  "priceLabel",
  "originalPrice",
  "originalPriceLabel",
  "discountLabel",
  "durationMin",
  "sortOrder"
)
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
