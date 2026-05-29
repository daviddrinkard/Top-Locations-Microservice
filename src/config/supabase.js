const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in environment.");
}

// The Arcadia app's tables live in the default "public" schema.
const SCHEMA = process.env.SUPABASE_SCHEMA || "public";

// Single shared client for the whole service.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: SCHEMA },
});

module.exports = supabase;
