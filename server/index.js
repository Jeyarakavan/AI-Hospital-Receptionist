const express = require('express')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')
const ShortUniqueId = require('short-unique-id')
const crypto = require('crypto')

const uid = new ShortUniqueId({ length: 8 })

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(bodyParser.json())
app.use(morgan('dev'))
app.use('/recordings', express.static('recordings'))

const { db, ensureSchema } = require('./db')

// Helper: Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// ensure DB schema is present
ensureSchema().then(async ()=>{
  // Seed staff members
  const staffCount = await db('staff').count('id as c').first()
  if(staffCount.c === 0){
    const staffData = [
      {
        id: 'staff-001',
        staffType: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hospital.com',
        mobile: '03001234567',
        department: 'Management',
        designation: 'Administrator',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active'
      },
      {
        id: 'staff-002',
        staffType: 'doctor',
        firstName: 'Dr. Alice',
        lastName: 'Johnson',
        email: 'alice@hospital.com',
        mobile: '03001111111',
        specialization: 'General Practice',
        department: 'General',
        designation: 'Consultant',
        nic: '12345-6789012-3',
        dob: '1985-05-15',
        joiningDate: '2022-01-01',
        licenseNumber: 'LIC-001',
        status: 'active'
      },
      {
        id: 'staff-003',
        staffType: 'doctor',
        firstName: 'Dr. Bob',
        lastName: 'Smith',
        email: 'bob@hospital.com',
        mobile: '03002222222',
        specialization: 'Ophthalmology',
        department: 'Eye Care',
        designation: 'Senior Doctor',
        nic: '98765-4321098-7',
        dob: '1980-08-20',
        joiningDate: '2020-03-15',
        licenseNumber: 'LIC-002',
        status: 'active'
      },
      {
        id: 'staff-004',
        staffType: 'nurse',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@hospital.com',
        mobile: '03003333333',
        department: 'General Ward',
        designation: 'Registered Nurse',
        nic: '55555-6666666-7',
        dob: '1988-03-10',
        joiningDate: '2021-06-01',
        status: 'active'
      },
      {
        id: 'staff-005',
        staffType: 'receptionist',
        firstName: 'Emma',
        lastName: 'Brown',
        email: 'emma@hospital.com',
        mobile: '03004444444',
        department: 'Reception',
        designation: 'Receptionist',
        nic: '77777-8888888-9',
        dob: '1992-07-25',
        joiningDate: '2022-09-01',
        status: 'active'
      }
    ]
    await db('staff').insert(staffData)

    // Create credentials for seed staff
    const credentialsData = [
      { id: uuidv4(), staffId: 'staff-001', username: 'admin', email: 'admin@hospital.com', passwordHash: hashPassword('admin123'), emailVerified: true },
      { id: uuidv4(), staffId: 'staff-002', username: 'alice', email: 'alice@hospital.com', passwordHash: hashPassword('alice123'), emailVerified: true },
      { id: uuidv4(), staffId: 'staff-003', username: 'bob', email: 'bob@hospital.com', passwordHash: hashPassword('bob123'), emailVerified: true },
      { id: uuidv4(), staffId: 'staff-004', username: 'sarah', email: 'sarah@hospital.com', passwordHash: hashPassword('sarah123'), emailVerified: true },
      { id: uuidv4(), staffId: 'staff-005', username: 'emma', email: 'emma@hospital.com', passwordHash: hashPassword('emma123'), emailVerified: true }
    ]
    await db('staff_credentials').insert(credentialsData)
  }
  
  // Also seed old doctors table for backward compatibility
  const cnt = await db('doctors').count('id as c').first()
  if(cnt.c == 0){
    await db('doctors').insert([{ id: 'doc-1', name: 'Dr. Alice', specialization: 'General' }, { id: 'doc-2', name: 'Dr. Bob', specialization: 'Optical' }])
  }
}).catch(console.error)

io.on('connection', (socket) => {
  console.log('socket connected', socket.id)
})

// ===== STAFF MANAGEMENT ENDPOINTS =====

// Get all staff
app.get('/staff', async (req, res) => {
  try {
    const staffType = req.query.type
    let query = db('staff').select('*')
    if(staffType) query = query.where('staffType', staffType)
    const staff = await query.orderBy('createdAt', 'desc')
    res.json(staff)
  } catch(e) {
    console.error('Staff fetch error', e)
    res.status(500).json({ error: e.message })
  }
})

