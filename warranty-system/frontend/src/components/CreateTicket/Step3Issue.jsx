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

export default function Step3Issue({ data, onUpdate }) {
  const [issueType, setIssueType] = useState(data.issue_type || '')
  const [description, setDescription] = useState(data.description || '')
  const [accessories, setAccessories] = useState(data.accessories || [])
  const [newAccessory, setNewAccessory] = useState('')
  const [notes, setNotes] = useState(data.notes || '')

  const handleIssueSelect = (presetId) => {
    setIssueType(presetId)
    const preset = ISSUE_PRESETS.find(p => p.id === presetId)
    if (preset && !description) {
      setDescription(`${preset.label}: `)
    }
    onUpdate({ issue_type: presetId })
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
        <label className="block text-xs font-medium mb-2" style={{ color: '#6B7280' }}>
          Loại sự cố <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ISSUE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleIssueSelect(preset.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
              style={{
                borderColor: issueType === preset.id ? '#2563EB' : '#E5E7EB',
                backgroundColor: issueType === preset.id ? '#EEF4FF' : '#FFFFFF',
                color: issueType === preset.id ? '#1D4ED8' : '#374151',
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
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
          Mô tả chi tiết vấn đề <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={e => handleDescriptionChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
          placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
        />
        <div className="text-right text-xs mt-1" style={{ color: '#9CA3AF' }}>
          {description.length} / 500 ký tự
        </div>
      </div>

      {/* Accessories */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
          Phụ kiện kèm theo
        </label>
        
        {/* Existing accessories */}
        {accessories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {accessories.map((acc, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
              >
                {acc}
                <button
                  onClick={() => removeAccessory(index)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  style={{ color: '#6B7280' }}
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
            style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
            placeholder="VD: Sạc, tai nghe, hộp..."
          />
          <button
            onClick={addAccessory}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ backgroundColor: '#2563EB' }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Internal Notes */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
          Ghi chú nội bộ <span className="font-normal">(không hiển thị với khách)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
          placeholder="Ghi chú cho kỹ thuật viên..."
        />
      </div>

      {/* Validation hint */}
      {!issueType || !description.trim() ? (
        <div 
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}
        >
          <span>⚠️</span>
          <span>Vui lòng chọn loại sự cố và mô tả chi tiết vấn đề</span>
        </div>
      ) : null}
    </div>
  )
}
