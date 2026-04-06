import type {
    User,
    Restaurant,
    Category,
    Product,
    Order,
    Review,
    Payout,
    OpeningHours,
    OrderItemData,
    ProductOption,
} from "../lib/supabase-types";

// --- IDs constants ---
const RESTAURANT_ID = "r1000000-0000-0000-0000-000000000001";
const OWNER_ID = "u1000000-0000-0000-0000-000000000001";
const CAT_PLATS = "c1000000-0000-0000-0000-000000000001";
const CAT_BOISSONS = "c1000000-0000-0000-0000-000000000002";
const CAT_BIERES = "c1000000-0000-0000-0000-000000000006";
const CAT_GAZEUSES = "c1000000-0000-0000-0000-000000000007";
const CAT_EAUX = "c1000000-0000-0000-0000-000000000008";
const CAT_ENERGISANTES = "c1000000-0000-0000-0000-000000000009";
const CAT_DESSERTS = "c1000000-0000-0000-0000-000000000003";
const CAT_ACCOMP = "c1000000-0000-0000-0000-000000000004";
const CAT_PROMOS = "c1000000-0000-0000-0000-000000000005";

// --- User ---
export const MOCK_USER: User = {
    id: OWNER_ID,
    email: "mama.ngono@email.com",
    phone: "698123456",
    full_name: "Mama Ngono",
    role: "merchant",
    avatar_url: null,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-02-28T10:00:00Z",
};

// --- Restaurant ---
const openingHours: OpeningHours = {
    monday: { isOpen: true, open: "08:00", close: "22:00" },
    tuesday: { isOpen: true, open: "08:00", close: "22:00" },
    wednesday: { isOpen: true, open: "08:00", close: "22:00" },
    thursday: { isOpen: true, open: "08:00", close: "22:00" },
    friday: { isOpen: true, open: "08:00", close: "23:00" },
    saturday: { isOpen: true, open: "09:00", close: "23:00" },
    sunday: { isOpen: false, open: "09:00", close: "20:00" },
};

export const MOCK_RESTAURANT: Restaurant = {
    id: RESTAURANT_ID,
    owner_id: OWNER_ID,
    name: "Chez Mama Ngono",
    slug: "chez-mama-ngono",
    description: "Cuisine camerounaise authentique a Douala. Ndole, Eru, poissons braises et bien plus encore. Fait maison avec amour depuis 2020.",
    address: "123 Rue de la Joie, Bonapriso",
    city: "Douala",
    phone: "698123456",
    email: "contact@chezmamangono.cm",
    logo_url: null,
    banner_url: null,
    primary_color: "#f97316",
    is_published: true,
    opening_hours: openingHours as unknown as null,
    delivery_zones: ["Bonapriso", "Akwa", "Deido", "Bonanjo", "Bali"] as unknown as null,
    min_order_amount: 2000,
    delivery_fee: 500,
    has_dine_in: false,
    has_reservations: false,
    corkage_fee_amount: null,
    dine_in_service_fee: null,
    reservation_cancel_policy: "flexible",
    reservation_cancel_notice_minutes: 120,
    reservation_cancellation_fee_amount: 0,
    order_cancel_policy: "flexible",
    order_cancel_notice_minutes: 30,
    order_cancellation_fee_amount: 0,
    total_tables: 0,
    is_sponsored: false,
    sponsored_until: null,
    sponsored_rank: 0,
    sms_notifications_enabled: false,
    notification_channels: ["email", "push"] as unknown as null,
    meta_pixel_id: null,
    google_analytics_id: null,
    theme_layout: "grid",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-02-28T10:00:00Z",
};

