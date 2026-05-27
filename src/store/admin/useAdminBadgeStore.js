import { create } from 'zustand';
import cms from '@/services/api/cms';

const useAdminBadgeStore = create((set) => ({
  pendingVerifications: 0,
  flaggedCount: 0,
  pendingListings: 0,
  openDisputes: 0,

  setBadge: (key, value) => set({ [key]: value }),

  fetchBadges: async () => {
    try {
      const { data } = await cms.get('/admin/dashboard/queues');
      set({
        pendingVerifications: data.pendingVerifications ?? 0,
        flaggedCount: data.flaggedCount ?? 0,
        pendingListings: data.pendingListings ?? 0,
        openDisputes: data.openDisputes ?? 0,
      });
    } catch {
      // silently fail — keep previous values
    }
  },
}));

export default useAdminBadgeStore;
