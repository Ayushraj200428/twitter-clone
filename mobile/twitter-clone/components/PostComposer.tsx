import { useCreatePost } from "../hooks/useCreatePost";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Feather } from "@expo/vector-icons";
import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";

const PostComposer = () => {
  const {
    content,
    setContent,
    selectedImage,
    isCreating,
    removeImage,
    createPost,
    pickImageFromGallery,
    takePhoto,
  } = useCreatePost();

  const { currentUser } = useCurrentUser();

  return (
    <View className="border-b border-gray-100 p-4 bg-white">
      <View className="flex-row">
        <Image
          source={{
            uri:
              currentUser?.profilePicture ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
          }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <TextInput
            className="text-gray-900 text-lg"
            placeholder="What's happening?"
            placeholderTextColor="#657786"
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={280}
          />
        </View>
      </View>

      {selectedImage && (
        <View className="mt-3">
          <View className="relative">
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-48 rounded-2xl"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-60 rounded-full items-center justify-center"
              onPress={removeImage}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-50">
        {/* Media Buttons */}
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={pickImageFromGallery}
            disabled={isCreating}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            <Feather name="image" size={22} color="#1DA1F2" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            disabled={isCreating}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            <Feather name="camera" size={22} color="#1DA1F2" />
          </TouchableOpacity>
        </View>

        {/* Counter and Post Button */}
        <View className="flex-row items-center">
          {content.length > 0 && (
            <Text
              className={`text-sm mr-3 ${content.length > 260 ? "text-red-500" : "text-gray-500"}`}
            >
              {280 - content.length}
            </Text>
          )}

          <TouchableOpacity
            className={`px-6 py-2 rounded-full ${
              content.trim() || selectedImage ? "bg-blue-500" : "bg-gray-300"
            }`}
            onPress={createPost}
            disabled={isCreating || !(content.trim() || selectedImage)}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                className={`font-semibold ${
                  content.trim() || selectedImage ? "text-white" : "text-gray-500"
                }`}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default PostComposer;