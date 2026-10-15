import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";

export const useNotifications = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
    select: (res) => res.data.notifications,
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => api.delete(`/api/notifications/${notificationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: notificationsData || [],
    isLoading,
    error,
    refetch,
    isRefetching,
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};
