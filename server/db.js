const knex = require('knex')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL

const config = DATABASE_URL ? {
  client: 'pg',
  connection: DATABASE_URL,
  pool: { min: 2, max: 10 }
} : {
  client: 'sqlite3',
  connection: { filename: path.resolve(__dirname, 'dev.sqlite') },
  useNullAsDefault: true
}

const db = knex(config)

async function ensureSchema(){
  // Staff Table - Unified staff management
  if(!(await db.schema.hasTable('staff'))){
    await db.schema.createTable('staff', t=>{
      t.string('id').primary().notNullable()
      t.string('staffType').notNullable()
      t.string('firstName').notNullable()
      t.string('lastName').notNullable()
      t.string('email').notNullable().unique()
      t.string('mobile').notNullable()
      t.string('specialization').nullable()
      t.string('department').nullable()
      t.string('designation').nullable()
      t.string('nic').nullable()
      t.date('dob').nullable()
      t.date('joiningDate').notNullable()
      t.string('address').nullable()
      t.string('city').nullable()
      t.string('phone').nullable()
      t.string('profileImage').nullable()
      t.string('licenseNumber').nullable()
      t.string('status').defaultTo('active')
      t.timestamp('createdAt').defaultTo(db.fn.now())
      t.timestamp('updatedAt').defaultTo(db.fn.now())
    })
  }

  // Staff Credentials Table
  if(!(await db.schema.hasTable('staff_credentials'))){
    await db.schema.createTable('staff_credentials', t=>{
      t.string('id').primary().notNullable()
      t.string('staffId').notNullable().unique()
      t.string('username').notNullable().unique()
      t.string('email').notNullable().unique()
      t.string('passwordHash').notNullable()
      t.boolean('emailVerified').defaultTo(false)
      t.string('lastLoginAt').nullable()
      t.timestamp('createdAt').defaultTo(db.fn.now())
      t.timestamp('updatedAt').defaultTo(db.fn.now())
    })
  }

  if(!(await db.schema.hasTable('doctors'))){
    await db.schema.createTable('doctors', t=>{
      t.string('id').primary().notNullable()
      t.string('name').notNullable()
      t.string('specialization').notNullable()
      t.timestamp('createdAt').defaultTo(db.fn.now())
    })
  }

  if(!(await db.schema.hasTable('appointments'))){
    await db.schema.createTable('appointments', t=>{
      t.string('id').primary().notNullable()
      t.string('reference').notNullable()
      t.string('patientName').notNullable()
      t.string('mobile').notNullable()
      t.string('problem').notNullable()
      t.timestamp('time')
      t.string('doctorId').nullable()
      t.timestamp('createdAt').defaultTo(db.fn.now())
    })
  }

  if(!(await db.schema.hasTable('calls'))){
    await db.schema.createTable('calls', t=>{
      t.string('id').primary().notNullable()
      t.string('caller').notNullable()
      t.string('problem').notNullable()
      t.string('recordingUrl').nullable()
      t.text('transcription').nullable()
      t.boolean('transferred').defaultTo(false)
      t.timestamp('receivedAt').defaultTo(db.fn.now())
    })
  }
}

module.exports = { db, ensureSchema }
