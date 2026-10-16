import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, postApi } from "../utils/api";

export const usePosts = (username?: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: username ? ["userPosts", username] : ["posts"],
    queryFn: () => (username ? postApi.getUserPosts(api, username) : postApi.getPosts(api)),
    select: (response) => response.data.posts,
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => postApi.likePost(api, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (username) queryClient.invalidateQueries({ queryKey: ["userPosts", username] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => postApi.deletePost(api, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (username) queryClient.invalidateQueries({ queryKey: ["userPosts", username] });
    },
  });

  // likes array can contain either ObjectId objects or plain id strings
  const checkIsLiked = (postLikes: any[], currentUser: any): boolean => {
    if (!currentUser || !postLikes?.length) return false;
    const userId = currentUser._id.toString();
    return postLikes.some((like) => {
      // like can be a populated User object or a raw id string/ObjectId
      const likeId = typeof like === "object" && like !== null
        ? (like._id ?? like).toString()
        : like.toString();
      return likeId === userId;
    });
  };

  return {
    posts: postsData || [],
    isLoading,
    isRefetching,
    error,
    refetch,
    toggleLike: (postId: string) => likePostMutation.mutate(postId),
    deletePost: (postId: string) => deletePostMutation.mutate(postId),
    checkIsLiked,
  };
};
