const Twilio = require('twilio')

async function transcribeRecording(recordingUrl){
  // Best-effort transcription using Twilio Transcriptions if available
  if(!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null
  const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  // Attempt to find recording SID in URL (Twilio recording URLs often contain the SID)
  const m = recordingUrl && recordingUrl.match(/([A-Za-z0-9_-]{34,})/)
  if(!m) return null
  const sid = m[1]

  try{
    const transcriptions = await client.recordings(sid).transcriptions.list({limit: 20})
    if(transcriptions && transcriptions.length) return transcriptions[0].transcriptionText || null
  }catch(e){ console.warn('transcription failed', e.message) }
  return null
}

module.exports = { transcribeRecording }