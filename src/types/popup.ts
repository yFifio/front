export interface Popup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  popup_type: 'homepage' | 'funnel';
  is_active: boolean;
  discount_percent: number | null;
  display_delay_seconds: number;
  show_on_exit_intent: boolean;
  created_at: string;
  updated_at: string;
}

export type PopupFormData = Omit<Popup, 'id' | 'created_at' | 'updated_at'>;
