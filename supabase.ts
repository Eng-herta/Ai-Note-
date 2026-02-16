
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyzghdotzujobbsjdgyv.supabase.co';
const supabaseAnonKey = 'sb_publishable_ydvMEuDB3exRUnM5cFPFhQ_T5QBB4yd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * UPDATED ANONYMOUS SQL SCHEMA (Run in Supabase SQL Editor):
 * 
 * create extension if not exists vector;
 * 
 * create table public.notes (
 *   id uuid default gen_random_uuid() primary key,
 *   guest_id text not null, 
 *   title text not null default 'Untitled',
 *   content text default '',
 *   summary text,
 *   category text default 'General',
 *   note_type text default 'Thought',
 *   tags text[] default array[]::text[],
 *   key_points text[] default array[]::text[],
 *   common_topics text[] default array[]::text[],
 *   suggested_links text[] default array[]::text[],
 *   embedding vector(768),
 *   created_at timestamp with time zone default now(),
 *   updated_at timestamp with time zone default now()
 * );
 * 
 * create table public.tasks (
 *   id uuid default gen_random_uuid() primary key,
 *   note_id uuid references public.notes on delete cascade not null,
 *   guest_id text not null,
 *   task_text text not null,
 *   completed boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table public.events (
 *   id uuid default gen_random_uuid() primary key,
 *   guest_id text not null,
 *   note_id uuid references public.notes on delete set null,
 *   title text not null,
 *   description text,
 *   event_date date not null,
 *   start_time text,
 *   end_time text,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table public.images (
 *   id uuid default gen_random_uuid() primary key,
 *   guest_id text not null,
 *   note_id uuid references public.notes on delete cascade not null,
 *   image_url text not null,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * alter table public.notes disable row level security;
 * alter table public.tasks disable row level security;
 * alter table public.events disable row level security;
 * alter table public.images disable row level security;
 */
