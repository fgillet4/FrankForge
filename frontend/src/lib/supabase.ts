// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { GameState } from './gameLoop';

// Initialize Supabase client with fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User authentication
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

// Game save management
export async function saveGame(name: string, gameState: GameState) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  // Check if save with this name exists
  const { data: existingSave } = await supabase
    .from('game_saves')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('name', name)
    .single();
    
  if (existingSave) {
    // Update existing save
    return await supabase
      .from('game_saves')
      .update({
        state_data: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSave.id);
  } else {
    // Create new save
    return await supabase
      .from('game_saves')
      .insert({
        user_id: user.user.id,
        name,
        state_data: gameState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
}

export async function loadGame(saveId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .select('state_data')
    .eq('id', saveId)
    .eq('user_id', user.user.id)
    .single();
}

export async function listSaves() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .select('id, name, created_at, updated_at')
    .eq('user_id', user.user.id)
    .order('updated_at', { ascending: false });
}

export async function deleteSave(saveId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .delete()
    .eq('id', saveId)
    .eq('user_id', user.user.id);
}
