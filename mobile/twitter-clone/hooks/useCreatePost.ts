import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useApiClient } from "../utils/api";

const compressImage = async (uri: string): Promise<string> => {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1024 });
  const img = await ctx.renderAsync();
  const result = await img.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  return result.uri;
};

export const useCreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; imageUri?: string }) => {
      let imageBase64: string | undefined;

      if (postData.imageUri) {
        // Compress the image before encoding to stay under Vercel's 4.5MB body limit
        const compressedUri = await compressImage(postData.imageUri);
        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageBase64 = `data:image/jpeg;base64,${base64}`;
      }

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
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create post. Please try again.";
      Alert.alert("Error", message);
    },
  });

  const handleImagePicker = async (useCamera = false) => {
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permResult.status !== "granted") {
      Alert.alert(
        "Permission needed",
        `Please grant access to your ${useCamera ? "camera" : "photo library"}`
      );
      return;
    }

    const opts = {
      allowsEditing: true,
      aspect: [16, 9] as [number, number],
      quality: 0.8 as const,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync({
          ...opts,
          mediaTypes: ["images"] as any,
        });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const createPost = () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert("Empty Post", "Please write something or add an image before posting!");
      return;
    }
    createPostMutation.mutate({
      content: content.trim(),
      ...(selectedImage ? { imageUri: selectedImage } : {}),
    });
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
