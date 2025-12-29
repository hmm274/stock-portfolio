import {createClient} from '@supabase/supabase-js';

const supabaseURL = "https://qjrxddneaupxyvreuwut.supabase.co";
const supabaseKey = "sb_publishable_nDMBd3KWG4McK4-QgAiq6g_RWpTkLY6";
const supabase = createClient(supabaseURL, supabaseKey);

export default supabase;