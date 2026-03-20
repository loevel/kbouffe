export class MarketplaceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'MarketplaceError';
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  PACK_NOT_FOUND: 'PACK_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_NOT_CANCELLABLE: 'SUBSCRIPTION_NOT_CANCELLABLE',
  PURCHASE_FAILED: 'PURCHASE_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const errors = {
  unauthorized: () =>
    new MarketplaceError(ErrorCodes.UNAUTHORIZED, 'Non autorisé', 401),

  forbidden: () =>
    new MarketplaceError(ErrorCodes.FORBIDDEN, 'Accès refusé', 403),

  packNotFound: () =>
    new MarketplaceError(
      ErrorCodes.PACK_NOT_FOUND,
      'Pack non trouvé',
      404
    ),

  subscriptionNotFound: () =>
    new MarketplaceError(
      ErrorCodes.SUBSCRIPTION_NOT_FOUND,
      'Souscription non trouvée',
      404
    ),

  subscriptionNotCancellable: () =>
    new MarketplaceError(
      ErrorCodes.SUBSCRIPTION_NOT_CANCELLABLE,
      'Impossible d\'annuler une souscription active. Contact support.',
      400
    ),

  invalidInput: (field: string) =>
    new MarketplaceError(
      ErrorCodes.INVALID_INPUT,
      `Données invalides: ${field}`,
      400
    ),

  purchaseFailed: () =>
    new MarketplaceError(
      ErrorCodes.PURCHASE_FAILED,
      'Impossible de créer la souscription',
      500
    ),

  serviceUnavailable: () =>
    new MarketplaceError(
      ErrorCodes.SERVICE_UNAVAILABLE,
      'Service indisponible',
      503
    ),
};
