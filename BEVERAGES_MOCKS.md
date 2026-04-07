# 🍹 KBouffe Beverages Mock Data

**Source File:** `packages/modules/core/src/ui/lib/mock-data.ts`

---

## 📁 Categories

### Jus Naturels (Natural Juices)
- **ID:** `c1000000-0000-0000-0000-000000000002`
- **Description:** Jus frais et boissons artisanales
- **Sort Order:** 1

### Bières (Beers)
- **ID:** `c1000000-0000-0000-0000-000000000006`
- **Description:** Bières locales et importées - Source: boissonsducameroun.com, sa-ucb.com
- **Sort Order:** 2

### Boissons Gazeuses (Carbonated Drinks)
- **ID:** `c1000000-0000-0000-0000-000000000007`
- **Description:** Sodas et boissons gazeuses - Source: boissonsducameroun.com, sa-ucb.com
- **Sort Order:** 3

---

## 🥤 Products by Category

### Natural Juices (CAT_BOISSONS)

| ID | Name | Description | Price (FCFA) | Image |
|---|---|---|---|---|
| p1000007 | Jus de Foléré | Jus d'hibiscus frais fait maison, rafraichissant et naturel | 500 | ❌ |
| p1000008 | Jus de Gingembre | Jus de gingembre pimenté, tonifiant et énergisant | 500 | ❌ |
| p1000013 | Jus de Baobab | Jus de fruit de baobab (bouye), riche en vitamines | 600 | ❌ |
| p1000014 | Jus de Corossol | Jus onctueux de corossol frais, sucré naturellement | 700 | ❌ |
| p1000015 | Citronnade Maison | Limonade aux citrons verts frais et menthe | 400 | ❌ |

**Options:** `sizeOptions` (Small, Medium, Large)

---

### Beers (CAT_BIERES)

#### From boissonsducameroun.com

| ID | Name | Description | Price (FCFA) | Image | Status |
|---|---|---|---|---|---|
| p2000001 | 33 Export | Bière blonde lager camerounaise, légère et rafraichissante. La bière du supporter numéro 1 du football | 800 | ✅ | Available |
| p2000002 | Castel Beer | Bière blonde premium, goût équilibré et amertume subtile. Une référence camerounaise | 800 | ✅ | Available |
| p2000003 | Mutzig | Bière forte premium au goût prononcé et généreux. L'audace à la camerounaise | 900 | ✅ | Available |
| p2000004 | Beaufort Lager | Bière blonde classique au goût authentique. Le style Beaufort | 700 | ✅ | Available |
| p2000005 | Beaufort Light | Bière légère et moins calorique, pour les moments de détente | 700 | ✅ | Available |
| p2000006 | Heineken | Bière blonde internationale premium, qualité constante depuis 1873 | 1000 | ✅ | Available |
| p2000007 | Doppel Munich | Bière brune forte de type Munich, saveurs maltées et caramélisées | 900 | ✅ | Available |
| p2000008 | Castle Milk Stout | Bière noire onctueuse aux notes de chocolat et café, douceur unique | 1000 | ✅ | Available |
| p2000009 | Isenberg | Bière blonde de type pilsner, fraîche et désaltérante | 800 | ✅ | Available |
| p2000010 | Chill | Bière blonde légère et rafraichissante, idéale pour se détendre | 800 | ✅ | Available |
| p2000011 | Manyan | Bière traditionnelle camerounaise, goût riche et corsé | 700 | ✅ | **Unavailable** |

#### From sa-ucb.com (Union Camerounaise de Brasserie)

| ID | Name | Description | Price (FCFA) | Image | Status |
|---|---|---|---|---|---|
| p5000001 | Kadji Beer | Bière originale 100% maltée, fine, onctueuse et élégante. La référence UCB | 800 | ✅ | Available |
| p5000002 | K44 | Bière blonde ronde et onctueuse, 5% alcool. Premium brassée par UCB | 900 | ✅ | Available |
| p5000003 | Bissé | La bière du partage, 4.7% alcool. Nouvelle sensation brassicole camerounaise | 800 | ✅ | Available |

**Options:** `volumeBiereOptions` + `temperatureOptions`
- Volumes: 25cl, 33cl, 50cl, 75cl
- Temperature: Glacée, Frais, Température ambiante

---

### Carbonated Drinks (CAT_GAZEUSES)

| ID | Name | Description | Price (FCFA) | Image | Status |
|---|---|---|---|---|---|
| p3000001 | Top Ananas | Boisson gazeuse à l'ananas, pétillante et fruitée. Un classique camerounais | 400 | ✅ | Available |
| p3000002 | Top Orange | Boisson gazeuse à l'orange, fraîche et vitaminée | 400 | ✅ | Available |
| p3000003 | Top Grenadine | Boisson gazeuse à la grenadine, suave et désaltérante | 400 | ✅ | Available |
| p3000004 | Top Pamplemousse | Boisson gazeuse au pamplemousse, acidulée et rafraichissante | 400 | ✅ | Available |
| p3000005 | Top Tonic | Boisson tonic gazeuse, amertume subtile et bulles fines | 400 | ✅ | Available |

**Options:** `volumeSodaOptions` (25cl, 33cl, 50cl, 75cl)

---

## 💾 Database Schema

```typescript
type Category = {
    id: string;
    restaurant_id: string;
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
};

type Product = {
    id: string;
    restaurant_id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    compare_at_price: null;
    image_url: string | null;
    is_available: boolean;
    sort_order: number;
    options: ProductOption[] | null;
    created_at: string;
    updated_at: string;
};

type ProductOption = {
    id: string;
    name: string;
    values: string[];
};
```

---

## 🔧 Usage in Mock Data

```typescript
// Import mock data
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@kbouffe/module-core/ui/lib/mock-data';

// Filter by category
const juices = MOCK_PRODUCTS.filter(p => p.category_id === 'c1000000-0000-0000-0000-000000000002');
const beers = MOCK_PRODUCTS.filter(p => p.category_id === 'c1000000-0000-0000-0000-000000000006');
const sodas = MOCK_PRODUCTS.filter(p => p.category_id === 'c1000000-0000-0000-0000-000000000007');
```

---

## 📊 Summary

| Category | Count | Price Range | Has Images |
|---|---|---|---|
| Jus Naturels | 5 | 400-700 FCFA | ❌ No |
| Bières | 14 | 700-1000 FCFA | ✅ Yes |
| Boissons Gazeuses | 5 | 400 FCFA | ✅ Yes |
| **TOTAL** | **24** | **400-1000 FCFA** | **Mix** |

---

## 🔗 Sources

- **Beers:** [boissonsducameroun.com](https://boissonsducameroun.com) & [sa-ucb.com](https://sa-ucb.com)
- **Sodas:** [boissonsducameroun.com](https://boissonsducameroun.com)
- **Juices:** Original KBouffe creations

---

**Last Updated:** 2025-02-28
