import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useApiClient } from "../utils/api";

export const useCreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; imageUri?: string }) => {
      let imageBase64: string | undefined;

      if (postData.imageUri) {
        // Strip query string before extracting extension (iOS URIs can have ?params)
        const cleanUri = postData.imageUri.split("?")[0];
        const ext = cleanUri.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeTypeMap: Record<string, string> = {
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        const mimeType = mimeTypeMap[ext] ?? "image/jpeg";

        // Read the file as base64 and build a data URI
        const base64 = await FileSystem.readAsStringAsync(postData.imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageBase64 = `data:${mimeType};base64,${base64}`;
      }

      // Send as JSON — avoids Vercel's multipart/form-data body size limitations
      return api.post("/api/posts", {
        content: postData.content,
        ...(imageBase64 ? { imageBase64 } : {}),
      });
    },
    onSuccess: () => {
      setContent("");
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      Alert.alert("Success", "Post created successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create post. Please try again.");
    },
  });

  const handleImagePicker = async (useCamera = false) => {
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permResult.status !== "granted") {
      Alert.alert("Permission needed", `Please grant access to your ${useCamera ? "camera" : "photo library"}`);
      return;
    }

    const opts = { allowsEditing: true, aspect: [16, 9] as [number, number], quality: 0.8 as const };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ["images"] as any });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const createPost = () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert("Empty Post", "Please write something or add an image before posting!");
      return;
    }
    createPostMutation.mutate({ content: content.trim(), ...(selectedImage ? { imageUri: selectedImage } : {}) });
  };

  return {
    content,
    setContent,
    selectedImage,
    isCreating: createPostMutation.isPending,
    pickImageFromGallery: () => handleImagePicker(false),
    takePhoto: () => handleImagePicker(true),
    removeImage: () => setSelectedImage(null),
    createPost,
  };
};
