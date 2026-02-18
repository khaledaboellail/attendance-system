import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../src/lib/supabase';

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const { start,end } = req.query;
  if(!start || !end) return res.status(400).json({ error:'اختر التاريخين' });
  try {
    const { data, error } = await supabaseAdmin.from('attendance')
      .select('*, employees(name,employee_code), locations(name)')
      .gte('date', start as string)
      .lte('date', end as string);
    if(error) return res.status(400).json({ error:error.message });
    res.status(200).json(data);
  } catch(err:any){ res.status(500).json({ error:err.message }); }
}
