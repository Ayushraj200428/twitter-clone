import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useApiClient, commentApi } from "../utils/api";

export const useComments = () => {
  const [commentText, setCommentText] = useState("");
  const api = useApiClient();
  const queryClient = useQueryClient();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["userPosts"] });
  };

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await commentApi.createComment(api, postId, content);
      return response.data;
    },
    onSuccess: () => {
      setCommentText("");
      invalidatePosts();
    },
    onError: () => {
      Alert.alert("Error", "Failed to post comment. Try again.");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await commentApi.deleteComment(api, commentId);
      return response.data;
    },
    onSuccess: () => {
      invalidatePosts();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete comment. Try again.";
      Alert.alert("Error", message);
    },
  });

  const createComment = (postId: string) => {
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write something before posting!");
      return;
    }
    createCommentMutation.mutate({ postId, content: commentText.trim() });
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
    commentText,
    setCommentText,
    createComment,
    deleteComment,
    isCreatingComment: createCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
