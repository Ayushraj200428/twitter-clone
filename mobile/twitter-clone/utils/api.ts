import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@clerk/clerk-expo";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  const api = axios.create({ baseURL: API_BASE_URL });

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
  syncUser: (api: AxiosInstance) => api.post("/user/sync"),
  getCurrentUser: (api: AxiosInstance) => api.post("/user/me"),
  updateProfile: (api: AxiosInstance, data: any) => api.put("/user/profile", data),
};

export const postApi = {
  createPost: (api: AxiosInstance, data: { content: string; image?: string }) =>
    api.post("/post", data),
  getPosts: (api: AxiosInstance) => api.get("/post"),
  getUserPosts: (api: AxiosInstance, username: string) => api.get(`/post/user/${username}`),
  likePost: (api: AxiosInstance, postId: string) => api.post(`/post/${postId}/like`),
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/post/${postId}`),
};

export const commentApi = {
  createComment: (api: AxiosInstance, postId: string, content: string) =>
    api.post(`/comments/post/${postId}`, { content }),
};