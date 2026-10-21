import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Platform } from "react-native";
import { useApiClient, commentApi } from "../utils/api";
import { Comment } from "../types";

export const useComments = (postId?: string) => {
  const [commentText, setCommentText] = useState("");
  // Track which specific comment is pending confirmation of deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Track which specific comment is actively being deleted (API in-flight)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
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
      setDeletingCommentId(null);
      setConfirmDeleteId(null);
      invalidateData();
    },
    onError: (error: any) => {
      setDeletingCommentId(null);
      setConfirmDeleteId(null);
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

  // Step 1: user taps trash icon — show inline confirm UI
  const requestDeleteComment = (commentId: string) => {
    if (Platform.OS !== "web") {
      // Native: use Alert dialog
      Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDeletingCommentId(commentId);
            deleteCommentMutation.mutate(commentId);
          },
        },
      ]);
    } else {
      // Web: show inline confirm buttons instead of window.confirm (which can be
      // blocked inside a Modal overlay)
      setConfirmDeleteId(commentId);
    }
  };

  // Step 2 (web only): user confirms via inline UI
  const confirmDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    setConfirmDeleteId(null);
    deleteCommentMutation.mutate(commentId);
  };

  // Step 2 (web only): user cancels
  const cancelDeleteComment = () => {
    setConfirmDeleteId(null);
  };

  return {
    comments,
    isLoadingComments,
    commentText,
    setCommentText,
    createComment,
    // renamed: requestDeleteComment is what the trash icon calls
    deleteComment: requestDeleteComment,
    confirmDeleteComment,
    cancelDeleteComment,
    isCreatingComment: createCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    deletingCommentId,
    confirmDeleteId,
  };
};
