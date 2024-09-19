import {createClient} from '@supabase/supabase-js';

const supabaseURL = "https://ligiovzhiyccodgxxjlw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ2lvdnpoaXljY29kZ3h4amx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDY4OTMsImV4cCI6MjA0MjIyMjg5M30.uOJHEpfCEmRdUt8i2AfuzjprNwv6_Uuc4Zx_2lpAonI";
const supabase = createClient(supabaseURL, supabaseKey);

export default supabase;