const sgMail = require('@sendgrid/mail')
const Twilio = require('twilio')

function initSendGrid(){
  if(process.env.SENDGRID_API_KEY){
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    return true
  }
  return false
}

async function sendEmail(to, subject, text){
  if(!process.env.SENDGRID_API_KEY) return console.log('SendGrid not configured; email:', to, subject)
  try{
    await sgMail.send({ to, from: process.env.NOTIFY_FROM_EMAIL || 'no-reply@example.com', subject, text })
  }catch(e){ console.warn('sendEmail failed', e.message) }
}

async function sendSms(to, body){
  if(!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN){
    return console.log('TWILIO not configured; sms to', to, body)
  }
  const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  try{
    await client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to })
  }catch(e){ console.warn('sendSms failed', e.message) }
}

module.exports = { sendEmail, sendSms, initSendGrid }