import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../src/lib/supabase';

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST') return res.status(405).json({ error:'Method not allowed' });
  const { employee_code, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.from('employees').select('*').eq('employee_code',employee_code).single();
    if(error || !data) return res.status(400).json({ error:'كود الموظف غير موجود' });
    if(data.password!==password) return res.status(400).json({ error:'كلمة السر خاطئة' });
    res.status(200).json(data);
  } catch(err:any){ res.status(500).json({ error:err.message }); }
}