// Get single staff by ID
app.get('/staff/:id', async (req, res) => {
  try {
    const staff = await db('staff').where({ id: req.params.id }).first()
    if(!staff) return res.status(404).json({ error: 'Staff not found' })
    res.json(staff)
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Register new staff (Admin only)
app.post('/staff', async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, staffType, specialization, department, designation, nic, dob, joiningDate, address, city, phone, licenseNumber } = req.body
    
    if(!firstName || !lastName || !email || !mobile || !staffType || !joiningDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const id = 'staff-' + uuidv4().substring(0, 8)
    const staff = {
      id, staffType, firstName, lastName, email, mobile, specialization, department, designation, nic, dob, joiningDate, address, city, phone, licenseNumber, status: 'active'
    }

    // Insert staff
    await db('staff').insert(staff)

    // Generate credentials (username from first letter + last name, random password)
    const username = (firstName[0] + lastName).toLowerCase().replace(/\s+/g, '')
    const tempPassword = Math.random().toString(36).slice(-8)
    const credId = uuidv4()
    const cred = {
      id: credId,
      staffId: id,
      username,
      email,
      passwordHash: hashPassword(tempPassword),
      emailVerified: false
    }
    await db('staff_credentials').insert(cred)

    res.json({ 
      staff, 
      credentials: { 
        username, 
        tempPassword, 
        email,
        message: 'Staff registered successfully. Send these credentials securely to the user.'
      } 
    })
  } catch(e) {
    console.error('Staff registration error', e)
    res.status(500).json({ error: e.message })
  }
})

// Update staff
app.put('/staff/:id', async (req, res) => {
  try {
    const id = req.params.id
    const updates = req.body
    updates.updatedAt = db.fn.now()
    
    await db('staff').where({ id }).update(updates)
    const updated = await db('staff').where({ id }).first()
    res.json(updated)
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete staff
app.delete('/staff/:id', async (req, res) => {
  try {
    const id = req.params.id
    const staff = await db('staff').where({ id }).first()
    if(!staff) return res.status(404).json({ error: 'Staff not found' })
    
    // Delete credentials too (cascade)
    await db('staff_credentials').where({ staffId: id }).del()
    await db('staff').where({ id }).del()
    
    res.json({ message: 'Staff deleted', staff })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Get staff by type (doctors, nurses, receptionists, etc.)
app.get('/staff-by-type/:type', async (req, res) => {
  try {
    const type = req.params.type
    const staff = await db('staff').where({ staffType: type, status: 'active' }).select('*').orderBy('createdAt', 'desc')
    res.json(staff)
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Staff Login
app.post('/staff-login', async (req, res) => {
  try {
    const { username, password } = req.body
    if(!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const cred = await db('staff_credentials').where({ username }).first()
    if(!cred || cred.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Get staff details
    const staff = await db('staff').where({ id: cred.staffId }).first()
    if(!staff) return res.status(404).json({ error: 'Staff not found' })
    if(staff.status !== 'active') return res.status(403).json({ error: 'Staff account is inactive' })

    // Update last login
    await db('staff_credentials').where({ id: cred.id }).update({ lastLoginAt: new Date().toISOString() })

    res.json({
      token: Buffer.from(`${cred.id}:${cred.staffId}`).toString('base64'),
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        staffType: staff.staffType,
        department: staff.department,
        designation: staff.designation
      }
    })
  } catch(e) {
    console.error('Login error', e)
    res.status(500).json({ error: e.message })
  }
})

// Change password
app.post('/staff/:id/change-password', async (req, res) => {
  try {
    const staffId = req.params.id
    const { oldPassword, newPassword } = req.body

    if(!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' })
    }

    const cred = await db('staff_credentials').where({ staffId }).first()
    if(!cred) return res.status(404).json({ error: 'Credentials not found' })

    if(cred.passwordHash !== hashPassword(oldPassword)) {
      return res.status(401).json({ error: 'Old password incorrect' })
    }

    // Update password
    await db('staff_credentials').where({ staffId }).update({
      passwordHash: hashPassword(newPassword),
      updatedAt: db.fn.now()
    })

    res.json({ message: 'Password changed successfully' })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Get all staff types count (for dashboard stats)
app.get('/staff-stats', async (req, res) => {
  try {
    const doctors = await db('staff').where({ staffType: 'doctor', status: 'active' }).count('id as count').first()
    const nurses = await db('staff').where({ staffType: 'nurse', status: 'active' }).count('id as count').first()
    const receptionists = await db('staff').where({ staffType: 'receptionist', status: 'active' }).count('id as count').first()
    const total = await db('staff').where({ status: 'active' }).count('id as count').first()

    res.json({
      doctors: doctors.count,
      nurses: nurses.count,
      receptionists: receptionists.count,
      total: total.count
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// ===== END STAFF MANAGEMENT =====


app.post('/twilio/webhook', async (req, res) => {
  const payload = req.body
  const id = uuidv4()
  const call = {
    id,
    caller: payload.From || 'Unknown',
    problem: payload.TranscriptionText || payload.Body || 'No details',
    recordingUrl: payload.RecordingUrl || null,
    receivedAt: new Date().toISOString(),
  }

  // persist
  try{
    await db('calls').insert({ id: call.id, caller: call.caller, problem: call.problem, recordingUrl: call.recordingUrl })
  }catch(e){ console.error('DB insert call failed', e) }

  io.emit('new_call', call)
  console.log('New call received', call)

  // optionally: try to fetch recording and request transcription
  if(call.recordingUrl){
    try{
      const fetch = require('node-fetch')
      const resRec = await fetch(call.recordingUrl)
      if(resRec.ok){
        const buffer = await resRec.arrayBuffer()
        const fs = require('fs')
        const filePath = `recordings/${id}.mp3`
        fs.writeFileSync(filePath, Buffer.from(buffer))
        console.log('Recording saved', filePath)

        // attempt transcription using Twilio helper (best-effort)
        const { transcribeRecording } = require('./utils/transcribe')
        const text = await transcribeRecording(call.recordingUrl)
        if(text){
          await db('calls').where({id}).update({ transcription: text })
          io.emit('call_transcription', { id, transcription: text })
        }
      }
    }catch(e){ console.warn('Could not fetch recording', e.message) }
  }

  res.status(200).send('OK')
})

// List calls
app.get('/calls', async (req, res) => {
  const rows = await db('calls').select('*').orderBy('receivedAt','desc')
  res.json(rows)
})

// Transfer call to human
app.post('/calls/:id/transfer', async (req, res) => {
  const id = req.params.id
  await db('calls').where({id}).update({transferred:true})
  const call = await db('calls').where({id}).first()
  io.emit('call_transferred', call)
  return res.json(call)
})
// Appointments
app.get('/appointments', async (req, res) => {
  const rows = await db('appointments').select('*').orderBy('createdAt','desc')
  res.json(rows)
})

app.post('/appointments', async (req, res) => {
  const body = req.body
  const ref = uid()
  const id = uuidv4()
  const time = new Date(body.time).toISOString()
  const appt = {
    id,
    reference: ref,
    patientName: body.patientName,
    mobile: body.mobile,
    problem: body.problem,
    doctorId: body.doctorId || null,
    time,
    createdAt: new Date().toISOString()
  }
  try{
    await db('appointments').insert(appt)
    io.emit('appointment_created', appt)

    // send notification via configured provider (SendGrid/Twilio)
    try{
      const { sendEmail, sendSms } = require('./utils/notifications')
      // send email (if configured)
      await sendEmail(body.email || (body.mobile + '@sms.example.com'), `Appointment confirmation - ${ref}`, `Your appointment is scheduled at ${time}. Reference: ${ref}`)
      // send SMS (if configured)
      await sendSms(body.mobile, `Appointment confirmed. Ref: ${ref} Time: ${time}`)
    }catch(e){ console.warn('Notification failed', e.message) }

    console.log('Simulated notification: email/SMS for appointment', appt)
    res.json(appt)
  }catch(e){
    console.error('Appointment insert failed', e)
    res.status(500).json({ error: 'DB error' })
  }
})

// Doctors
app.get('/doctors', async (req, res) => {
  const rows = await db('doctors').select('*').orderBy('createdAt','desc')
  res.json(rows)
})
app.post('/doctors', async (req, res) => {
  const d = { id: uuidv4(), name: req.body.name, specialization: req.body.specialization }
  await db('doctors').insert(d)
  res.json(d)
})
app.put('/doctors/:id', async (req, res) => {
  const id = req.params.id
  await db('doctors').where({id}).update(req.body)
  const updated = await db('doctors').where({id}).first()
  res.json(updated)
})
app.delete('/doctors/:id', async (req, res) => {
  const id = req.params.id
  const removed = await db('doctors').where({id}).first()
  await db('doctors').where({id}).del()
  res.json(removed)
})

// Notification simulation
app.post('/notify', (req, res) => {
  const payload = req.body
  console.log('Notify request (simulated):', payload)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log('Server listening on', PORT))
