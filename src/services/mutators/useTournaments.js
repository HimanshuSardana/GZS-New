import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import tournamentService from '../features/tournamentService';

export const useTournamentsList = (params = {}) =>
    useQuery({
        queryKey: ['tournaments', params],
        queryFn: () => tournamentService.getTournaments(params),
    });

export const useTournamentBySlug = (slug) =>
    useQuery({
        queryKey: ['tournament', slug],
        queryFn: () => tournamentService.getTournamentBySlug(slug),
        enabled: !!slug,
    });

export const useTournamentBracket = (slug) =>
    useQuery({
        queryKey: ['tournament', slug, 'bracket'],
        queryFn: () => tournamentService.getBracketData(slug),
        enabled: !!slug,
    });

export const useTournamentResults = (slug) =>
    useQuery({
        queryKey: ['tournament', slug, 'results'],
        queryFn: () => tournamentService.getResults(slug),
        enabled: !!slug,
    });

export const useTournamentRegister = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => tournamentService.register(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
};

export const useGenerateBracket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tournamentService.generateBracket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
};

export const useCreateTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tournamentService.createTournament,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
};

export const useUpdateTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => tournamentService.updateTournament(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
};

export const useDeleteTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tournamentService.deleteTournament,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
};

export const useTournamentRegistrations = (id) =>
    useQuery({
        queryKey: ['tournament', id, 'registrations'],
        queryFn: () => tournamentService.getRegistrations(id),
        enabled: !!id,
    });

export const useTournamentAnalyticsFunnel = (id) =>
    useQuery({
        queryKey: ['tournament', id, 'analytics', 'funnel'],
        queryFn: () => tournamentService.getAnalyticsFunnel(id),
        enabled: !!id,
    });

export const useTournamentAnalyticsOverTime = (id) =>
    useQuery({
        queryKey: ['tournament', id, 'analytics', 'over-time'],
        queryFn: () => tournamentService.getAnalyticsOverTime(id),
        enabled: !!id,
    });

export const useTournamentAnalyticsGeo = (id) =>
    useQuery({
        queryKey: ['tournament', id, 'analytics', 'geo'],
        queryFn: () => tournamentService.getAnalyticsGeo(id),
        enabled: !!id,
    });

export const useTournamentAnalyticsPrizeStatus = (id) =>
    useQuery({
        queryKey: ['tournament', id, 'analytics', 'prize-status'],
        queryFn: () => tournamentService.getAnalyticsPrizeStatus(id),
        enabled: !!id,
    });

export const useTournaments = useTournamentsList;
export const usePublicTournaments = useTournamentsList;
export const useTournament = useTournamentBySlug;
export const useRegisterTournament = useTournamentRegister;
