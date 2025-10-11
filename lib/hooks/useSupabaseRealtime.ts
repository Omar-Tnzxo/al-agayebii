import { useEffect, useRef, useState } from 'react';
import { createClient, SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

interface UseSupabaseRealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useSupabaseRealtime({ table, event = '*', schema = 'public', onChange }: UseSupabaseRealtimeOptions) {
  const [lastPayload, setLastPayload] = useState<RealtimePostgresChangesPayload<any> | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!table) return;
    
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        { event, schema, table },
        (payload: any) => {
          setLastPayload(payload);
          if (onChange) onChange(payload);
        }
      )
      .subscribe();
      
    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, schema, onChange]);

  return { lastPayload };
} 