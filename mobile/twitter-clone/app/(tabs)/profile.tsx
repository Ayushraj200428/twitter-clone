import EditProfileModal from "../../components/EditProfileModal";
import PostsList from "../../components/PostList";
import SignOutButton from "../../components/SignOutButton";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { usePosts } from "../../hooks/usePosts";
import { useProfile } from "../../hooks/useProfile";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const ProfileScreen = () => {
  const { currentUser, isLoading } = useCurrentUser();
  const insets = useSafeAreaInsets();

  const {
    posts: userPosts,
    refetch: refetchPosts,
    isLoading: isRefetching,
  } = usePosts(currentUser?.username);

  const {
    isEditModalVisible,
    openEditModal,
    closeEditModal,
    formData,
    saveProfile,
    updateFormField,
    isUpdating,
    refetch: refetchProfile,
  } = useProfile();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Could not load profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View>
          <Text className="text-xl font-bold text-gray-900">
            {currentUser.firstName} {currentUser.lastName}
          </Text>
          <Text className="text-gray-500 text-sm">{userPosts.length} Posts</Text>
        </View>
        <SignOutButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchProfile();
              refetchPosts();
            }}
            tintColor="#1DA1F2"
          />
        }
      >
        {/* Banner */}
        <Image
          source={{
            uri:
              currentUser.bannerImage ||
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
          }}
          style={{ width: "100%", height: 192 }}
          resizeMode="cover"
        />

        <View className="px-4 pb-4 border-b border-gray-100">
          <View className="flex-row justify-between items-end mb-4" style={{ marginTop: -64 }}>
            <Image
              source={{
                uri:
                  currentUser.profilePicture ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
              }}
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                borderWidth: 4,
                borderColor: "white",
              }}
            />
            <TouchableOpacity
              className="border border-gray-300 px-6 py-2 rounded-full"
              onPress={openEditModal}
            >
              <Text className="font-semibold text-gray-900">Edit profile</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {currentUser.firstName} {currentUser.lastName} ✓
            </Text>
            <Text className="text-gray-500 mb-2">@{currentUser.username}</Text>
            {currentUser.bio ? (
              <Text className="text-gray-900 mb-3">{currentUser.bio}</Text>
            ) : null}

            {currentUser.location ? (
              <Text className="text-gray-500 mb-2">📍 {currentUser.location}</Text>
            ) : null}

            <Text className="text-gray-500 mb-3">
              📅 Joined {formatJoinDate(currentUser.createdAt)}
            </Text>

            <View className="flex-row">
              <TouchableOpacity className="mr-6">
                <Text className="text-gray-900">
                  <Text className="font-bold">{currentUser.following?.length ?? 0}</Text>
                  <Text className="text-gray-500"> Following</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-gray-900">
                  <Text className="font-bold">{currentUser.followers?.length ?? 0}</Text>
                  <Text className="text-gray-500"> Followers</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PostsList username={currentUser.username} />
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={closeEditModal}
        formData={formData}
        saveProfile={saveProfile}
        updateFormField={updateFormField}
        isUpdating={isUpdating}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
