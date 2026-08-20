-- Menu de démonstration pour les restaurants du catalogue qui n'en ont aucun.
--
-- 90 des 93 restaurants publiés ont été créés le même jour sous un seul compte
-- (mangas@gmail.com) : ce sont des fixtures de catalogue, pas des
-- établissements qui se sont inscrits. Sans produits, leurs vitrines
-- n'affichent que « Aucun plat disponible pour le moment », et le tunnel de
-- commande n'est exerçable sur aucun d'eux — seuls MangasCave et Taomao ont un
-- menu, tous deux avec une livraison à 0 FCFA.
--
-- Chaque restaurant reçoit trois catégories et dix à treize plats choisis selon
-- son `cuisine_type`. Les prix suivent son `price_range` (1 → ×0,75, 2 → ×1,
-- 3 → ×1,3, 4 → ×1,6) et sont arrondis aux 50 FCFA.
--
-- `image_url` reste NULL : la vitrine a un dégradé de repli, et mieux vaut ça
-- qu'une image empruntée ailleurs.
--
-- Idempotent : la clause NOT EXISTS ne retient que les restaurants sans aucun
-- produit, donc rejouer la migration n'ajoute rien et ne touche pas aux menus
-- saisis depuis.

WITH cibles AS (
    SELECT r.id, r.cuisine_type, r.price_range
      FROM restaurants r
     WHERE r.is_published
       AND NOT EXISTS (SELECT 1 FROM products p WHERE p.restaurant_id = r.id)
),
modele(cuisine, categorie, cat_ordre, produit, produit_en, resume, prix_base, ordre) AS (VALUES
    -- ── Cuisine africaine ────────────────────────────────────────────────
    ('african','Plats traditionnels',1,'Ndolé aux crevettes','Ndolé with Shrimp','Feuilles de ndolé, arachide et crevettes fraîches',2500,1),
    ('african','Plats traditionnels',1,'Eru et water fufu','Eru with Water Fufu','Feuilles d''eru au waterleaf et huile de palme',2000,2),
    ('african','Plats traditionnels',1,'Mbongo Tchobi','Mbongo Tchobi','Poisson mijoté en sauce noire épicée',2500,3),
    ('african','Plats traditionnels',1,'Poulet DG','Chicken DG','Poulet sauté, plantains mûrs et légumes',3500,4),
    ('african','Plats traditionnels',1,'Koki de haricots','Bean Koki','Pâte de haricots cuite à la feuille de bananier',1500,5),
    ('african','Plats traditionnels',1,'Sanga','Sanga','Maïs frais et feuilles de manioc',1500,6),
    ('african','Accompagnements',2,'Plantains mûrs frits','Fried Ripe Plantains','Plantains dorés à l''huile',500,7),
    ('african','Accompagnements',2,'Bâton de manioc','Cassava Stick','Manioc fermenté cuit en feuille',300,8),
    ('african','Accompagnements',2,'Couscous de maïs','Corn Couscous','Boule de maïs jaune',500,9),
    ('african','Accompagnements',2,'Riz blanc','White Rice','Riz parfumé nature',500,10),
    ('african','Boissons',3,'Jus de bissap','Hibiscus Juice','Infusion glacée d''hibiscus',500,11),
    ('african','Boissons',3,'Jus de gingembre','Ginger Juice','Gingembre frais pressé',500,12),
    ('african','Boissons',3,'Eau minérale','Mineral Water','Bouteille 50 cl',300,13),

    -- ── Grillades ────────────────────────────────────────────────────────
    ('grill','Grillades',1,'Poisson braisé','Grilled Fish','Maquereau braisé, sauce piment maison',3000,1),
    ('grill','Grillades',1,'Poulet braisé entier','Whole Grilled Chicken','Mariné aux épices, braisé au feu de bois',4000,2),
    ('grill','Grillades',1,'Demi-poulet braisé','Half Grilled Chicken','Une moitié, même marinade',2000,3),
    ('grill','Grillades',1,'Brochettes de bœuf','Beef Skewers','Soya grillé aux épices',1000,4),
    ('grill','Grillades',1,'Côtelettes de porc','Pork Chops','Grillées au charbon de bois',2500,5),
    ('grill','Grillades',1,'Gésiers grillés','Grilled Gizzards','Gésiers marinés et grillés',1500,6),
    ('grill','Accompagnements',2,'Plantains braisés','Grilled Plantains','Plantains mûrs au feu de bois',500,7),
    ('grill','Accompagnements',2,'Frites de pomme de terre','French Fries','Frites maison',800,8),
    ('grill','Accompagnements',2,'Bâton de manioc','Cassava Stick','Manioc fermenté cuit en feuille',300,9),
    ('grill','Accompagnements',2,'Piment vert','Green Chili Sauce','Sauce piment fraîche',200,10),
    ('grill','Boissons',3,'Bière locale','Local Beer','Bouteille 65 cl',1000,11),
    ('grill','Boissons',3,'Jus naturel','Fresh Juice','Jus de fruits pressé du jour',500,12),
    ('grill','Boissons',3,'Eau minérale','Mineral Water','Bouteille 50 cl',300,13),

    -- ── Poissons et fruits de mer ────────────────────────────────────────
    ('seafood','Poissons & fruits de mer',1,'Bar braisé','Grilled Sea Bass','Bar entier braisé, sauce citron',4500,1),
    ('seafood','Poissons & fruits de mer',1,'Crevettes sautées à l''ail','Garlic Shrimp','Crevettes fraîches, ail et persil',3500,2),
    ('seafood','Poissons & fruits de mer',1,'Poisson sauce tomate','Fish in Tomato Sauce','Filet mijoté à la tomate fraîche',3000,3),
    ('seafood','Poissons & fruits de mer',1,'Calamars grillés','Grilled Squid','Calamars marinés et grillés',3500,4),
    ('seafood','Poissons & fruits de mer',1,'Sole meunière','Sole Meunière','Sole poêlée au beurre citronné',4000,5),
    ('seafood','Poissons & fruits de mer',1,'Crabes à la vapeur','Steamed Crab','Crabes frais cuits à la vapeur',3000,6),
    ('seafood','Accompagnements',2,'Riz sauté','Fried Rice','Riz sauté aux légumes',800,7),
    ('seafood','Accompagnements',2,'Plantains frits','Fried Plantains','Plantains mûrs dorés',500,8),
    ('seafood','Accompagnements',2,'Salade fraîche','Fresh Salad','Crudités de saison',800,9),
    ('seafood','Boissons',3,'Citronnade','Lemonade','Citron pressé glacé',500,10),
    ('seafood','Boissons',3,'Bière locale','Local Beer','Bouteille 65 cl',1000,11),
    ('seafood','Boissons',3,'Eau minérale','Mineral Water','Bouteille 50 cl',300,12),

    -- ── Poulet ───────────────────────────────────────────────────────────
    ('chicken','Poulet',1,'Poulet braisé entier','Whole Grilled Chicken','Mariné aux épices, braisé',3500,1),
    ('chicken','Poulet',1,'Demi-poulet braisé','Half Grilled Chicken','Une moitié, même marinade',1800,2),
    ('chicken','Poulet',1,'Poulet pané','Breaded Chicken','Panure croustillante maison',2500,3),
    ('chicken','Poulet',1,'Ailes de poulet épicées','Spicy Chicken Wings','Six ailes marinées au piment',2000,4),
    ('chicken','Poulet',1,'Poulet DG','Chicken DG','Poulet sauté, plantains et légumes',3500,5),
    ('chicken','Accompagnements',2,'Frites de pomme de terre','French Fries','Frites maison',800,6),
    ('chicken','Accompagnements',2,'Riz blanc','White Rice','Riz parfumé nature',500,7),
    ('chicken','Accompagnements',2,'Plantains frits','Fried Plantains','Plantains mûrs dorés',500,8),
    ('chicken','Accompagnements',2,'Salade de chou','Coleslaw','Chou frais émincé',500,9),
    ('chicken','Boissons',3,'Soda','Soda','Bouteille 33 cl',400,10),
    ('chicken','Boissons',3,'Jus naturel','Fresh Juice','Jus de fruits pressé du jour',500,11),
    ('chicken','Boissons',3,'Eau minérale','Mineral Water','Bouteille 50 cl',300,12),

    -- ── Pizza ────────────────────────────────────────────────────────────
    ('pizza','Pizzas',1,'Margherita','Margherita','Tomate, mozzarella et basilic',4000,1),
    ('pizza','Pizzas',1,'Reine','Regina','Tomate, mozzarella, jambon et champignons',5000,2),
    ('pizza','Pizzas',1,'Quatre fromages','Four Cheeses','Mozzarella, chèvre, bleu et parmesan',5500,3),
    ('pizza','Pizzas',1,'Végétarienne','Vegetarian','Légumes grillés de saison',4500,4),
    ('pizza','Pizzas',1,'Pizza du chef','Chef''s Pizza','Garniture du jour',6000,5),
    ('pizza','Entrées',2,'Salade César','Caesar Salad','Salade, poulet, parmesan et croûtons',2500,6),
    ('pizza','Entrées',2,'Bruschetta','Bruschetta','Pain grillé, tomate et basilic',1500,7),
    ('pizza','Boissons',3,'Soda','Soda','Bouteille 33 cl',500,8),
    ('pizza','Boissons',3,'Jus naturel','Fresh Juice','Jus de fruits pressé du jour',700,9),
    ('pizza','Boissons',3,'Eau minérale','Mineral Water','Bouteille 50 cl',300,10)
),
categories_creees AS (
    INSERT INTO categories (restaurant_id, name, sort_order, is_active, name_i18n)
    SELECT DISTINCT c.id, m.categorie, m.cat_ordre, true,
           jsonb_build_object('fr', m.categorie)
      FROM cibles c
      JOIN modele m ON m.cuisine = c.cuisine_type
    RETURNING id, restaurant_id, name
)
INSERT INTO products (
    restaurant_id, category_id, name, description, price,
    is_available, sort_order, prep_time, name_i18n, description_i18n
)
SELECT c.id,
       cc.id,
       m.produit,
       m.resume,
       GREATEST(100, ROUND(
           m.prix_base * CASE c.price_range
               WHEN 1 THEN 0.75 WHEN 3 THEN 1.3 WHEN 4 THEN 1.6 ELSE 1.0 END
           / 50.0)::int * 50),
       true,
       m.ordre,
       15,
       jsonb_build_object('fr', m.produit, 'en', m.produit_en),
       jsonb_build_object('fr', m.resume)
  FROM cibles c
  JOIN modele m ON m.cuisine = c.cuisine_type
  JOIN categories_creees cc
    ON cc.restaurant_id = c.id AND cc.name = m.categorie;
