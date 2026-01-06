
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mnpkoxcbxzulougewbbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucGtveGNieHp1bG91Z2V3YmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTI3NzQsImV4cCI6MjA4MzI4ODc3NH0.XPEgtt9zjkS5eFiv2_syCAvznh00cF9wtvIbVitS86U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
