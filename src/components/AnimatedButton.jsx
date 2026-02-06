import React from 'react'

export default function AnimatedButton({children, ...props}){
  return (
    <button {...props} className={`inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-white hover:scale-105 transition-transform ${props.className || ''}`}>
      {children}
    </button>
  )
}
