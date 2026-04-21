import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadUserData(userId) {
  const [itemsRes, historyRes] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', userId)
      .order('position'),
    supabase
      .from('menu_history')
      .select('*')
      .eq('user_id', userId)
      .order('position'),
  ]);
  return {
    items: (itemsRes.data ?? []).map(({ id, name, count, temp }) => ({ id, name, count, temp })),
    history: (historyRes.data ?? []).map(({ name, temp }) => ({ name, temp })),
  };
}

export async function saveItems(userId, items) {
  await supabase.from('menu_items').delete().eq('user_id', userId);
  if (items.length === 0) return;
  await supabase.from('menu_items').insert(
    items.map((item, i) => ({ ...item, user_id: userId, position: i }))
  );
}

export async function saveHistory(userId, history) {
  await supabase.from('menu_history').delete().eq('user_id', userId);
  if (history.length === 0) return;
  await supabase.from('menu_history').insert(
    history.map((entry, i) => ({ ...entry, user_id: userId, position: i }))
  );
}
