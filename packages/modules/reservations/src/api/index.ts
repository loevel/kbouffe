import { reservationsRoutes, publicReservationsRoutes } from './reservations';
import { tablesRoutes } from './tables';
import { zonesRoutes } from './zones';

export { reservationsRoutes, publicReservationsRoutes, tablesRoutes, zonesRoutes };

export const reservationsApi = {
    reservationsRoutes,
    publicReservationsRoutes,
    tablesRoutes,
    zonesRoutes,
};
