'use client';
import { useState, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  employee_code: string;
  role: string;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  allowed_radius: number;
}

interface Attendance {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  employees: { name: string; employee_code: string };
  locations: { name: string };
}

export default function HomePage() {
  const [user, setUser] = useState<Employee | null>(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Admin states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newName,setNewName] = useState('');
  const [newCode,setNewCode] = useState('');
  const [newPassword,setNewPassword] = useState('');
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [startDate,setStartDate] = useState('');
  const [endDate,setEndDate] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if(u) setUser(JSON.parse(u));
    fetchLocations();
    if(user?.role==='admin') fetchEmployees();
  }, [user]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/getLocations');
      const data = await res.json();
      setLocations(data);
    } catch(err) { console.log(err); }
  }

  // ==================== Login ====================
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ employee_code: employeeCode, password })
      });
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      } else alert(data.error);
    } catch(err:any){ alert(err.message); }
  }

  // ==================== Utils ====================
  const getDistance = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const R = 6371e3;
    const φ1 = lat1*Math.PI/180;
    const φ2 = lat2*Math.PI/180;
    const Δφ = (lat2-lat1)*Math.PI/180;
    const Δλ = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }

  // ==================== Employee ====================
  const handleCheck = async (type:'checkin'|'checkout') => {
    if(!selectedLocation) return alert('اختر الموقع');
    if(!navigator.geolocation) return alert('لا يمكن تحديد موقعك');

    navigator.geolocation.getCurrentPosition(async pos=>{
      const loc = locations.find(l=>l.id===selectedLocation);
      if(!loc) return alert('الموقع غير موجود');
      const distance = getDistance(pos.coords.latitude,pos.coords.longitude,loc.latitude,loc.longitude);
      if(distance > loc.allowed_radius) return alert('أنت خارج النطاق المسموح به');

      try{
        const res = await fetch('/api/checkInOut',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ employee_id: user?.id, type, location_id: loc.id })
        });
        const result = await res.json();
        if(res.ok) alert(type==='checkin'?'تم تسجيل الحضور بنجاح':'تم تسجيل الانصراف بنجاح');
        else alert('حدث خطأ: '+result.error);
      } catch(err:any){ alert('حدث خطأ غير متوقع: '+err.message); }
    });
  }

  // ==================== Admin ====================
  const fetchEmployees = async () => {
    try{
      const res = await fetch('/api/getEmployees');
      const data = await res.json();
      setEmployees(data);
    } catch(err){ console.log(err); }
  }

  const addEmployee = async () => {
    if(!newName||!newCode||!newPassword) return alert('املأ جميع الحقول');
    try{
      const res = await fetch('/api/addEmployee',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:newName, employee_code:newCode, password:newPassword })
      });
      const result = await res.json();
      if(res.ok){
        alert('تم إضافة الموظف بنجاح!');
        if(result.data) setEmployees(prev=>[...prev,...result.data]);
        setNewName(''); setNewCode(''); setNewPassword('');
      } else alert('حدث خطأ: '+result.error);
    } catch(err:any){ alert('حدث خطأ غير متوقع: '+err.message); }
  }

  const fetchAttendance = async () => {
    if(!startDate||!endDate) return alert('اختر التاريخين');
    try{
      const res = await fetch(`/api/getAttendance?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setAttendanceList(data);
    } catch(err){ console.log(err); }
  }

  // ==================== Rendering ====================
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

  // Employee
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">لوحة الموظف - أهلا {user.name}</h1>
      <select value={selectedLocation} onChange={e=>setSelectedLocation(e.target.value)} className="border p-2 m-1">
        <option value="">اختر الموقع</option>
        {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button onClick={()=>handleCheck('checkin')} className="bg-green-500 text-white p-2 m-1 rounded">تسجيل حضور</button>
      <button onClick={()=>handleCheck('checkout')} className="bg-red-500 text-white p-2 m-1 rounded">تسجيل انصراف</button>
    </div>
  )
}
