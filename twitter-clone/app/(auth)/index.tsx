import { useSocialAuth } from "@/hooks/useSocialAuth";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function Index() {
  const { handleSocialAuth, isLoading } = useSocialAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 py-6 justify-between" style={{ minHeight: height - 60 }}>

          {/* Top: Logo + Tagline */}
          <View className="items-center mt-4">
            <Text style={{ fontSize: 40 }}>🐦</Text>
            <Text className="text-3xl font-bold text-gray-900 mt-2">Twitter</Text>
            <Text className="text-gray-500 text-sm mt-1">See what's happening in the world</Text>
          </View>

          {/* Middle: Illustration */}
          <View className="items-center justify-center py-4">
            <Image
              source={require("../../assets/images/auth2.png")}
              style={{ width: "100%", height: height * 0.32 }}
              resizeMode="contain"
            />
          </View>

          {/* Bottom: Buttons + Terms */}
          <View className="gap-3 pb-4">
            {/* Google Sign In */}
            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_google")}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 9999,
                paddingVertical: 14,
                paddingHorizontal: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <Image
                    source={require("../../assets/images/google.png")}
                    style={{ width: 22, height: 22, marginRight: 12 }}
                    resizeMode="contain"
                  />
                  <Text className="text-gray-900 font-semibold text-base">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Sign In */}
            <TouchableOpacity
              onPress={() => handleSocialAuth("oauth_apple")}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 9999,
                paddingVertical: 14,
                paddingHorizontal: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Image
                    source={require("../../assets/images/apple.png")}
                    style={{ width: 20, height: 20, marginRight: 12 }}
                    resizeMode="contain"
                  />
                  <Text className="text-gray-900 font-semibold text-base">
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-center text-gray-400 text-xs leading-5 mt-2 px-4">
              By signing up, you agree to our{" "}
              <Text className="text-blue-500">Terms</Text>
              {", "}
              <Text className="text-blue-500">Privacy Policy</Text>
              {", and "}
              <Text className="text-blue-500">Cookie Use</Text>.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
