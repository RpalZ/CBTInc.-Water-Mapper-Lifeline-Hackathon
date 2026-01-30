import { NextResponse, NextRequest } from "next/server";

export async function POST(req:NextRequest) {

    const response = await req.json()
    console.log(response)
    return NextResponse.json({success:true})
}