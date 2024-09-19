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
    // Query the database to get the specified column for the current user
    const { data, error } = await supabase
      .from('users') // Replace 'users' with your table name
      .select(columnName) // Select only the column passed as a parameter
      .eq('id', user.id); // Query based on user's ID

    console.log("Supabase query result:", data); // Add this log to see the output

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