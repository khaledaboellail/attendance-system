import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req,res){
  const { name, employee_code, password } = req.body;
  const { data, error } = await supabase.from('employees').insert([{name, employee_code, password, role:'employee'}]);
  if(error) return res.status(400).json({error:error.message});
  res.json(data);
}
