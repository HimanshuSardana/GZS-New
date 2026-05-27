import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import communityService from '../features/communityService';

export const useBranches = () =>
    useQuery({
        queryKey: ['community', 'branches'],
        queryFn: communityService.getBranches,
    });

export const useBranch = (slug) =>
    useQuery({
        queryKey: ['community', 'branch', slug],
        queryFn: () => communityService.getBranchDetail(slug),
        enabled: !!slug,
    });

export const useBranchChannels = (branchSlug) =>
    useQuery({
        queryKey: ['community', 'channels', branchSlug],
        queryFn: () => communityService.getBranchChannels(branchSlug),
        enabled: !!branchSlug,
    });

export const useChannelMessages = (branchSlug, channelSlug) =>
    useQuery({
        queryKey: ['community', 'messages', branchSlug, channelSlug],
        queryFn: () => communityService.getMessageHistory(branchSlug, channelSlug),
        enabled: !!branchSlug && !!channelSlug,
    });

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: communityService.sendMessage,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['community', 'messages', variables.branch, variables.channel],
            });
        },
    });
};

export const useGroups = (branchSlug) =>
    useQuery({
        queryKey: ['community', 'groups', branchSlug],
        queryFn: () => communityService.getGroupsInBranch(branchSlug),
        enabled: !!branchSlug,
    });

export const useGroup = (groupId) =>
    useQuery({
        queryKey: ['community', 'group', groupId],
        queryFn: () => communityService.getGroupDetail(groupId),
        enabled: !!groupId,
    });

export const useEvents = (branchSlug) =>
    useQuery({
        queryKey: ['community', 'events', branchSlug],
        queryFn: () => communityService.getCommunityEvents(branchSlug),
        enabled: !!branchSlug,
    });

export const useLFGPosts = (branchSlug) =>
    useQuery({
        queryKey: ['community', 'lfg', branchSlug],
        queryFn: () => communityService.getLFGBoard(branchSlug),
        enabled: !!branchSlug,
    });

export const useLiveStats = () =>
    useQuery({
        queryKey: ['community', 'stats', 'live'],
        queryFn: communityService.getLiveStats,
        refetchInterval: 30000,
    });

export const useTrendingPosts = (params = {}) =>
    useQuery({
        queryKey: ['community', 'posts', 'trending', params],
        queryFn: () => communityService.getTrendingPosts(params),
    });

export const useShowcaseFeed = (branchSlug) =>
    useQuery({
        queryKey: ['community', 'showcase', branchSlug],
        queryFn: () => communityService.getShowcaseFeed(branchSlug),
        enabled: !!branchSlug,
    });

export const useGameChatPreview = (gameSlug, limit = 5) =>
  useQuery({
    queryKey: ['community', 'chat-preview', gameSlug],
    queryFn: () => communityService.getGameChatPreview(gameSlug, limit),
    enabled: !!gameSlug,
    refetchInterval: 30000,
  });

export const useGameStats = (gameSlug) =>
  useQuery({
    queryKey: ['community', 'game-stats', gameSlug],
    queryFn: () => communityService.getGameStats(gameSlug),
    enabled: !!gameSlug,
    refetchInterval: 60000,
  });

export const useCommunity = () => ({
    useBranches,
    useBranch,
    useBranchChannels,
    useChannels: useBranchChannels,
    useChannelMessages,
    useSendMessage,
    useGroups,
    useGroup,
    useEvents,
    useLFGPosts,
    useLiveStats,
    useTrendingPosts,
    useShowcaseFeed,
});
