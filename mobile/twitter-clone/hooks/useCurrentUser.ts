import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../utils/api";

export const useCurrentUser = () => {
  const api = useApiClient();

  const { data: currentUser, isLoading, error, refetch } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        // Try GET first (new backend)
        return await api.get("/api/users/me");
      } catch {
        // Fall back to POST (old Vercel deployment still running)
        return await api.post("/api/users/me");
      }
    },
    select: (response) => response.data.user,
    retry: 2,
  });

  return { currentUser, isLoading, error, refetch };
};
