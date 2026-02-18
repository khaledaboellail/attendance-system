import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../src/lib/supabase';

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  try {
    const { data, error } = await supabaseAdmin.from('employees').select('*');
    if(error) return res.status(400).json({ error:error.message });
    res.status(200).json(data);
  } catch(err:any){ res.status(500).json({ error:err.message }); }
}
