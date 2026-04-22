import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function LandingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#004976' }}>Opentomy</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {session ? (
            <>
              <Link href="/quizzes" style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}>
                My Library
              </Link>
              <Link href="/quizzes" style={primaryBtn}>
                Go to Library →
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}>
                Sign In
              </Link>
              <Link href="/register" style={primaryBtn}>
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', background: 'linear-gradient(180deg,#f0f7ff 0%,#fff 100%)' }}>
        <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', padding: '4px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          USMLE Step 1, 2 & 3
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.15, maxWidth: 760, margin: '0 auto 20px', color: '#0f172a' }}>
          Best-in-Class <span style={{ color: '#004976' }}>.tomy Reader</span> for USMLE Mastery
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Securely encrypted question banks. Instant access. USMLE-style interface you already know.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {session ? (
            <Link href="/quizzes" style={primaryBtn}>Browse My .tomy Files →</Link>
          ) : (
            <>
              <Link href="/register" style={primaryBtn}>Get Started Free</Link>
              <Link href="/login" style={outlineBtn}>Sign In</Link>
            </>
          )}
        </div>
      </section>

      {/* Social proof */}
      <section style={{ background: '#f8fafc', padding: '48px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          Trusted by students from
        </p>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          {['Oxford', 'Harvard', 'Stanford', 'Johns Hopkins', 'Yale'].map(u => (
            <span key={u} style={{ fontSize: 15, fontWeight: 700, color: '#64748b', opacity: 0.7 }}>{u}</span>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 48 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {[
            { step: '01', icon: '📁', title: 'Get a .tomy File', desc: 'Access encrypted question banks distributed by your institution or publisher.' },
            { step: '02', icon: '🔓', title: 'Open Instantly', desc: 'No installation. Decrypt in your browser using your secure session key.' },
            { step: '03', icon: '🧠', title: 'Study Smarter', desc: 'USMLE-style interface with tutor mode, timed blocks, and instant explanations.' },
          ].map(item => (
            <div key={item.step} style={{ padding: 32, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>STEP {item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#004976', color: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 48 }}>Everything You Need to Pass</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '⏱', title: 'Timed Blocks', desc: 'Simulate exam conditions with block timers' },
              { icon: '📖', title: 'Tutor Mode', desc: 'Immediate feedback after each answer' },
              { icon: '🔖', title: 'Mark & Review', desc: 'Flag questions to revisit before submitting' },
              { icon: '❌', title: 'Cross-Out', desc: 'Eliminate answer choices to narrow down' },
              { icon: '🔒', title: 'Lock Screen', desc: 'Prevent accidental answer changes' },
              { icon: '🌙', title: 'Night Mode', desc: 'Reverse-color display for late-night sessions' },
            ].map(f => (
              <div key={f.title} style={{ padding: '24px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 48 }}>Wall of Love</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { name: 'Sarah K.', school: 'Harvard Medical', text: 'Opentomy made Step 1 prep so much cleaner. The tutor mode explanations are excellent.' },
            { name: 'James L.', school: 'Stanford Med', text: 'Finally a USMLE-style reader that works perfectly in browser. No installs, just study.' },
            { name: 'Priya M.', school: 'Johns Hopkins', text: 'The encrypted format means my question bank stays mine. Love the timed block feature.' },
          ].map(t => (
            <div key={t.name} style={{ padding: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, textAlign: 'left' }}>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.school}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#f8fafc', padding: '72px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { q: 'What is a .tomy file?', a: 'A .tomy (or .optmy) file is an AES-256 encrypted container for quiz question banks. Only the Opentomy platform can decrypt and read them.' },
              { q: 'Is my data secure?', a: 'Yes. Decryption happens entirely in your browser using WebCrypto. The unencrypted content never leaves your device or touches our servers.' },
              { q: 'What exam formats are supported?', a: 'USMLE Step 1, Step 2 CK, Step 3, and any custom exam built with the Opentomy question bank builder.' },
              { q: 'Can I use Opentomy offline?', a: 'You need an internet connection to authenticate and download the file. Once loaded, you can answer questions offline.' },
              { q: 'How is the subscription priced?', a: 'Opentomy offers a free trial. After that, PRO access includes unlimited question bank reading and advanced analytics.' },
              { q: 'Can I share my .tomy files?', a: 'The files are encrypted to your account. Sharing the raw file without your session credentials will not allow decryption.' },
            ].map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 16 }}>Opentomy</div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>USMLE-style encrypted question bank reader.</p>
          </div>
          {[
            { title: 'Features', links: ['Tutor Mode', 'Timed Blocks', 'Night Mode', 'Question Navigator'] },
            { title: 'Support', links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12, fontSize: 14 }}>{col.title}</div>
              {col.links.map(l => (
                <div key={l} style={{ fontSize: 13, marginBottom: 8, opacity: 0.7 }}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 900, margin: '32px auto 0', borderTop: '1px solid #1e293b', paddingTop: 24, fontSize: 12, textAlign: 'center' }}>
          © {new Date().getFullYear()} Opentomy. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  // Static render for SSR — client interactivity would need 'use client'
  return (
    <details style={{ borderTop: '1px solid #e2e8f0', padding: '16px 0' }}>
      <summary style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {question}
        <span style={{ fontSize: 20, color: '#94a3b8', flexShrink: 0, marginLeft: 16 }}>+</span>
      </summary>
      <p style={{ marginTop: 12, fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{answer}</p>
    </details>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '12px 28px',
  background: '#004976',
  color: '#fff',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
  display: 'inline-block',
}

const outlineBtn: React.CSSProperties = {
  padding: '12px 28px',
  background: '#fff',
  color: '#004976',
  border: '2px solid #004976',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
  display: 'inline-block',
}
