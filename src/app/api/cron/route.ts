import { NextRequest, NextResponse } from "next/server";


export async function POST (req: NextRequest){
    //here we will combine all the steps in the cron job
    //generate csv data
    //run it through centroid function using the api we just made 
    //clean the data and scaffold object {location_id, previous_day, day_of_week, dev_count, pressure}
    //run the ml with these parameters
    //get its output which is the water demand and sticker it with its specific location and store them in supabase
    //front end then reroute them
    //updates automatically per 24 hrs or any interval i suppose
}