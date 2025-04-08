import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trdrcazzlgrwuwahcuxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZHJjYXp6bGdyd3V3YWhjdXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3OTY3MTksImV4cCI6MjA1MTM3MjcxOX0.1jKltZ2FK72zE9iBj8TSinDpdX2Tc8Q395jxPFffgPg';

export const supabase = createClient(supabaseUrl, supabaseKey); 