import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to hardcoded values for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wkuyuiypkbgsftgtstra.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdXl1aXlwa2Jnc2Z0Z3RzdHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDE3MTMsImV4cCI6MjA4NzkxNzcxM30.KSRYboSZP_JsD6I5G3xVB8Hi_AiiVBEOmS1WlrdJdP4';

const SecureStoreAdapter = {
    getItem:    (key: string) => SecureStore.getItemAsync(key),
    setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
