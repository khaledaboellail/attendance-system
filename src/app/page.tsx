'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [employeeCode, setEmployeeCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_code', employeeCode)
      .single()

    if (error || !data) {
      setError('Employee not found')
      return
    }

    // تحقق من الباسورد
    const bcrypt = (await import('bcryptjs')).default
    const isValid = await bcrypt.compare(password, data.password)
    if (!isValid) {
      setError('Wrong password')
      return
    }

    // Login ناجح
    alert(`Welcome ${data.name}`)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input
        placeholder="Employee Code"
        value={employeeCode}
        onChange={(e) => setEmployeeCode(e.target.value)}
      />
      <br />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
