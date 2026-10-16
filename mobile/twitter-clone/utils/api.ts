import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@clerk/clerk-expo";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "https://twitter-clone-sooty-rho-61.vercel.app").replace(/\/$/, "");

export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "User-Agent": "TwitterCloneMobile/1.0",
    },
  });

  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};

export const userApi = {
  syncUser: (api: AxiosInstance) => api.post("/api/users/sync"),
  getCurrentUser: (api: AxiosInstance) => api.get("/api/users/me"),
  updateProfile: (api: AxiosInstance, data: any) => api.put("/api/users/profile", data),
  getUserProfile: (api: AxiosInstance, username: string) =>
    api.get(`/api/users/profile/${username}`),
  followUser: (api: AxiosInstance, targetUserId: string) =>
    api.post(`/api/users/follow/${targetUserId}`),
  searchUsers: (api: AxiosInstance, query: string) =>
    api.get("/api/users/search", { params: { q: query } }),
};

export const postApi = {
  createPost: (api: AxiosInstance, data: { content: string; imageBase64?: string }) =>
    api.post("/api/posts", data),
  getPosts: (api: AxiosInstance) => api.get("/api/posts"),
  getUserPosts: (api: AxiosInstance, username: string) => api.get(`/api/posts/user/${username}`),
  likePost: (api: AxiosInstance, postId: string) => api.post(`/api/posts/${postId}/like`),
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/api/posts/${postId}`),
};

export const commentApi = {
  createComment: (api: AxiosInstance, postId: string, content: string) =>
    api.post(`/api/comments/post/${postId}`, { content }),
  deleteComment: (api: AxiosInstance, commentId: string) =>
    api.delete(`/api/comments/${commentId}`),
};

export const notificationApi = {
  getNotifications: (api: AxiosInstance) => api.get("/api/notifications"),
  deleteNotification: (api: AxiosInstance, notificationId: string) =>
    api.delete(`/api/notifications/${notificationId}`),
};
