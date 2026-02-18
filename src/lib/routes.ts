/** Canonical route map — single source of truth for all navigation */
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ADMIN: '/admin',
  ADMIN_MODERATION: '/admin/moderation',
  PRIVACY: '/privacy',
  PROFILE: '/profile',
  PUBLIC_PROFILE: (username: string) => `/u/${username}`,
  SETTINGS: '/settings',
  MEMBERSHIP: '/membership',
  SAVED_FORTUNES: '/saved',
  FEED: '/feed',
  EVENTS: '/events-today',
  BOT_PROFILE: (handle: string) => `/bot/${encodeURIComponent(handle)}`,
} as const;
