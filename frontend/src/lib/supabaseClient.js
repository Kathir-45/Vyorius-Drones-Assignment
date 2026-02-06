import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not configured. Using demo mode without persistence."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://demo.supabase.co",
  supabaseAnonKey || "demo-key"
);

// Auth functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

// Task functions
export const getTasks = async (userId) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const createTask = async (task, userId) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...task, user_id: userId }])
    .select();
  return { data, error };
};

export const updateTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select();
  return { data, error };
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  return { error };
};

// Subscribe to real-time changes
export const subscribeToTasks = (userId, callback) => {
  const subscription = supabase
    .from(`tasks:user_id=eq.${userId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();
  return subscription;
};
