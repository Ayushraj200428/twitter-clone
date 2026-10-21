import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import type { Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait for Clerk to finish loading
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}