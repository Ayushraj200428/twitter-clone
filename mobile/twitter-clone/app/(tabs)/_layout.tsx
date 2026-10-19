import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useUserSync } from "../../hooks/useUserSync";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  useUserSync();

  if (!isSignedIn) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1DA1F2",
        tabBarInactiveTintColor: "#657786",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          height: 50 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔔</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>✉️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
