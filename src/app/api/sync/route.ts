import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  // Use the user's JWT to interact with Supabase (RLS will apply)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  try {
    const { batch } = await req.json();

    if (!batch || !Array.isArray(batch)) {
      return NextResponse.json({ error: 'Invalid batch format' }, { status: 400 });
    }

    // Process each operation in the batch
    // Note: In a real-world scenario, you might want to wrap this in a transaction.
    // However, Supabase REST API doesn't support multi-statement transactions directly.
    // For strict atomicity, consider using a Supabase RPC or a direct Postgres connection.
    for (const op of batch) {
      const { op: operation, table, id, opData } = op;

      // Basic validation
      if (!table || !id) {
        console.warn('Skipping invalid operation:', op);
        continue;
      }

      let error;

      switch (operation) {
        case 'PUT':
          // PUT usually implies creating or replacing. We'll use Upsert.
          const record = { ...opData, id };
          ({ error } = await supabase.from(table).upsert(record));
          break;
        case 'PATCH':
          // PATCH implies partial update.
          ({ error } = await supabase.from(table).update(opData).eq('id', id));
          break;
        case 'DELETE':
          ({ error } = await supabase.from(table).delete().eq('id', id));
          break;
        default:
          console.warn(`Unknown operation: ${operation}`);
          continue;
      }

      if (error) {
        console.error(`Error processing ${operation} on ${table} (${id}):`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Sync API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
