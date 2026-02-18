'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Admin states
  const [employees, setEmployees] = useState<any[]>([]);
  const [newName,setNewName] = useState('');
  const [newCode,setNewCode] = useState('');
  const [newPassword,setNewPassword] = useState('');
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [startDate,setStartDate] = useState('');
  const [endDate,setEndDate] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if(u) setUser(JSON.parse(u));
    fetchLocations();
    if(user?.role==='admin') fetchEmployees();
  }, [user]);

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*');
    if(data) setLocations(data);
  }

  // ==================== Login ====================
  const handleLogin = async () => {
    const { data, error } = await supabase.from('employees')
      .select('*').eq('employee_code', employeeCode).single();
    if(error || !data) return alert('كود الموظف غير موجود');
    if(password !== data.password) return alert('كلمة السر خاطئة');
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  }

  // ==================== Utils ====================
  const getDistance = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const R = 6371e3;
    const φ1 = lat1*Math.PI/180;
    const φ2 = lat2*Math.PI/180;
    const Δφ = (lat2-lat1)*Math.PI/180;
    const Δλ = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))*R;
  }

  // ==================== Employee ====================
  const handleCheckIn = async () => {
    if(!selectedLocation) return alert('اختر الموقع');
    if(!navigator.geolocation) return alert('لا يمكن تحديد موقعك');

    navigator.geolocation.getCurrentPosition(async pos=>{
      const loc = locations.find(l=>l.id===selectedLocation);
      if(!loc) return alert('الموقع غير موجود');

      const distance = getDistance(pos.coords.latitude, pos.coords.longitude, loc.latitude, loc.longitude);
      if(distance > loc.allowed_radius) return alert('أنت خارج النطاق المسموح به');

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('attendance').upsert([{
        employee_id: user.id,
        date: today,
        check_in: new Date(),
        location_id: loc.id
      }], { onConflict: 'employee_id,date' });

      if(error) return alert('حدث خطأ أثناء تسجيل الحضور');
      alert('تم تسجيل الحضور بنجاح');
    });
  }

  const handleCheckOut = async () => {
    if(!selectedLocation) return alert('اختر الموقع');
    if(!navigator.geolocation) return alert('لا يمكن تحديد موقعك');

    navigator.geolocation.getCurrentPosition(async pos=>{
      const loc = locations.find(l=>l.id===selectedLocation);
      if(!loc) return alert('الموقع غير موجود');

      const distance = getDistance(pos.coords.latitude, pos.coords.longitude, loc.latitude, loc.longitude);
      if(distance > loc.allowed_radius) return alert('أنت خارج النطاق المسموح به');

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('attendance').update({
        check_out: new Date()
      }).eq('employee_id', user.id).eq('date', today);

      if(error) return alert('حدث خطأ أثناء تسجيل الانصراف');
      alert('تم تسجيل الانصراف بنجاح');
    });
  }

  // ==================== Admin ====================
  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*');
    if(data) setEmployees(data);
  }

  const addEmployee = async () => {
    if(!newName || !newCode || !newPassword) return alert('املأ جميع الحقول');
    
    const { error, data } = await supabase.from('employees').insert([{
      name: newName,
      employee_code: newCode,
      password: newPassword,
      role: 'employee'
    }]).select();

    if(error) return alert('حدث خطأ: ' + error.message);

    alert('تم إضافة الموظف بنجاح!');
    
    // تحديث قائمة الموظفين مباشرة
    if(data) setEmployees(prev => [...prev, ...data]);

    setNewName('');
    setNewCode('');
    setNewPassword('');
  }

  const fetchAttendance = async () => {
    if(!startDate || !endDate) return alert('اختر التاريخين');
    const { data } = await supabase.from('attendance')
      .select(`*, employees(name,employee_code), locations(name)`)
      .gte('date', startDate)
      .lte('date', endDate);
    if(data) setAttendanceList(data);
  }

  // ==================== Conditional Rendering ====================
  if(!user) return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">تسجيل الدخول</h1>
      <input placeholder="كود الموظف" value={employeeCode} onChange={e=>setEmployeeCode(e.target.value)} className="border p-2 m-1"/>
      <input type="password" placeholder="كلمة السر" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 m-1"/>
      <button onClick={handleLogin} className="bg-blue-500 text-white p-2 m-1 rounded">دخول</button>
    </div>
  );

  if(user.role==='admin') return (
    <div className="p-4">
      <h1 className="text-xl mb-4">لوحة الأدمن - أهلا {user.name}</h1>

      <h2 className="text-lg mt-2">إضافة موظف جديد</h2>
      <input placeholder="الاسم" value={newName} onChange={e=>setNewName(e.target.value)} className="border p-2 m-1"/>
      <input placeholder="كود الموظف" value={newCode} onChange={e=>setNewCode(e.target.value)} className="border p-2 m-1"/>
      <input type="password" placeholder="كلمة السر" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="border p-2 m-1"/>
      <button onClick={addEmployee} className="bg-green-500 text-white p-2 m-1 rounded">إضافة موظف</button>

      <h2 className="text-lg mt-4">قائمة الموظفين</h2>
      <ul>
        {employees.map(emp=><li key={emp.id}>{emp.name} ({emp.employee_code})</li>)}
      </ul>

      <h2 className="text-lg mt-4">كشف الحضور من - إلى</h2>
      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border p-2 m-1"/>
      <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border p-2 m-1"/>
      <button onClick={fetchAttendance} className="bg-blue-500 text-white p-2 m-1 rounded">عرض الحضور</button>

      <ul>
        {attendanceList.map(a=>(
          <li key={a.id}>
            {a.employees.name} ({a.employees.employee_code}) - {a.date} - 
            {a.check_in ? ' حضور: '+new Date(a.check_in).toLocaleTimeString() : ''} 
            {a.check_out ? ' انصراف: '+new Date(a.check_out).toLocaleTimeString() : ''} 
            - {a.locations.name}
          </li>
        ))}
      </ul>
    </div>
  );

  // ==================== Employee ====================
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">لوحة الموظف - أهلا {user.name}</h1>
      <select value={selectedLocation} onChange={e=>setSelectedLocation(e.target.value)} className="border p-2 m-1">
        <option value="">اختر الموقع</option>
        {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button onClick={handleCheckIn} className="bg-green-500 text-white p-2 m-1 rounded">تسجيل حضور</button>
      <button onClick={handleCheckOut} className="bg-red-500 text-white p-2 m-1 rounded">تسجيل انصراف</button>
    </div>
  )
}
