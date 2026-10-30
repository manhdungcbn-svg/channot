import { useRef, useState } from 'react'
import { authService } from '../../services/services'

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export default function AvatarUpload({ user, onUserUpdate }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(user?.avatar_url || null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh (JPG, PNG, GIF)')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('File quá nặng. Vui lòng chọn ảnh dưới 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result)
    reader.readAsDataURL(file)

    setError('')
    setUploading(true)

    try {
      const result = await authService.uploadAvatar(file)
      onUserUpdate({ ...user, avatar_url: result.avatar_url })
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload ảnh thất bại')
      setPreview(user?.avatar_url || null)
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center p-6 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
        <div className="relative">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: '#1A3A6B' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ background: '#2563EB' }}
          >
            {uploading ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : <CameraIcon />}
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>Nhấn icon máy ảnh để đổi ảnh</p>
        <p className="text-xs" style={{ color: '#D1D5DB' }}>JPG, PNG, GIF • Tối đa 2MB</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}

      {preview && preview !== user?.avatar_url && (
        <button
          onClick={() => setPreview(user?.avatar_url || null)}
          className="w-full py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#F1F5F9', color: '#64748B' }}>
          Hủy thay đổi
        </button>
      )}
    </div>
  )
}