// --- Categories ---
export const MOCK_CATEGORIES: Category[] = [
    { id: CAT_PLATS, restaurant_id: RESTAURANT_ID, name: "Plats Principaux", description: "Nos specialites camerounaises", sort_order: 0, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_BOISSONS, restaurant_id: RESTAURANT_ID, name: "Jus Naturels", description: "Jus frais et boissons artisanales", sort_order: 1, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_BIERES, restaurant_id: RESTAURANT_ID, name: "Bieres", description: "Bieres locales et importees - Source: boissonsducameroun.com, sa-ucb.com", sort_order: 2, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_GAZEUSES, restaurant_id: RESTAURANT_ID, name: "Boissons Gazeuses", description: "Sodas et boissons gazeuses - Source: boissonsducameroun.com, sa-ucb.com", sort_order: 3, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_EAUX, restaurant_id: RESTAURANT_ID, name: "Eaux", description: "Eaux minerales et purifiees - Source: boissonsducameroun.com, sa-ucb.com", sort_order: 4, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_ENERGISANTES, restaurant_id: RESTAURANT_ID, name: "Boissons Energisantes", description: "Boissons energisantes - Source: sa-ucb.com", sort_order: 5, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_DESSERTS, restaurant_id: RESTAURANT_ID, name: "Desserts", description: "Douceurs et patisseries", sort_order: 6, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_ACCOMP, restaurant_id: RESTAURANT_ID, name: "Accompagnements", description: "Riz, plantain, miondo...", sort_order: 7, is_active: true, created_at: "2025-01-15T10:00:00Z" },
    { id: CAT_PROMOS, restaurant_id: RESTAURANT_ID, name: "Promotions", description: "Offres speciales du moment", sort_order: 8, is_active: false, created_at: "2025-01-15T10:00:00Z" },
];

// --- Products ---
const sizeOptions: ProductOption[] = [
    { name: "Taille", required: true, choices: [{ label: "Normal", extra_price: 0 }, { label: "Grand", extra_price: 500 }] },
];
const pimentOptions: ProductOption[] = [
    { name: "Piment", required: false, choices: [{ label: "Doux", extra_price: 0 }, { label: "Moyen", extra_price: 0 }, { label: "Fort", extra_price: 0 }] },
];
const volumeBiereOptions: ProductOption[] = [
    { name: "Format", required: true, choices: [{ label: "Petite (33cl)", extra_price: 0 }, { label: "Grande (65cl)", extra_price: 400 }] },
];
const temperatureOptions: ProductOption[] = [
    { name: "Temperature", required: false, choices: [{ label: "Bien fraiche", extra_price: 0 }, { label: "Normale", extra_price: 0 }] },
];
const volumeSodaOptions: ProductOption[] = [
    { name: "Format", required: true, choices: [{ label: "Canette (33cl)", extra_price: 0 }, { label: "Bouteille (50cl)", extra_price: 100 }, { label: "Grande (1L)", extra_price: 300 }] },
];
const volumeEauOptions: ProductOption[] = [
    { name: "Format", required: true, choices: [{ label: "50cl", extra_price: 0 }, { label: "1L", extra_price: 100 }, { label: "1.5L", extra_price: 200 }, { label: "5L", extra_price: 500 }] },
];

// Dine-in defaults for mock products
const dineInDefaults = { 
    is_dine_in_only: false, 
    is_no_delivery: false, 
    dine_in_price: null,
    tags: null,
    allergens: null,
    is_halal: false,
    is_vegan: false,
    is_gluten_free: false,
    calories: null,
    prep_time: 15,
    is_featured: false,
} as const;

type ProductWithoutDineIn = Omit<Product, keyof typeof dineInDefaults>;

