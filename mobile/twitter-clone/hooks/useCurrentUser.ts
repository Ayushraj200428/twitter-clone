import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../utils/api";
import { User } from "../types";

export const useCurrentUser = () => {
  const api = useApiClient();

  const { data: currentUser, isLoading, error, refetch } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await api.get("/api/users/me");
      return response.data.user as User;
    },
    retry: 1,
  });

  return { currentUser, isLoading, error, refetch };
};
