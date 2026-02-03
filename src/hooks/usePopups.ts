import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Popup, PopupFormData } from '@/types/popup';

export function usePopups(type?: 'homepage' | 'funnel') {
  return useQuery({
    queryKey: ['popups', type],
    queryFn: async () => {
      let query = supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('popup_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Popup[];
    },
  });
}

export function useActivePopups(type: 'homepage' | 'funnel') {
  return useQuery({
    queryKey: ['popups', 'active', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .eq('popup_type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Popup[];
    },
  });
}

export function useCreatePopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (popup: PopupFormData) => {
      const { data, error } = await supabase
        .from('popups')
        .insert(popup)
        .select()
        .single();

      if (error) throw error;
      return data as Popup;
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
      const { data, error } = await supabase
        .from('popups')
        .update(popup)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Popup;
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
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
    },
  });
}
