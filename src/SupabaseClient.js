import {createClient} from '@supabase/supabase-js';

const supabaseURL = "https://ligiovzhiyccodgxxjlw.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseURL, supabaseKey);

export default supabase;