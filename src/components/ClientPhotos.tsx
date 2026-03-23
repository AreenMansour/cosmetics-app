'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Photo {
  id: string
  client_id: string
  type: 'before' | 'after'
  url: string
  file_path: string
  note: string
  created_at: string
}

interface Props {
  clientId: string
}

export default function ClientPhotos({ clientId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('client_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
  }, [supabase, clientId])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${clientId}/${type}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath)

      await supabase.from('client_photos').insert({
        client_id: clientId,
        type,
        url: publicUrl,
        file_path: filePath,
      })

      fetchPhotos()
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (file) {
      uploadPhoto(file, type)
      e.target.value = ''
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('למחוק תמונה זו?')) return
    await supabase.storage.from('client-photos').remove([photo.file_path])
    await supabase.from('client_photos').delete().eq('id', photo.id)
    fetchPhotos()
  }

  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
        תמונות לפני / אחרי
      </h3>

      {uploading && (
        <div className="text-center py-2 text-sm" style={{ color: 'var(--color-primary)' }}>
          ...מעלה תמונה
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Before photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>לפני</span>
            <button
              onClick={() => beforeInputRef.current?.click()}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors duration-200"
              style={{ background: 'var(--color-primary)', color: 'white' }}
              disabled={uploading}
            >
              + העלאה
            </button>
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'before')}
            />
          </div>
          <div className="space-y-2">
            {beforePhotos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--color-border-light)' }}>
                <Image
                  src={photo.url}
                  alt="לפני"
                  width={300}
                  height={300}
                  className="w-full h-auto object-cover cursor-pointer"
                  onClick={() => setViewPhoto(photo)}
                />
                <button
                  onClick={() => handleDelete(photo)}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer transition-opacity duration-200"
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                >×</button>
                <div className="text-xs p-1 text-center" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                  {new Date(photo.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
            {beforePhotos.length === 0 && (
              <div
                className="rounded-lg p-6 text-center cursor-pointer transition-colors duration-200"
                style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
                onClick={() => beforeInputRef.current?.click()}
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">לחצי להעלאה</div>
              </div>
            )}
          </div>
        </div>

        {/* After photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>אחרי</span>
            <button
              onClick={() => afterInputRef.current?.click()}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors duration-200"
              style={{ background: 'var(--color-primary)', color: 'white' }}
              disabled={uploading}
            >
              + העלאה
            </button>
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'after')}
            />
          </div>
          <div className="space-y-2">
            {afterPhotos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--color-border-light)' }}>
                <Image
                  src={photo.url}
                  alt="אחרי"
                  width={300}
                  height={300}
                  className="w-full h-auto object-cover cursor-pointer"
                  onClick={() => setViewPhoto(photo)}
                />
                <button
                  onClick={() => handleDelete(photo)}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer transition-opacity duration-200"
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                >×</button>
                <div className="text-xs p-1 text-center" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                  {new Date(photo.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
            {afterPhotos.length === 0 && (
              <div
                className="rounded-lg p-6 text-center cursor-pointer transition-colors duration-200"
                style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
                onClick={() => afterInputRef.current?.click()}
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">לחצי להעלאה</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {viewPhoto && (
        <div className="modal-overlay" onClick={() => setViewPhoto(null)}>
          <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-lg cursor-pointer z-10"
              style={{ background: 'white', color: 'var(--color-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >×</button>
            <Image
              src={viewPhoto.url}
              alt={viewPhoto.type === 'before' ? 'לפני' : 'אחרי'}
              width={800}
              height={800}
              className="rounded-xl w-full h-auto object-contain"
              style={{ maxHeight: '85vh' }}
            />
            <div className="text-center mt-2 text-sm" style={{ color: 'white' }}>
              {viewPhoto.type === 'before' ? 'לפני' : 'אחרי'} - {new Date(viewPhoto.created_at).toLocaleDateString('he-IL')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
