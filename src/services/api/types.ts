/**
 * CMS API response types.
 * Used with gamesService.getFeaturedGames() and adminQueryFn('/admin/dashboard/queues').
 */

// ── GET /api/cms/games/featured ──────────────────────────────────────────────

export interface CmsGame {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  developer: string;
  publisher: string;
  release_date: string;
  status: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** Shape returned by the cms axios instance after the response interceptor unwraps data. */
export type FeaturedGamesResponse = CmsGame[];

// ── GET /api/cms/admin/dashboard/queues ──────────────────────────────────────

export interface DashboardQueueItem {
  id: number;
  title: string;
  submitted_at: string;
  priority: 'High' | 'Urgent' | 'Normal';
}

/**
 * Shape unwrapped by adminQueryFn (strips the outer { data: ... } envelope).
 * skill_verifications and disputes are always [] — owned by core-api.
 * job_listings maps to draft game posts in the CMS.
 */
export interface DashboardQueues {
  skill_verifications: DashboardQueueItem[];
  job_listings: DashboardQueueItem[];
  disputes: DashboardQueueItem[];
  flagged_messages: number;
  pending_events: number;
}
