import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import type { Href } from "expo-router";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}