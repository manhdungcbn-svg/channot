// ============================================
// CREATE TICKET MODAL - FULL WORKFLOW
// Step 3: Issue Description + Accessories
// ============================================

import { useState } from 'react'

// Icons
const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// Issue type presets
const ISSUE_PRESETS = [
  { id: 'not_working', label: 'Không hoạt động', icon: '⚡' },
  { id: 'error_code', label: 'Báo lỗi', icon: '🔴' },
  { id: 'performance', label: 'Hoạt động kém', icon: '🐢' },
  { id: 'physical_damage', label: 'Hư hỏng vật lý', icon: '💥' },
  { id: 'accessory', label: 'Lỗi phụ kiện', icon: '🔌' },
  { id: 'other', label: 'Khác', icon: '❓' },
]

export default function Step3Issue({ data, onUpdate, isCustomer = false }) {
  const [issueType, setIssueType] = useState(data.issue_type || '')
  const [description, setDescription] = useState(data.description || '')
  const [accessories, setAccessories] = useState(data.accessories || [])
  const [newAccessory, setNewAccessory] = useState('')
  const [notes, setNotes] = useState(data.notes || '')

  const handleIssueSelect = (presetId) => {
    setIssueType(presetId)
    const preset = ISSUE_PRESETS.find(p => p.id === presetId)
    let nextDescription = description
    if (preset && !description) {
      nextDescription = `${preset.label}: `
      setDescription(nextDescription)
    }
    // Phải gửi cả description lên parent, nếu không `data.description` vẫn rỗng
    // và bước 3 sẽ chặn không cho sang bước 4.
    onUpdate({ issue_type: presetId, description: nextDescription })
  }

  const handleDescriptionChange = (val) => {
    setDescription(val)
    onUpdate({ description: val })
  }

  const handleNotesChange = (val) => {
    setNotes(val)
    onUpdate({ notes: val })
  }

  const addAccessory = () => {
    if (!newAccessory.trim()) return
    const updated = [...accessories, newAccessory.trim()]
    setAccessories(updated)
    setNewAccessory('')
    onUpdate({ accessories: updated })
  }

  const removeAccessory = (index) => {
    const updated = accessories.filter((_, i) => i !== index)
    setAccessories(updated)
    onUpdate({ accessories: updated })
  }

  return (
    <div className="space-y-5">
      {/* Issue Type Selection */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Loại sự cố <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ISSUE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleIssueSelect(preset.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
              style={{
                borderColor: issueType === preset.id ? 'var(--brand-600)' : 'var(--border)',
                backgroundColor: issueType === preset.id ? 'var(--brand-50)' : 'var(--bg-card)',
                color: issueType === preset.id ? 'var(--info-text)' : 'var(--text-secondary)',
              }}
            >
              <span>{preset.icon}</span>
              <span className="text-xs">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Mô tả chi tiết vấn đề <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={e => handleDescriptionChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
        />
        <div className="text-right text-xs mt-1" style={{ color: 'var(--text-light)' }}>
          {description.length} / 500 ký tự
        </div>
      </div>

      {/* Accessories */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Phụ kiện kèm theo
        </label>
        
        {/* Existing accessories */}
        {accessories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {accessories.map((acc, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                {acc}
                <button
                  onClick={() => removeAccessory(index)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--border-strong)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <XIcon />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Add accessory input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAccessory}
            onChange={e => setNewAccessory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            placeholder="VD: Sạc, tai nghe, hộp..."
          />
          <button
            onClick={addAccessory}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ backgroundColor: 'var(--brand-600)' }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Internal Notes — chỉ nhân viên mới thấy (khách không nhìn thấy) */}
      {!isCustomer && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Ghi chú nội bộ <span className="font-normal">(không hiển thị với khách)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
            placeholder="Ghi chú cho kỹ thuật viên..."
          />
        </div>
      )}

      {/* Validation hint */}
      {!issueType || !description.trim() ? (
        <div 
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-bg)' }}
        >
          <span>⚠️</span>
          <span>Vui lòng chọn loại sự cố và mô tả chi tiết vấn đề</span>
        </div>
      ) : null}
    </div>
  )
}
