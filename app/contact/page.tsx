'use client'

import { useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import LordIcon from '@/components/LordIcon'
import { Globe, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Replace with your form handler (Formspree, EmailJS, etc.)
    // await fetch('https://formspree.io/f/YOUR_ID', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(form),
    // })
    setSent(true)
  }

  return (
    <div className="pt-28 pb-24 max-w-6xl mx-auto px-6">
      <SectionHeader eyebrow="Get in touch" title="Contact Us" />

      <div className="mt-16 grid md:grid-cols-2 gap-16">
        {/* Info */}
        <div className="space-y-8">
          <p className="text-muted leading-relaxed text-[15px]">
            Have questions about membership, events, or partnerships? Reach out
            and a PSITS-UA officer will get back to you.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: <Mail size={16} className="text-gold" />,
                label: 'Email',
                value: 'psitsua@ua.edu.ph',
              },
              {
                icon: <Globe size={16} className="text-gold" />,
                label: 'Facebook',
                value: 'facebook.com/psitsua',
              },
              {
                icon: <MapPin size={16} className="text-gold" />,
                label: 'Location',
                value: 'University of Antique, San Jose, Antique',
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="mt-0.5">{icon}</div>
                <div>
                  <p className="text-xs text-muted mb-0.5">{label}</p>
                  <p className="text-white text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface border border-white/5 rounded-lg p-8">
          {sent ? (
            <div className="text-center py-8 flex flex-col items-center justify-center">
              <LordIcon
                src="https://cdn.lordicon.com/lupuorrc.json"
                trigger="loop"
                colors={{ primary: '#F5A623', secondary: '#1B2A6B' }}
                size={60}
                className="mb-4"
              />
              <p className="text-gold font-display font-bold text-xl mb-2">
                Message sent!
              </p>
              <p className="text-muted text-sm">
                We&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                {
                  id: 'name',
                  label: 'Your name',
                  type: 'text',
                  placeholder: 'Juan dela Cruz',
                },
                {
                  id: 'email',
                  label: 'Email address',
                  type: 'email',
                  placeholder: 'juan@ua.edu.ph',
                },
              ].map(({ id, label, type, placeholder }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    className="block text-xs text-muted mb-2"
                  >
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    required
                    placeholder={placeholder}
                    value={form[id as 'name' | 'email']}
                    onChange={(e) =>
                      setForm({ ...form, [id]: e.target.value })
                    }
                    className="w-full bg-base border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs text-muted mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="What's on your mind?"
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full bg-base border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#F5A623] via-[#FFBF52] to-[#E09010] text-[#0B0F17] font-bold py-3.5 rounded-xl shadow-[0_0_25px_rgba(245,166,35,0.35)] hover:shadow-[0_0_40px_rgba(245,166,35,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-sm tracking-wide cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
