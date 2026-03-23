import React from 'react'
import { Heart, Facebook, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer(){
  const hospitalName = localStorage.getItem('hospital_name') || 'AI Hospital Receptionist'
  const hospitalLogo = localStorage.getItem('hospital_logo') || null
  const missionStatement = localStorage.getItem('hospital_mission') || 'Providing compassionate and professional healthcare services with advanced technology integration.'
  const visionStatement = localStorage.getItem('hospital_vision') || 'To be a leading healthcare institution delivering excellence in patient care through innovation and dedication.'
  const primaryColor = localStorage.getItem('primary_color') || '#0ea5a4'

  return (
    <footer className="bg-gradient-medical text-white mt-12">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Hospital Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {hospitalLogo ? (
                <img src={hospitalLogo} alt="Hospital" className="h-10 w-10 rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                  <Heart className="w-5 h-5" style={{color: primaryColor}} />
                </div>
              )}
              <h3 className="text-lg font-bold">{hospitalName}</h3>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">
              Delivering excellence in healthcare with innovative technology and compassionate service.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-5" style={{backgroundColor: '#10b981'}}></span>
              Our Mission
            </h4>
            <p className="text-sm text-slate-100 leading-relaxed">{missionStatement}</p>
          </div>

          {/* Vision */}
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-5" style={{backgroundColor: '#10b981'}}></span>
              Our Vision
            </h4>
            <p className="text-sm text-slate-100 leading-relaxed">{visionStatement}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/appointments" className="text-slate-200 hover:text-white transition-colors">Appointments</a></li>
              <li><a href="/profile" className="text-slate-200 hover:text-white transition-colors">Profile</a></li>
              <li><a href="/ambulance" className="text-slate-200 hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="text-slate-200 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-slate-200 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} {hospitalName}. All rights reserved.</p>
            <p className="mt-1 text-xs text-slate-300">
              Built by <span className="font-bold text-white">Northernknights</span> • Advancing Healthcare Technology
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-slate-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-slate-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="text-slate-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
              <Mail className="w-4 h-4" />
            </a>
          </div>

          {/* Brand */}
          <div className="text-xs text-slate-300 text-center md:text-right">
            <p>Powered by <span className="font-bold text-white">Northernknights</span></p>
            <p className="mt-1">Premium Healthcare Solutions</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
