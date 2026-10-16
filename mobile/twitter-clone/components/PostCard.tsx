import { Post, User } from "../types";
import { formatDate, formatNumber } from "../utils/formatters";
import { AntDesign, Feather } from "@expo/vector-icons";
import { View, Text, Alert, Image, TouchableOpacity, Share } from "react-native";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (post: Post) => void;
  isLiked?: boolean;
  currentUser?: User;
}

const PostCard = ({ currentUser, onDelete, onLike, post, isLiked, onComment }: PostCardProps) => {
  // Compare using string form to handle both ObjectId objects and plain strings
  const isOwnPost = currentUser
    ? post.user._id.toString() === currentUser._id.toString()
    : false;

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(post._id),
      },
    ]);
  };

  const handleShare = async () => {
    try {
      const message = post.content
        ? `"${post.content}" — @${post.user.username}`
        : `Check out this post by @${post.user.username}`;
      await Share.share({ message });
    } catch {
      // user dismissed share sheet — no action needed
    }
  };

  return (
    <View className="border-b border-gray-100 bg-white">
      <View className="flex-row p-4">
        <Image
          source={{ uri: post.user.profilePicture || "" }}
          className="w-12 h-12 rounded-full mr-3"
        />

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center flex-1 flex-wrap">
              <Text className="font-bold text-gray-900 mr-1">
                {post.user.firstName} {post.user.lastName}
              </Text>
              <Text className="text-gray-500 ml-1" numberOfLines={1}>
                @{post.user.username} · {formatDate(post.createdAt)}
              </Text>
            </View>
            {isOwnPost && (
              <TouchableOpacity onPress={handleDelete} className="ml-2">
                <Feather name="trash-2" size={18} color="#657786" />
              </TouchableOpacity>
            )}
          </View>

          {post.content ? (
            <Text className="text-gray-900 text-base leading-5 mb-3">{post.content}</Text>
          ) : null}

          {post.image ? (
            <Image
              source={{ uri: post.image }}
              className="w-full h-48 rounded-2xl mb-3"
              resizeMode="cover"
            />
          ) : null}

          {/* Action buttons */}
          <View className="flex-row justify-between max-w-xs mt-1">
            {/* Comment */}
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => onComment(post)}
              activeOpacity={0.7}
            >
              <Feather name="message-circle" size={18} color="#657786" />
              <Text className="text-gray-500 text-sm ml-2">
                {formatNumber(post.comments?.length || 0)}
              </Text>
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => onLike(post._id)}
              activeOpacity={0.7}
            >
              {isLiked ? (
                <AntDesign name="heart" size={18} color="#E0245E" />
              ) : (
                <AntDesign name="hearto" size={18} color="#657786" />
              )}
              <Text
                style={{ color: isLiked ? "#E0245E" : "#657786" }}
                className="text-sm ml-2"
              >
                {formatNumber(post.likes?.length || 0)}
              </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
              <Feather name="share" size={18} color="#657786" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
