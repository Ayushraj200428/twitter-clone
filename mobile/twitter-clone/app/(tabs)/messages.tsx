import { CONVERSATIONS, ConversationType } from "../../data/conversations";
import { useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const MessagesScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [conversationsList, setConversationsList] = useState(CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const deleteConversation = (conversationId: number) => {
    Alert.alert("Delete Conversation", "Are you sure you want to delete this conversation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setConversationsList((prev) => prev.filter((conv) => conv.id !== conversationId)),
      },
    ]);
  };

  const openConversation = (conversation: ConversationType) => {
    setSelectedConversation(conversation);
    setIsChatOpen(true);
  };

  const closeChatModal = () => {
    setIsChatOpen(false);
    setSelectedConversation(null);
    setNewMessage("");
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      setConversationsList((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: newMessage, time: "now" }
            : conv
        )
      );
      setNewMessage("");
      Alert.alert("Message Sent!", `Sent to ${selectedConversation.user.name}`);
    }
  };

  const filtered = conversationsList.filter(
    (c) =>
      c.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 20 }}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Text className="mr-2">🔍</Text>
          <TextInput
            placeholder="Search for people and groups"
            className="flex-1 text-base"
            placeholderTextColor="#657786"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Conversations */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {filtered.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            className="flex-row items-center p-4 border-b border-gray-50"
            onPress={() => openConversation(conversation)}
            onLongPress={() => deleteConversation(conversation.id)}
          >
            <Image
              source={{ uri: conversation.user.avatar }}
              style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
            />
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-semibold text-gray-900">{conversation.user.name}</Text>
                <Text className="text-gray-500 text-sm">{conversation.time}</Text>
              </View>
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <Text className="text-xs text-gray-500 text-center">Tap to open • Long press to delete</Text>
      </View>

      {/* Chat Modal */}
      <Modal visible={isChatOpen} animationType="slide" presentationStyle="pageSheet">
        {selectedConversation && (
          <SafeAreaView className="flex-1">
            {/* Chat Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <TouchableOpacity onPress={closeChatModal} className="mr-3">
                <Text style={{ fontSize: 22, color: "#1DA1F2" }}>←</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: selectedConversation.user.avatar }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
              />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">
                  {selectedConversation.user.name}
                </Text>
                <Text className="text-gray-500 text-sm">@{selectedConversation.user.username}</Text>
              </View>
            </View>

            {/* Messages */}
            <ScrollView className="flex-1 px-4 py-4">
              <Text className="text-center text-gray-400 text-sm mb-4">
                Beginning of your conversation with {selectedConversation.user.name}
              </Text>
              {selectedConversation.messages.map((message) => (
                <View
                  key={message.id}
                  className={`flex-row mb-3 ${message.fromUser ? "justify-end" : ""}`}
                >
                  {!message.fromUser && (
                    <Image
                      source={{ uri: selectedConversation.user.avatar }}
                      style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                    />
                  )}
                  <View className={`flex-1 ${message.fromUser ? "items-end" : ""}`}>
                    <View
                      style={{
                        backgroundColor: message.fromUser ? "#1DA1F2" : "#F3F4F6",
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        maxWidth: 280,
                      }}
                    >
                      <Text style={{ color: message.fromUser ? "white" : "#111827" }}>
                        {message.text}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-400 mt-1">{message.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-3 mr-3">
                <TextInput
                  className="flex-1 text-base"
                  placeholder="Start a message..."
                  placeholderTextColor="#657786"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!newMessage.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: newMessage.trim() ? "#1DA1F2" : "#D1D5DB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>➤</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default MessagesScreen;
