import { useRef } from 'react'

export default function useSpeech(){
  const recognitionRef = useRef(null)

  const speak = (text) => {
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(text)
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    } else console.warn('TTS not supported')
  }

  const startRecognition = (onResult)=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SpeechRecognition) return console.warn('SpeechRecognition not supported')
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.lang = 'en-US'
    recognitionRef.current.onresult = (e)=> onResult(e.results[0][0].transcript)
    recognitionRef.current.start()
  }

  const stopRecognition = ()=> recognitionRef.current?.stop()

  return { speak, startRecognition, stopRecognition }
}
