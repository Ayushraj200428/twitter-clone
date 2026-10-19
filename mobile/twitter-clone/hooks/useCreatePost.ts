import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useApiClient } from "../utils/api";

const compressAndGetBase64 = async (uri: string, directBase64?: string | null): Promise<string> => {
  // If already base64 data URI, return as-is
  if (uri.startsWith("data:image/")) {
    return uri;
  }

  try {
    const manipulated = await manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.6, format: SaveFormat.JPEG, base64: true }
    );
    if (manipulated.base64) {
      return `data:image/jpeg;base64,${manipulated.base64}`;
    }
  } catch (err) {
    console.warn("manipulateAsync failed, falling back:", err);
  }

  if (directBase64) {
    return directBase64.startsWith("data:")
      ? directBase64
      : `data:image/jpeg;base64,${directBase64}`;
  }

  // Fallback to FileSystem for native platforms
  if (Platform.OS !== "web") {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (fsErr) {
      console.warn("FileSystem read failed:", fsErr);
    }
  }

  return uri;
};

export const useCreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; imageUri?: string }) => {
      let imageBase64: string | undefined;

      if (postData.imageUri) {
        imageBase64 = await compressAndGetBase64(postData.imageUri, selectedImageBase64);
      }

      return api.post("/api/posts", {
        content: postData.content,
        ...(imageBase64 ? { imageBase64 } : {}),
      });
    },
    onSuccess: () => {
      setContent("");
      setSelectedImage(null);
      setSelectedImageBase64(null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
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
    try {
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

      const opts: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({
            ...opts,
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ["images"],
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          setSelectedImageBase64(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setSelectedImageBase64(null);
        }
      }
    } catch (pickerError) {
      console.error("Image picker error:", pickerError);
      Alert.alert("Error", "Could not open image picker. Please try again.");
    }
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
    removeImage: () => {
      setSelectedImage(null);
      setSelectedImageBase64(null);
    },
    createPost,
  };
};
