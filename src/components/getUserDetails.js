import supabase from './SupabaseClient';

const getUserDetails = async (columnName) => {
  // Get the current user session
  const {
    data: { session },
    error: authError
  } = await supabase.auth.getSession();

  if (authError) {
    console.error('Error fetching session:', authError);
    return;
  }

  const user = session?.user;

  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select(columnName)
      .eq('id', user.id);

    if (error) {
      console.error('Error fetching user details:', error);
      return error;
    } else {
      return data;
    }
  } else {
    console.log('No user is signed in');
    return "no user is signed in";
  }
};

export default getUserDetails;