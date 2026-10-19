import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useApiClient, commentApi } from "../utils/api";
import { Comment } from "../types";

export const useComments = (postId?: string) => {
  const [commentText, setCommentText] = useState("");
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const response = await commentApi.getComments(api, postId);
      return response.data.comments as Comment[];
    },
    enabled: !!postId,
  });

  const invalidateData = () => {
    if (postId) {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    }
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["userPosts"] });
  };

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId: targetPostId, content }: { postId: string; content: string }) => {
      const response = await commentApi.createComment(api, targetPostId, content);
      return response.data;
    },
    onSuccess: () => {
      setCommentText("");
      invalidateData();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to post comment. Try again.";
      Alert.alert("Error", message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await commentApi.deleteComment(api, commentId);
      return response.data;
    },
    onSuccess: () => {
      invalidateData();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete comment. Try again.";
      Alert.alert("Error", message);
    },
  });

  const createComment = (targetPostId: string) => {
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write something before posting!");
      return;
    }
    createCommentMutation.mutate({ postId: targetPostId, content: commentText.trim() });
  };

  const deleteComment = (commentId: string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCommentMutation.mutate(commentId),
      },
    ]);
  };

  return {
    comments,
    isLoadingComments,
    commentText,
    setCommentText,
    createComment,
    deleteComment,
    isCreatingComment: createCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
