import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import blogsService from '../features/blogsService';

export const useBlogsList = (params = {}) =>
    useQuery({
        queryKey: ['blogs', params],
        queryFn: () => blogsService.getBlogs(params),
    });

export const useBlogBySlug = (slug) =>
    useQuery({
        queryKey: ['blog', slug],
        queryFn: () => blogsService.getBlogBySlug(slug),
        enabled: !!slug,
    });

export const useFeaturedBlogs = () =>
    useQuery({
        queryKey: ['blogs', 'featured'],
        queryFn: () => blogsService.getFeaturedBlogs(),
    });

export const useBlogCategories = () =>
    useQuery({
        queryKey: ['blogs', 'categories'],
        queryFn: () => blogsService.getCategories(),
    });

export const useLikeBlog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogsService.likeBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

export const useCreateBlog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogsService.createBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

export const useUpdateBlog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => blogsService.updateBlog(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['blog', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

export const useDeleteBlog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogsService.deleteBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

export const useMostReadBlogs = (params = {}) =>
    useQuery({
        queryKey: ['blogs', 'most-read', params],
        queryFn: () => blogsService.getMostReadBlogs(params),
        staleTime: 1000 * 60 * 5,
    });

export const useTrendingBlogs = (params = {}) =>
    useQuery({
        queryKey: ['blogs', 'trending', params],
        queryFn: () => blogsService.getTrendingBlogs(params),
        staleTime: 1000 * 60 * 2,
    });

export const useBlogComments = (slug, params = {}) =>
    useQuery({
        queryKey: ['blog-comments', slug, params],
        queryFn: () => blogsService.getComments(slug, params),
        enabled: !!slug,
    });

export const useCreateComment = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => blogsService.createComment(slug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-comments', slug] });
        },
    });
};

export const useLikeComment = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId) => blogsService.likeComment(slug, commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-comments', slug] });
        },
    });
};

export const useReportComment = (slug) =>
    useMutation({
        mutationFn: ({ commentId, reason }) => blogsService.reportComment(slug, commentId, reason),
    });

export const useReadingList = () =>
    useQuery({
        queryKey: ['reading-list'],
        queryFn: () => blogsService.getReadingList(),
        staleTime: 1000 * 60 * 5,
    });

export const useSaveToReadingList = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slug) => blogsService.saveToReadingList(slug),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reading-list'] }),
    });
};

export const useRemoveFromReadingList = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slug) => blogsService.removeFromReadingList(slug),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reading-list'] }),
    });
};

export const useBlogs = useBlogsList;
export const useBlog = useBlogBySlug;
