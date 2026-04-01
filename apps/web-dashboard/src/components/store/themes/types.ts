export interface ThemeProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    images?: string[];
    is_available: boolean;
    is_featured?: boolean;
    category_id: string | null;
    sort_order: number;
    // Scarcity / Limited edition
    is_limited_edition?: boolean;
    stock_quantity?: number | null;
    available_until?: string | null;
}

export interface ThemeCategory {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
}

export interface ThemeRestaurant {
    id: string;
    name: string;
    primaryColor?: string;
}

export interface ThemeProps {
    restaurant: ThemeRestaurant;
    categories: ThemeCategory[];
    products: ThemeProduct[];
    featuredProducts?: ThemeProduct[];
    activeCategory: string;
    onCategoryChange: (categoryId: string) => void;
    onAddToCart: (product: ThemeProduct) => void;
    onProductClick: (product: ThemeProduct) => void;
    formatPrice: (price: number) => string;
    sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}
