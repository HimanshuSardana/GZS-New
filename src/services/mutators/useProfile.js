import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import profileService from '@/services/features/profileService';
import core from '@/services/api/core';

export const useMasterProfile = () =>
    useQuery({
        queryKey: ['profile', 'me'],
        queryFn: profileService.getMasterProfile,
        staleTime: 5 * 60 * 1000,
    });

export const useSubProfiles = () =>
    useQuery({
        queryKey: ['profile', 'me', 'subs'],
        queryFn: profileService.getSubProfiles,
        staleTime: 10 * 60 * 1000,
    });

export const useSubProfileByType = (type) =>
    useQuery({
        queryKey: ['profile', 'me', 'sub', type],
        queryFn: () => profileService.getSubProfileByType(type),
        enabled: !!type,
    });

export const usePublicProfile = (username, type = null) =>
    useQuery({
        queryKey: type ? ['profile', 'public', username, type] : ['profile', 'public', username],
        queryFn: () => (type ? profileService.getPublicSub(username, type) : profileService.getPublicMaster(username)),
        enabled: !!username,
    });

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileService.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
};

export const useCreateSubProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileService.createSubProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'subs'] });
        },
    });
};

export const useUpdateSubProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ type, data }) => profileService.updateSubProfile(type, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'sub', variables.type] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'subs'] });
        },
    });
};

export const useDeleteSubProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileService.deleteSubProfile,
        onSuccess: (_, type) => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'subs'] });
            queryClient.removeQueries({ queryKey: ['profile', 'me', 'sub', type] });
        },
    });
};

export const useMasterFeed = (userId) =>
    useQuery({
        queryKey: ['profile', 'feed', userId],
        queryFn: () =>
            core.get(`/profiles/${userId}/feed`)
                .then(r => r.data?.data || r.data || [])
                .catch(() => []),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
    });

export const useProfile = () => ({
    useMyProfile: useMasterProfile,
    useMasterProfile,
    useSubProfiles,
    useSubProfile: useSubProfileByType,
    useSubProfileByType,
    usePublicProfile,
    useUpdateProfile,
    useCreateSubProfile,
    useUpdateSubProfile,
    useDeleteSubProfile,
});
