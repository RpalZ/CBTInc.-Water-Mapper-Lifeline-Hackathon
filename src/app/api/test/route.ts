import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseServer"; 

export async function GET (req: NextRequest) {

    const locations = await supabase
        .from('location')
        .select('*')
        

    return NextResponse.json(locations)

}