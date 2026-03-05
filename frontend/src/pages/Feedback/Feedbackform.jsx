import { useEffect, useState } from 'react'
import { authApi } from '../../api/axiosInstance'
import './Feedbackform.css'

const STEPS = ['Your Info', 'Details', 'Thoughts']
const ROLES = ['Admin', 'Manufacturer', 'Transporter', 'Dealer', 'Retail Shop']
const CATEGORIES = [
  'General Experience',
  'Dashboard & Analytics',
  'Shipment Tracking',
  'Blockchain & Verification',
  'Inventory Management',
  'AI Forecasting',
  'Performance & Speed',
  'Bug Report',
]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_TO_API = {
  Admin: 'admin',
  Manufacturer: 'manufacturer',
  Transporter: 'transporter',
  Dealer: 'dealer',
  'Retail Shop': 'retail_shop',
}

export default function FeedbackForm({ initialData = null, onSubmitted }) {
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConf] = useState('')
  const [role, setRole] = useState('')
  const [err1, setErr1] = useState('')

  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [rating, setRating] = useState(0)
  const [file, setFile] = useState(null)
  const [err2, setErr2] = useState('')

  const [message, setMessage] = useState('')
  const [improvements, setImprovements] = useState('')
  const [err3, setErr3] = useState('')

  const progressPct = done ? 100 : step === 1 ? 0 : step === 2 ? 50 : 100

  useEffect(() => {
    if (!initialData) return
    const nextName = String(initialData.name || '').trim()
    const nextEmail = String(initialData.email || '').trim()
    const nextRole = String(initialData.role || '').trim()
    if (nextName) setName(nextName)
    if (nextEmail) {
      setEmail(nextEmail)
      setEmailConf(nextEmail)
    }
    if (nextRole) setRole(nextRole)
  }, [initialData])

  function validateStep1() {
    setErr1('')
    if (!name.trim()) {
      setErr1('Please enter your full name.')
      return false
    }
    if (!EMAIL_RE.test(email)) {
      setErr1('Please enter a valid email address.')
      return false
    }
    if (email !== emailConfirm) {
      setErr1('Emails do not match. Please check and try again.')
      return false
    }
    if (!role) {
      setErr1('Please select your role.')
      return false
    }
    return true
  }

  function validateStep2() {
    setErr2('')
    if (!category) {
      setErr2('Please select a feedback category.')
      return false
    }
    if (!priority) {
      setErr2('Please select a priority level.')
      return false
    }
    if (!rating) {
      setErr2('Please give a star rating before continuing.')
      return false
    }
    return true
  }

  function validateStep3() {
    setErr3('')
    if (!message.trim()) {
      setErr3('Please share your feedback before submitting.')
      return false
    }
    return true
  }

  function goNext(from) {
    const ok = from === 1 ? validateStep1() : from === 2 ? validateStep2() : true
    if (ok) setStep(from + 1)
  }

  function goBack(from) {
    setStep(from - 1)
  }

  function handleFile(event) {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      event.target.value = ''
      return
    }
    setFile(selected)
  }

  function handleDrop(event) {
    event.preventDefault()
    event.currentTarget.classList.remove('dragover')
    const dropped = event.dataTransfer.files?.[0]
    if (!dropped) return
    if (dropped.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      return
    }
    setFile(dropped)
  }

  async function submitForm() {
    if (!validateStep3()) return
    setLoading(true)
    setErr3('')
    try {
      await authApi.submitFeedback({
        name: name.trim(),
        email: email.trim(),
        role: ROLE_TO_API[role] || 'dealer',
        category,
        priority,
        rating,
        message: message.trim(),
        improvements: improvements.trim(),
        source: initialData?.source || 'feedback_form',
      })

      setDone(true)
      if (typeof onSubmitted === 'function') {
        setTimeout(() => onSubmitted(), 1000)
      }
    } catch (error) {
      setErr3(error?.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setStep(1)
    setDone(false)
    setLoading(false)
    setName('')
    setEmail('')
    setEmailConf('')
    setRole('')
    setErr1('')
    setCategory('')
    setPriority('')
    setRating(0)
    setFile(null)
    setErr2('')
    setMessage('')
    setImprovements('')
    setErr3('')
  }

  const cClass = (remaining, warnAt = 60, overAt = 20) =>
    `fb-char-counter${remaining <= overAt ? ' over' : remaining <= warnAt ? ' warn' : ''}`

  return (
    <div className="fb-scene">
      <div className="fb-orb fb-orb-1" />
      <div className="fb-orb fb-orb-2" />

      <div className="fb-wrap">
        <div className="fb-header">
          <div className="fb-badge">
            <span className="fb-badge-dot" />
            Global Supply Chain - Feedback
          </div>
          <h1 className="fb-title">
            Share Your <span className="fb-title-accent">Experience</span>
          </h1>
          <p className="fb-subtitle">
            Help us improve the platform. After submit, you will be redirected to homepage.
          </p>
        </div>

        <div className="fb-progress">
          <div className="fb-steps-track">
            <div className="fb-track-bg" />
            <div className="fb-track-fill" style={{ width: `${progressPct}%` }} />
            {STEPS.map((_, index) => {
              const number = index + 1
              const isDone = done || number < step
              const isActive = !done && number === step
              return (
                <div key={number} className={`fb-step-dot${isDone ? ' done' : isActive ? ' active' : ''}`}>
                  {isDone ? 'OK' : number}
                </div>
              )
            })}
          </div>
          <div className="fb-step-labels">
            {STEPS.map((label, index) => (
              <span key={label} className={`fb-step-lbl${index + 1 === step && !done ? ' active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="fb-card">
          {done && (
            <div className="fb-success">
              <div className="fb-success-icon">*</div>
              <div className="fb-success-title">Feedback Received</div>
              <p className="fb-success-msg">
                Thank you, {name.trim().split(' ')[0] || 'User'}. Redirecting to homepage.
              </p>
              <span className="fb-success-tag">Submitted Successfully</span>
              <button type="button" className="fb-btn-reset" onClick={resetForm} style={{ marginTop: 8 }}>
                Submit Another Response
              </button>
            </div>
          )}

          {!done && step === 1 && (
            <>
              <div className="fb-section-label">Your Info</div>
              <div className="fb-row2">
                <div className="fb-field">
                  <label className="fb-label">Full Name <span className="fb-label-req">*</span></label>
                  <input
                    type="text"
                    className={`fb-input${err1 && !name.trim() ? ' err' : ''}`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="fb-field">
                  <label className="fb-label">Role <span className="fb-label-req">*</span></label>
                  <select className={`fb-select${err1 && !role ? ' err' : ''}`} value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="">Select role</option>
                    {ROLES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">Email <span className="fb-label-req">*</span></label>
                <input
                  type="email"
                  className={`fb-input${err1 && !EMAIL_RE.test(email) ? ' err' : ''}`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="fb-field">
                <label className="fb-label">Confirm Email <span className="fb-label-req">*</span></label>
                <input
                  type="email"
                  className={`fb-input${err1 && email !== emailConfirm ? ' err' : ''}`}
                  value={emailConfirm}
                  onChange={(event) => setEmailConf(event.target.value)}
                />
              </div>

              {err1 && <div className="fb-error-msg">{err1}</div>}
              <div className="fb-nav-row">
                <button type="button" className="fb-btn-next" onClick={() => goNext(1)}>Continue</button>
              </div>
            </>
          )}

          {!done && step === 2 && (
            <>
              <div className="fb-section-label">Feedback Details</div>
              <div className="fb-row2">
                <div className="fb-field">
                  <label className="fb-label">Category <span className="fb-label-req">*</span></label>
                  <select className={`fb-select${err2 && !category ? ' err' : ''}`} value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Priority <span className="fb-label-req">*</span></label>
                  <div className="fb-priority-row">
                    {['Low', 'Medium', 'High'].map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={`fb-pri-btn${priority === item ? ' sel' : ''}`}
                        onClick={() => setPriority(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">Overall Rating <span className="fb-label-req">*</span></label>
                <div className="fb-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`fb-star${star <= rating ? ' on' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      *
                    </button>
                  ))}
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Screenshot <span className="fb-label-opt">(optional - max 5MB)</span>
                </label>
                {!file ? (
                  <div
                    className="fb-upload-zone"
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.currentTarget.classList.add('dragover')
                    }}
                    onDragLeave={(event) => event.currentTarget.classList.remove('dragover')}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*,.pdf" onChange={handleFile} />
                    <div className="fb-upload-txt">
                      Drag and drop or <span>browse</span> to upload
                    </div>
                  </div>
                ) : (
                  <div className="fb-file-preview">
                    <span className="fb-file-name">{file.name}</span>
                    <button type="button" className="fb-remove-file" onClick={() => setFile(null)}>X</button>
                  </div>
                )}
              </div>

              {err2 && <div className="fb-error-msg">{err2}</div>}
              <div className="fb-nav-row">
                <button type="button" className="fb-btn-back" onClick={() => goBack(2)}>Back</button>
                <button type="button" className="fb-btn-next" onClick={() => goNext(2)}>Continue</button>
              </div>
            </>
          )}

          {!done && step === 3 && (
            <>
              <div className="fb-section-label">Your Thoughts</div>
              <div className="fb-field">
                <label className="fb-label">Feedback and Comments <span className="fb-label-req">*</span></label>
                <div className="fb-char-wrap">
                  <textarea
                    className={`fb-textarea${err3 && !message.trim() ? ' err' : ''}`}
                    maxLength={500}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <span className={cClass(500 - message.length)}>{500 - message.length}</span>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Suggested Improvements <span className="fb-label-opt">(optional)</span>
                </label>
                <div className="fb-char-wrap">
                  <textarea
                    className="fb-textarea"
                    maxLength={300}
                    style={{ minHeight: 80 }}
                    value={improvements}
                    onChange={(event) => setImprovements(event.target.value)}
                  />
                  <span className={cClass(300 - improvements.length, 50, 15)}>{300 - improvements.length}</span>
                </div>
              </div>

              {err3 && <div className="fb-error-msg">{err3}</div>}
              <div className="fb-nav-row">
                <button type="button" className="fb-btn-back" onClick={() => goBack(3)}>Back</button>
                <button type="button" className="fb-btn-submit" onClick={submitForm} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>

              <hr className="fb-divider" />
              <button type="button" className="fb-btn-reset" onClick={resetForm}>
                Clear and Reset Form
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
