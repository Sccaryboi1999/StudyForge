import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !supabaseUrl || !supabaseKey) return NextResponse.redirect(new URL("/auth", request.url));
  const supabase = createServerClient(supabaseUrl, supabaseKey, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({name,value,options}) => response.cookies.set(name,value,options)) } });
  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
