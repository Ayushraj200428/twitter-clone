import { useComments } from "../hooks/useComments";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Post } from "../types";
import { Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";

interface CommentsModalProps {
  selectedPost: Post | null;
  onClose: () => void;
}

const CommentsModal = ({ selectedPost, onClose }: CommentsModalProps) => {
  const {
    comments: fetchedComments,
    commentText,
    setCommentText,
    createComment,
    deleteComment,
    confirmDeleteComment,
    cancelDeleteComment,
    isCreatingComment,
    deletingCommentId,
    confirmDeleteId,
  } = useComments(selectedPost?._id);

  const { currentUser } = useCurrentUser();

  const handleClose = () => {
    onClose();
    setCommentText("");
  };

  // Always use freshly fetched comments; normalise _id to plain strings
  const rawComments = fetchedComments ?? selectedPost?.comments ?? [];
  const comments = rawComments.map((c: any) => ({
    ...c,
    _id: typeof c._id === "object" ? String(c._id) : c._id,
    user: c.user
      ? {
          ...c.user,
          _id: typeof c.user._id === "object" ? String(c.user._id) : c.user._id,
        }
      : c.user,
  }));

  return (
    <Modal visible={!!selectedPost} animationType="slide" presentationStyle="pageSheet">
      {/* MODAL HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={handleClose}>
          <Text className="text-blue-500 text-lg">Close</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Comments</Text>
        <View className="w-12" />
      </View>

      {selectedPost && (
        <ScrollView className="flex-1">
          {/* ORIGINAL POST */}
          <View className="border-b border-gray-100 bg-white p-4">
            <View className="flex-row">
              <Image
                source={{
                  uri:
                    selectedPost.user?.profilePicture ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                }}
                className="size-12 rounded-full mr-3"
              />
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="font-bold text-gray-900 mr-1">
                    {selectedPost.user?.firstName || ""}{" "}
                    {selectedPost.user?.lastName || ""}
                  </Text>
                  <Text className="text-gray-500 ml-1">
                    @{selectedPost.user?.username || "user"}
                  </Text>
                </View>
                {selectedPost.content ? (
                  <Text className="text-gray-900 text-base leading-5 mb-3">
                    {selectedPost.content}
                  </Text>
                ) : null}
                {selectedPost.image ? (
                  <Image
                    source={{ uri: selectedPost.image }}
                    className="w-full h-48 rounded-2xl mb-3"
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            </View>
          </View>

          {/* COMMENTS LIST */}
          {comments.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-400">No comments yet. Be the first!</Text>
            </View>
          ) : (
            comments.map((comment: any) => {
              const currentUserId = currentUser?._id?.toString();
              const commentAuthorId = comment.user?._id?.toString();
              const postAuthorId = selectedPost.user?._id?.toString();

              const canDelete =
                !!currentUserId &&
                (commentAuthorId === currentUserId || postAuthorId === currentUserId);

              const isThisDeleting = deletingCommentId === comment._id;
              const isThisConfirming = confirmDeleteId === comment._id;

              return (
                <View
                  key={comment._id}
                  className="border-b border-gray-100 bg-white p-4"
                >
                  <View className="flex-row">
                    <Image
                      source={{
                        uri:
                          comment.user?.profilePicture ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                      }}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <View className="flex-1">
                      {/* Author row + delete control */}
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center flex-1">
                          <Text className="font-bold text-gray-900 mr-1">
                            {comment.user?.firstName || ""}{" "}
                            {comment.user?.lastName || ""}
                          </Text>
                          <Text className="text-gray-500 text-sm ml-1">
                            @{comment.user?.username || "user"}
                          </Text>
                        </View>

                        {canDelete && (
                          <View className="ml-2">
                            {isThisDeleting ? (
                              /* Spinner while API call is in-flight */
                              <ActivityIndicator size="small" color="#E0245E" />
                            ) : isThisConfirming && Platform.OS === "web" ? (
                              /* Inline confirm row — replaces window.confirm on web */
                              <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                  onPress={() => confirmDeleteComment(comment._id)}
                                  className="bg-red-500 px-2 py-1 rounded"
                                >
                                  <Text className="text-white text-xs font-semibold">
                                    Delete
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={cancelDeleteComment}
                                  className="bg-gray-200 px-2 py-1 rounded"
                                >
                                  <Text className="text-gray-700 text-xs font-semibold">
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              /* Trash icon */
                              <TouchableOpacity
                                onPress={() => deleteComment(comment._id)}
                                className="p-1"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Feather name="trash-2" size={16} color="#E0245E" />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>

                      <Text className="text-gray-900 text-base leading-5 mb-2">
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* ADD COMMENT INPUT */}
          <View className="p-4 border-t border-gray-100">
            <View className="flex-row">
              <Image
                source={{
                  uri:
                    currentUser?.profilePicture ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                }}
                className="size-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 text-base mb-3"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg self-start ${
                    commentText.trim() ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  onPress={() => createComment(selectedPost._id)}
                  disabled={isCreatingComment || !commentText.trim()}
                >
                  {isCreatingComment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      className={`font-semibold ${
                        commentText.trim() ? "text-white" : "text-gray-500"
                      }`}
                    >
                      Reply
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </Modal>
  );
};

export default CommentsModal;
