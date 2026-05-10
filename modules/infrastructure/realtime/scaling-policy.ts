/** Garde-fous realtime ERP — éviter explosions de subscriptions sans changer le client realtime global. */
export const INFRA_REALTIME_BATCH_CHUNK_SIZE = 25;

export const INFRA_REALTIME_CHANNEL_SCOPE_RULE =
  "Préfixer les topics par domaine (`rh:*`, `finance:*`, `logistics:*`) avant fan-out horizontal.";
