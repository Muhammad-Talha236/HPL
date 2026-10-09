// Frontend-only rollout controls. Keep disabled modules routable only through
// their safe fallbacks so hidden functionality cannot be reached from the UI.
export const FEATURES = Object.freeze({
  CLUBS_ENABLED: false,
});
