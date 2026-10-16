import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import type { Href } from "expo-router";

export default function Index() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? ("/(tabs)" as Href) : ("/(auth)" as Href)} />;
}
