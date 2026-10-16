import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, userApi } from "../../utils/api";
import { User } from "../../types";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const TRENDING_TOPICS = [
  { topic: "#ReactNative", tweets: "125K" },
  { topic: "#TypeScript", tweets: "89K" },
  { topic: "#WebDevelopment", tweets: "234K" },
  { topic: "#AI", tweets: "567K" },
  { topic: "#TechNews", tweets: "98K" },
];

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const api = useApiClient();
  const { currentUser } = useCurrentUser();

  // Debounce the search query
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    const timer = setTimeout(() => setDebouncedQuery(text.trim()), 400);
    return () => clearTimeout(timer);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["searchUsers", debouncedQuery],
    queryFn: () => userApi.searchUsers(api, debouncedQuery),
    select: (res) => res.data.users as User[],
    enabled: debouncedQuery.length > 0,
  });

  const showResults = debouncedQuery.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search bar */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Text className="mr-2">🔍</Text>
          <TextInput
            placeholder="Search people"
            className="flex-1 ml-1 text-base"
            placeholderTextColor="#657786"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                setDebouncedQuery("");
              }}
            >
              <Text className="text-gray-500 text-base">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {showResults ? (
          /* Search results */
          isSearching ? (
            <View className="p-8 items-center">
              <ActivityIndicator size="large" color="#1DA1F2" />
            </View>
          ) : !searchResults || searchResults.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-500">No users found for "{debouncedQuery}"</Text>
            </View>
          ) : (
            searchResults.map((user: User) => (
              <View
                key={user._id}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <Image
                  source={{ uri: user.profilePicture || "" }}
                  style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text className="text-gray-500 text-sm">@{user.username}</Text>
                  {user.bio ? (
                    <Text className="text-gray-700 text-sm mt-1" numberOfLines={2}>
                      {user.bio}
                    </Text>
                  ) : null}
                </View>
                {/* Don't show follow button for yourself */}
                {currentUser && user._id !== currentUser._id && (
                  <View className="border border-gray-300 px-4 py-1 rounded-full">
                    <Text className="font-semibold text-gray-900 text-sm">Follow</Text>
                  </View>
                )}
              </View>
            ))
          )
        ) : (
          /* Trending topics (default view) */
          <View className="p-4">
            <Text className="text-xl font-bold text-gray-900 mb-4">Trending for you</Text>
            {TRENDING_TOPICS.map((item, index) => (
              <TouchableOpacity key={index} className="py-3 border-b border-gray-100">
                <Text className="text-gray-500 text-sm">Trending in Technology</Text>
                <Text className="font-bold text-gray-900 text-lg">{item.topic}</Text>
                <Text className="text-gray-500 text-sm">{item.tweets} Tweets</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
