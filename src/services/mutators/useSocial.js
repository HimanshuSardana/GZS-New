import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import socialService from '@/services/features/socialService';

export const useSocial = () => {
    const queryClient = useQueryClient();

    // ── Feed Queries ──

    const useFeed = (params = {}) => {
        return useInfiniteQuery({
            queryKey: ['social', 'feed', params],
            queryFn: ({ pageParam = 1 }) => socialService.getFeed({ ...params, page: pageParam }),
            getNextPageParam: (lastPage) => lastPage.next_page || undefined,
            staleTime: 60 * 1000,
        });
    };

    const useUserPosts = (username, params = {}) => {
        return useInfiniteQuery({
            queryKey: ['social', 'posts', username, params],
            queryFn: ({ pageParam = 1 }) => socialService.getUserPosts(username, { ...params, page: pageParam }),
            getNextPageParam: (lastPage) => lastPage.next_page || undefined,
            enabled: !!username,
        });
    };

    // ── Interaction Mutations ──

    const useCreatePost = () => {
        return useMutation({
            mutationFn: socialService.createPost,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['social', 'feed'] });
                queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
            },
        });
    };

    const useLikePost = () => {
        return useMutation({
            mutationFn: socialService.likePost,
            onMutate: async () => {
                // Optimistic UI updates could go here
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['social', 'feed'] });
            }
        });
    };

    const useDeletePost = () => {
        return useMutation({
            mutationFn: socialService.deletePost,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
                queryClient.invalidateQueries({ queryKey: ['social', 'feed'] });
            },
        });
    };

    // ── Connections ──

    const useFollow = () => {
        return useMutation({
            mutationFn: ({ username, type }) => socialService.followSubProfile(username, type),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['profile'] });
            }
        });
    };

    const useFriendsList = () => {
        return useQuery({
            queryKey: ['social', 'friends'],
            queryFn: socialService.getFriendsList,
            staleTime: 5 * 60 * 1000,
        });
    };

    return {
        useFeed,
        useUserPosts,
        useCreatePost,
        useLikePost,
        useDeletePost,
        useFollow,
        useFriendsList,
    };
};
