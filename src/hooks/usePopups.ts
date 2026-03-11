import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Popup, PopupFormData } from '@/types/popup';

export function usePopups(type?: 'homepage' | 'funnel') {
  return useQuery({
    queryKey: ['popups', type],
    queryFn: async () => {
      return [] as Popup[];
    },
  });
}

export function useActivePopups(type: 'homepage' | 'funnel') {
  return useQuery({
    queryKey: ['popups', 'active', type],
    queryFn: async () => {
      return [] as Popup[];
    },
  });
}

export function useCreatePopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (popup: PopupFormData) => {
      throw new Error("Não implementado");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
    },
  });
}

export function useUpdatePopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...popup }: Partial<Popup> & { id: string }) => {
      throw new Error("Não implementado");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
    },
  });
}

export function useDeletePopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      throw new Error("Não implementado");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
    },
  });
}
