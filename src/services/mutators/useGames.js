import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import gamesService from '../features/gamesService';

export const useGamesList = (params = {}) =>
    useQuery({
        queryKey: ['games', params],
        queryFn: () => gamesService.getGames(params),
    });

export const useGameBySlug = (slug) =>
    useQuery({
        queryKey: ['game', slug],
        queryFn: () => gamesService.getGameBySlug(slug),
        enabled: !!slug,
    });

// Full structured GamePost (hits /gameposts/:slug → gamepost schema)
export const useGamePost = (slug) =>
    useQuery({
        queryKey: ['gamepost', slug],
        queryFn: () => gamesService.getGamePost(slug),
        enabled: !!slug,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

export const useTrendingGames = () =>
    useQuery({
        queryKey: ['games', 'trending'],
        queryFn: () => gamesService.getTrendingGames(),
    });

export const useFeaturedGames = () =>
    useQuery({
        queryKey: ['games', 'featured'],
        queryFn: () => gamesService.getFeaturedGames(),
    });

export const useSearchGames = (query) =>
    useQuery({
        queryKey: ['games', 'search', query],
        queryFn: () => gamesService.searchGames(query),
        enabled: query?.length >= 2,
    });

export const useCreateGame = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: gamesService.createGame,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
        },
    });
};

export function useUpdateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => gamesService.updateGame(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['games'] }),
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => gamesService.deleteGame(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['games'] }),
  });
}

export const useUploadGameMedia = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, formData }) => gamesService.uploadMedia(id, formData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['game', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['games'] });
        },
    });
};

export function useUpdateGamePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      gamesService.updateGamePost(id, data).then(r => r.data ?? r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameposts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-gameposts'] });
    },
  });
}

export const useUserReviews = (slug, params = {}) =>
  useQuery({
    queryKey: ['user-reviews', slug, params],
    queryFn: () => gamesService.getUserReviews(slug, params),
    enabled: !!slug,
  });

export const useSubmitUserReview = (slug) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => gamesService.submitUserReview(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews', slug] });
    },
  });
};

export const useGames = useGamesList;
export const useGame = useGamePost; // GamePostPage uses useGame — now points to structured endpoint