const _mockProductsRaw: ProductWithoutDineIn[] = [
    // --- Plats Principaux ---
    { id: "p1000001", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Ndole Complet", description: "Ndole aux crevettes et viande, accompagne de plantain mur et miondo", price: 3500, compare_at_price: null, image_url: null, is_available: true, sort_order: 0, options: [...sizeOptions, ...pimentOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000002", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Eru Special", description: "Eru aux epinards waterleaf, viande fumee et crevettes sechees", price: 4000, compare_at_price: 4500, image_url: null, is_available: true, sort_order: 1, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000003", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Poisson Braise", description: "Poisson entier braise aux epices, sauce tomate maison", price: 5000, compare_at_price: null, image_url: null, is_available: true, sort_order: 2, options: pimentOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000004", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Poulet DG", description: "Poulet mijoté avec plantain mur et legumes", price: 4500, compare_at_price: null, image_url: null, is_available: true, sort_order: 3, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000005", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Koki aux Haricots", description: "Koki traditionnel cuit a la vapeur dans des feuilles de bananier", price: 2500, compare_at_price: null, image_url: null, is_available: false, sort_order: 4, options: null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000006", restaurant_id: RESTAURANT_ID, category_id: CAT_PLATS, name: "Soya de Boeuf", description: "Brochettes de boeuf grillees aux epices", price: 2000, compare_at_price: null, image_url: null, is_available: true, sort_order: 5, options: null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Jus Naturels (artisanaux) ---
    { id: "p1000007", restaurant_id: RESTAURANT_ID, category_id: CAT_BOISSONS, name: "Jus de Foléré", description: "Jus d'hibiscus frais fait maison, rafraichissant et naturel", price: 500, compare_at_price: null, image_url: null, is_available: true, sort_order: 0, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000008", restaurant_id: RESTAURANT_ID, category_id: CAT_BOISSONS, name: "Jus de Gingembre", description: "Jus de gingembre pimente, tonifiant et energisant", price: 500, compare_at_price: null, image_url: null, is_available: true, sort_order: 1, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000013", restaurant_id: RESTAURANT_ID, category_id: CAT_BOISSONS, name: "Jus de Baobab", description: "Jus de fruit de baobab (bouye), riche en vitamines", price: 600, compare_at_price: null, image_url: null, is_available: true, sort_order: 2, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000014", restaurant_id: RESTAURANT_ID, category_id: CAT_BOISSONS, name: "Jus de Corossol", description: "Jus onctueux de corossol frais, sucre naturellement", price: 700, compare_at_price: null, image_url: null, is_available: true, sort_order: 3, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000015", restaurant_id: RESTAURANT_ID, category_id: CAT_BOISSONS, name: "Citronnade Maison", description: "Limonade aux citrons verts frais et menthe", price: 400, compare_at_price: null, image_url: null, is_available: true, sort_order: 4, options: sizeOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Bieres (source: boissonsducameroun.com) ---
    { id: "p2000001", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "33 Export", description: "Biere blonde lager camerounaise, legere et rafraichissante. La biere du supporter numero 1 du football", price: 800, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/33.png", is_available: true, sort_order: 0, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000002", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Castel Beer", description: "Biere blonde premium, gout equilibre et amertume subtile. Une reference camerounaise", price: 800, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/cantel.png", is_available: true, sort_order: 1, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000003", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Mutzig", description: "Biere forte premium au gout prononce et genereux. L'audace a la camerounaise", price: 900, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/mutsic.png", is_available: true, sort_order: 2, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000004", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Beaufort Lager", description: "Biere blonde classique au gout authentique. Le style Beaufort", price: 700, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/beaufort-lager.png", is_available: true, sort_order: 3, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000005", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Beaufort Light", description: "Biere legere et moins calorique, pour les moments de detente", price: 700, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/beaufort-light.png", is_available: true, sort_order: 4, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000006", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Heineken", description: "Biere blonde internationale premium, qualite constante depuis 1873", price: 1000, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/heineken.png", is_available: true, sort_order: 5, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000007", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Doppel Munich", description: "Biere brune forte de type Munich, saveurs maltees et caramelisees", price: 900, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/doppel.png", is_available: true, sort_order: 6, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000008", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Castle Milk Stout", description: "Biere noire onctueuse aux notes de chocolat et cafe, douceur unique", price: 1000, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/CASTLE-milk-stout-1.webp", is_available: true, sort_order: 7, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000009", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Isenberg", description: "Biere blonde de type pilsner, fraiche et desalterante", price: 800, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/isenberg.png", is_available: true, sort_order: 8, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000010", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Chill", description: "Biere blonde legere et rafraichissante, ideale pour se detendre", price: 800, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/chill.png", is_available: true, sort_order: 9, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p2000011", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Manyan", description: "Biere traditionnelle camerounaise, gout riche et corsé", price: 700, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/manyan.png", is_available: false, sort_order: 10, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    // --- Bieres (source: sa-ucb.com) ---
    { id: "p5000001", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Kadji Beer", description: "Biere originale 100% maltee, fine, onctueuse et elegante. La reference UCB", price: 800, compare_at_price: null, image_url: "https://www.sa-ucb.com/sous-sites-marque/kadji-beer/assets/imgs/Bouteille-kadji-beer.webp", is_available: true, sort_order: 11, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000002", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "K44", description: "Biere blonde ronde et onctueuse, 5% alcool. Premium brassee par UCB", price: 900, compare_at_price: null, image_url: "https://www.sa-ucb.com/sous-sites-marque/k44/assets/imgs/k44.webp", is_available: true, sort_order: 12, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000003", restaurant_id: RESTAURANT_ID, category_id: CAT_BIERES, name: "Bissé", description: "La biere du partage, 4.7% alcool. Nouvelle sensation brassicole camerounaise", price: 800, compare_at_price: null, image_url: "https://www.sa-ucb.com/sous-sites-marque/bisse/assets/imgs/Image-btle-BISSE.png", is_available: true, sort_order: 13, options: [...volumeBiereOptions, ...temperatureOptions] as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Boissons Gazeuses (source: boissonsducameroun.com) ---
    { id: "p3000001", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Top Ananas", description: "Boisson gazeuse a l'ananas, petillante et fruitee. Un classique camerounais", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-ananas.png", is_available: true, sort_order: 0, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000002", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Top Orange", description: "Boisson gazeuse a l'orange, fraiche et vitaminee", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-orange.png", is_available: true, sort_order: 1, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000003", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Top Grenadine", description: "Boisson gazeuse a la grenadine, suave et desalterante", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-grenadine.png", is_available: true, sort_order: 2, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000004", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Top Pamplemousse", description: "Boisson gazeuse au pamplemousse, acidulee et rafraichissante", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-pamplemous.png", is_available: true, sort_order: 3, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000005", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Top Tonic", description: "Boisson tonic gazeuse, amerture subtile et bulles fines", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tonic.png", is_available: true, sort_order: 4, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000006", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "World Cola", description: "Cola camerounais au gout unique, bascule dans un monde rafraichissant", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/word-cola-50cl.png", is_available: true, sort_order: 5, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000007", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Orangina", description: "Boisson a l'orange avec pulpe, la recette originale petillante", price: 500, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/orangina.png", is_available: true, sort_order: 6, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000008", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "D'Jino Mangue-Goyave", description: "Boisson aux fruits tropicaux, saveur mangue et goyave intense", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/07/djino-mangue-goyave-60cl.png", is_available: true, sort_order: 7, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000009", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Youzou", description: "Boisson energisante et fruitee, dynamique et petillante", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/youzou.png", is_available: true, sort_order: 8, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p3000010", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Vinto", description: "Boisson au raisin, douce et fruitee avec une touche petillante", price: 400, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vinto.png", is_available: true, sort_order: 9, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Boissons Gazeuses (source: sa-ucb.com) ---
    { id: "p5000004", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Spécial Pamplemousse", description: "Boisson gazeuse pamplemousse par UCB. Formats cassable 65cl/33cl, PET 1.5L/1L/33cl", price: 400, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20PAMPLEMOUSSE.jpg", is_available: true, sort_order: 10, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000005", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Spécial Orange Passion", description: "Boisson gazeuse orange passion par UCB. Saveur fruitee et petillante", price: 400, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20ORANGE%20PASSION.jpg", is_available: true, sort_order: 11, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000006", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Spécial Cocktail", description: "Boisson gazeuse cocktail de fruits par UCB. Melange unique et rafraichissant", price: 400, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20COCKTAIL.jpg", is_available: true, sort_order: 12, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000007", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Spécial Fruits Rouges", description: "Boisson gazeuse fruits rouges par UCB. Intense et fruitee", price: 400, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20FRUITS%20ROUGES.jpg", is_available: true, sort_order: 13, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000008", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Razzl Limonade", description: "Limonade petillante Razzl par UCB. 250 FCFA (33cl), 500 FCFA (1L)", price: 250, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20LIMO.jpg", is_available: true, sort_order: 14, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000009", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Razzl Orange", description: "Boisson gazeuse orange Razzl par UCB. Fruitee et accessible", price: 250, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20ORANGE.jpg", is_available: true, sort_order: 15, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000010", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Razzl Grenadine", description: "Boisson gazeuse grenadine Razzl par UCB. Douce et petillante", price: 250, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20GRENADINE.jpg", is_available: true, sort_order: 16, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p5000011", restaurant_id: RESTAURANT_ID, category_id: CAT_GAZEUSES, name: "Razzl Cola", description: "Cola Razzl par UCB. Alternative locale et rafraichissante", price: 250, compare_at_price: null, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20COLA.jpg", is_available: true, sort_order: 17, options: volumeSodaOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Eaux (source: boissonsducameroun.com) ---
    { id: "p4000001", restaurant_id: RESTAURANT_ID, category_id: CAT_EAUX, name: "Tangui", description: "Eau minerale naturelle camerounaise, source naturelle de qualite", price: 300, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-1l.png", is_available: true, sort_order: 0, options: volumeEauOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p4000002", restaurant_id: RESTAURANT_ID, category_id: CAT_EAUX, name: "Supermont", description: "Eau minerale naturelle plate, purete et fraicheur", price: 300, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-13l.png", is_available: true, sort_order: 1, options: volumeEauOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p4000003", restaurant_id: RESTAURANT_ID, category_id: CAT_EAUX, name: "Vitale", description: "Eau purifiee premium, legere et equilibree en mineraux", price: 250, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vitale.png", is_available: true, sort_order: 2, options: volumeEauOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p4000004", restaurant_id: RESTAURANT_ID, category_id: CAT_EAUX, name: "Aqua Belle", description: "Eau de source naturelle filtrée, fraiche et cristalline", price: 250, compare_at_price: null, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/aqua-belle.png", is_available: true, sort_order: 3, options: volumeEauOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Eau (source: sa-ucb.com) ---
    { id: "p5000012", restaurant_id: RESTAURANT_ID, category_id: CAT_EAUX, name: "Madiba", description: "Eau minerale naturelle UCB, puisee en profondeur et distillee 5 fois. Pour un corps sain", price: 300, compare_at_price: null, image_url: "https://www.sa-ucb.com/sous-sites-marque/eau-madiba/assets/imgs/MADIBA-0.5L.webp", is_available: true, sort_order: 4, options: volumeEauOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Boisson Energisante (source: sa-ucb.com) ---
    { id: "p5000013", restaurant_id: RESTAURANT_ID, category_id: CAT_ENERGISANTES, name: "KIQ", description: "Boisson energisante UCB, formule audacieuse avec vitamines, mineraux et cafeine. Lancee en 2024", price: 600, compare_at_price: null, image_url: "https://www.sa-ucb.com/sous-sites-marque/kiq/assets/imgs/Bottle-768x2388.webp", is_available: true, sort_order: 0, options: temperatureOptions as unknown as null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Desserts ---
    { id: "p1000010", restaurant_id: RESTAURANT_ID, category_id: CAT_DESSERTS, name: "Beignets Haricots", description: "Beignets traditionnels aux haricots (5 pieces)", price: 1000, compare_at_price: null, image_url: null, is_available: true, sort_order: 0, options: null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },

    // --- Accompagnements ---
    { id: "p1000011", restaurant_id: RESTAURANT_ID, category_id: CAT_ACCOMP, name: "Riz Blanc", description: "Portion de riz blanc", price: 500, compare_at_price: null, image_url: null, is_available: true, sort_order: 0, options: null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
    { id: "p1000012", restaurant_id: RESTAURANT_ID, category_id: CAT_ACCOMP, name: "Plantain Frit", description: "Plantain mur frit (4 morceaux)", price: 800, compare_at_price: null, image_url: null, is_available: true, sort_order: 1, options: null, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-28T10:00:00Z" },
];

export const MOCK_PRODUCTS: Product[] = _mockProductsRaw.map((p) => ({ ...dineInDefaults, ...p }));

// --- Orders ---
function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
    return d.toISOString();
}

const orderItems1: OrderItemData[] = [
    { productId: "p1000001", productName: "Ndole Complet", quantity: 2, unitPrice: 3500, selectedOptions: { Taille: "Grand", Piment: "Moyen" } },
    { productId: "p1000007", productName: "Jus de Folere", quantity: 2, unitPrice: 500 },
];

const orderItems2: OrderItemData[] = [
    { productId: "p1000003", productName: "Poisson Braise", quantity: 1, unitPrice: 5000, selectedOptions: { Piment: "Fort" } },
    { productId: "p1000012", productName: "Plantain Frit", quantity: 1, unitPrice: 800 },
    { productId: "p1000008", productName: "Jus de Gingembre", quantity: 1, unitPrice: 500 },
];

const orderItems3: OrderItemData[] = [
    { productId: "p1000004", productName: "Poulet DG", quantity: 1, unitPrice: 4500, selectedOptions: { Taille: "Normal" } },
];

const orderItems4: OrderItemData[] = [
    { productId: "p1000002", productName: "Eru Special", quantity: 3, unitPrice: 4000, selectedOptions: { Taille: "Grand" } },
    { productId: "p1000010", productName: "Beignets Haricots", quantity: 2, unitPrice: 1000 },
    { productId: "p1000007", productName: "Jus de Folere", quantity: 3, unitPrice: 500 },
];

export const MOCK_ORDERS: Order[] = ([
    { id: "o1000001", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Jean-Pierre K.", customer_phone: "677123456", items: orderItems1 as unknown as Order["items"], subtotal: 8000, delivery_fee: 500, total: 8500, status: "pending", delivery_type: "delivery", delivery_address: "45 Rue Douala Manga Bell, Akwa", payment_method: "mobile_money_mtn", payment_status: "paid", notes: "Sonnez 2 fois svp", service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(0), updated_at: daysAgo(0) },
    { id: "o1000002", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Aimée F.", customer_phone: "691234567", items: orderItems2 as unknown as Order["items"], subtotal: 6300, delivery_fee: 500, total: 6800, status: "pending", delivery_type: "delivery", delivery_address: "12 Avenue de Gaulle, Bonanjo", payment_method: "mobile_money_orange", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(0), updated_at: daysAgo(0) },
    { id: "o1000003", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Paul E.", customer_phone: "655987654", items: orderItems3 as unknown as Order["items"], subtotal: 4500, delivery_fee: 0, total: 4500, status: "accepted", delivery_type: "pickup", delivery_address: null, payment_method: "cash", payment_status: "pending", notes: "Je passe dans 20 min", service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(0), updated_at: daysAgo(0) },
    { id: "o1000004", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Sandrine M.", customer_phone: "699876543", items: orderItems4 as unknown as Order["items"], subtotal: 15500, delivery_fee: 500, total: 16000, status: "preparing", delivery_type: "delivery", delivery_address: "8 Rue Njo Njo, Deido", payment_method: "mobile_money_mtn", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(0), updated_at: daysAgo(0) },
    { id: "o1000005", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Michel T.", customer_phone: "670111222", items: orderItems1 as unknown as Order["items"], subtotal: 8000, delivery_fee: 500, total: 8500, status: "ready", delivery_type: "delivery", delivery_address: "22 Rue Joss, Akwa", payment_method: "mobile_money_orange", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(1), updated_at: daysAgo(0) },
    { id: "o1000006", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Claire N.", customer_phone: "677333444", items: orderItems2 as unknown as Order["items"], subtotal: 6300, delivery_fee: 0, total: 6300, status: "completed", delivery_type: "pickup", delivery_address: null, payment_method: "cash", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(1), updated_at: daysAgo(1) },
    { id: "o1000007", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Jean-Pierre K.", customer_phone: "677123456", items: orderItems3 as unknown as Order["items"], subtotal: 4500, delivery_fee: 500, total: 5000, status: "completed", delivery_type: "delivery", delivery_address: "45 Rue Douala Manga Bell, Akwa", payment_method: "mobile_money_mtn", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: "o1000008", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Aimée F.", customer_phone: "691234567", items: orderItems1 as unknown as Order["items"], subtotal: 8000, delivery_fee: 500, total: 8500, status: "completed", delivery_type: "delivery", delivery_address: "12 Avenue de Gaulle, Bonanjo", payment_method: "mobile_money_orange", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: "o1000009", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Patrick O.", customer_phone: "655444555", items: orderItems4 as unknown as Order["items"], subtotal: 15500, delivery_fee: 500, total: 16000, status: "completed", delivery_type: "delivery", delivery_address: "67 Rue Tokoto, Bali", payment_method: "mobile_money_mtn", payment_status: "paid", notes: "Extra piment svp", service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: "o1000010", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Sandrine M.", customer_phone: "699876543", items: orderItems2 as unknown as Order["items"], subtotal: 6300, delivery_fee: 500, total: 6800, status: "completed", delivery_type: "delivery", delivery_address: "8 Rue Njo Njo, Deido", payment_method: "mobile_money_orange", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: "o1000011", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Michel T.", customer_phone: "670111222", items: orderItems3 as unknown as Order["items"], subtotal: 4500, delivery_fee: 0, total: 4500, status: "cancelled", delivery_type: "pickup", delivery_address: null, payment_method: "cash", payment_status: "refunded", notes: "Annule par le client", service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(4), updated_at: daysAgo(4) },
    { id: "o1000012", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Henriette B.", customer_phone: "699666777", items: orderItems1 as unknown as Order["items"], subtotal: 8000, delivery_fee: 500, total: 8500, status: "completed", delivery_type: "delivery", delivery_address: "5 Avenue Kennedy, Bonapriso", payment_method: "mobile_money_mtn", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: "o1000013", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Claire N.", customer_phone: "677333444", items: orderItems4 as unknown as Order["items"], subtotal: 15500, delivery_fee: 500, total: 16000, status: "completed", delivery_type: "delivery", delivery_address: "90 Boulevard de la Liberte", payment_method: "mobile_money_orange", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: "o1000014", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Paul E.", customer_phone: "655987654", items: orderItems2 as unknown as Order["items"], subtotal: 6300, delivery_fee: 0, total: 6300, status: "completed", delivery_type: "pickup", delivery_address: null, payment_method: "cash", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(6), updated_at: daysAgo(6) },
    { id: "o1000015", restaurant_id: RESTAURANT_ID, customer_id: null, customer_name: "Jean-Pierre K.", customer_phone: "677123456", items: orderItems3 as unknown as Order["items"], subtotal: 4500, delivery_fee: 500, total: 5000, status: "completed", delivery_type: "delivery", delivery_address: "45 Rue Douala Manga Bell, Akwa", payment_method: "mobile_money_mtn", payment_status: "paid", notes: null, service_fee: 0, corkage_fee: 0, tip_amount: 0, table_number: null, table_id: null, covers: null, external_drinks_count: 0, created_at: daysAgo(6), updated_at: daysAgo(6) },
 ] as Array<Omit<Order, "preparation_time_minutes" | "scheduled_for" | "delivered_at" | "delivery_note" | "delivered_by">>).map((order) => ({
    preparation_time_minutes: null,
    scheduled_for: null,
    delivered_at: null,
    delivery_note: null,
    delivered_by: null,
    ...order,
}));

// --- Reviews ---
export const MOCK_REVIEWS: Review[] = [
    { id: "rv100001", order_id: "o1000006", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 5, comment: "Meilleur ndole de Douala, je recommande!", created_at: daysAgo(1) },
    { id: "rv100002", order_id: "o1000007", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 4, comment: "Tres bon poulet DG, livraison rapide.", created_at: daysAgo(2) },
    { id: "rv100003", order_id: "o1000008", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 5, comment: "Service au top comme d'habitude!", created_at: daysAgo(2) },
    { id: "rv100004", order_id: "o1000009", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 3, comment: "Un peu trop de sel cette fois, mais sinon c'est bon.", created_at: daysAgo(3) },
    { id: "rv100005", order_id: "o1000012", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 5, comment: "Parfait! Rien a dire.", created_at: daysAgo(5) },
    { id: "rv100006", order_id: "o1000014", restaurant_id: RESTAURANT_ID, customer_id: OWNER_ID, rating: 4, comment: "Bonne quantite, bon gout.", created_at: daysAgo(6) },
];

// --- Payouts ---
export const MOCK_PAYOUTS: Payout[] = [
    { id: "pay10001", restaurant_id: RESTAURANT_ID, amount: 285000, status: "paid", period_start: "2025-02-01", period_end: "2025-02-15", paid_at: "2025-02-17T10:00:00Z", created_at: "2025-02-15T10:00:00Z" },
    { id: "pay10002", restaurant_id: RESTAURANT_ID, amount: 312000, status: "paid", period_start: "2025-02-16", period_end: "2025-02-28", paid_at: "2025-03-01T10:00:00Z", created_at: "2025-02-28T10:00:00Z" },
    { id: "pay10003", restaurant_id: RESTAURANT_ID, amount: 125400, status: "pending", period_start: "2025-03-01", period_end: "2025-03-15", paid_at: null, created_at: "2025-03-01T10:00:00Z" },
];

// --- Dashboard stats ---
export const MOCK_STATS = {
    revenue: { today: 35800, week: 285000, month: 1200000 },
    orders: { today: 4, pending: 2, total: 12 },
    averageOrderValue: 8350,
    totalCustomers: 142,
};

// --- Revenue chart data ---
export const MOCK_REVENUE_DATA = [
    { label: "Lun", value: 42000 },
    { label: "Mar", value: 38000 },
    { label: "Mer", value: 55000 },
    { label: "Jeu", value: 31000 },
    { label: "Ven", value: 48000 },
    { label: "Sam", value: 63000 },
    { label: "Dim", value: 8000 },
];

// --- Derived: unique customers ---
export interface MockCustomer {
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
}

export const MOCK_CUSTOMERS: MockCustomer[] = (() => {
    const map = new Map<string, MockCustomer>();
    for (const order of MOCK_ORDERS) {
        const key = order.customer_phone;
        const existing = map.get(key);
        if (existing) {
            existing.totalOrders++;
            existing.totalSpent += order.total;
            if (order.created_at > existing.lastOrderAt) {
                existing.lastOrderAt = order.created_at;
            }
        } else {
            map.set(key, {
                name: order.customer_name,
                phone: order.customer_phone,
                totalOrders: 1,
                totalSpent: order.total,
                lastOrderAt: order.created_at,
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
})();
