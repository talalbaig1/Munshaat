# Environment setup

Create .env.local locally with:

NEXT_PUBLIC_SUPABASE_URL=https://yzuntxzebttnjmscagve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>

Do not commit .env.local.

For Vercel, add the same two variables in Project Settings -> Environment Variables.

Never expose or commit the Supabase service-role key.