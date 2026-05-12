
export const supabase = {
  from: (table: string) => {
    console.warn(`Supabase client accessed for table '${table}' but backend is migrated.`);
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          order: async () => ({ data: [], error: null }),
        }),
        order: async () => ({ data: [], error: null }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
    };
  },
  functions: {
    invoke: async (func: string) => {
      console.warn(`Supabase function '${func}' invoked but backend is migrated.`);
      return { data: null, error: null };
    },
  },
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
  }
};