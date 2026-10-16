import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";

// Warm up the browser for faster OAuth on Android
WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = "oauth_google" | "oauth_apple";

export function useSocialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const handleSocialAuth = useCallback(
    async (strategy: OAuthStrategy) => {
      setIsLoading(true);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: "twitterclone://oauth-callback",
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("OAuth error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [startSSOFlow, router]
  );

  return { handleSocialAuth, isLoading };
}
