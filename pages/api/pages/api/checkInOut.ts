import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { employee_id, type, location_id } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    if(type === 'checkin') {
      const { error } = await supabase.from('attendance').upsert([{
        employee_id,
        date: today,
        check_in: new Date(),
        location_id
      }], { onConflict: 'employee_id,date' });
      if(error) return res.status(400).json({ error: error.message });
    } else if(type === 'checkout') {
      const { error } = await supabase.from('attendance')
        .update({ check_out: new Date() })
        .eq('employee_id', employee_id).eq('date', today);
      if(error) return res.status(400).json({ error: error.message });
    } else return res.status(400).json({ error: 'نوع غير معروف' });

    res.status(200).json({ success: true });
  } catch(err:any) {
    res.status(500).json({ error: err.message });
  }
}
