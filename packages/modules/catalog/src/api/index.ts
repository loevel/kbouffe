import { categoriesRoutes as categoriesRoute } from './categories';
import { menuRoutes as menuRoute } from './menu';
import { productsRoutes as productsRoute } from './products';

export { categoriesRoute, menuRoute, productsRoute };

export const catalogApi = {
    categoriesRoute,
    menuRoute,
    productsRoute,
};
