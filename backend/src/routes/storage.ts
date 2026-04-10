import { Router, Response } from 'express'
import multer from 'multer'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB

const BUCKET = process.env.STORAGE_BUCKET ?? 'uploads'

// POST /storage/upload — upload a file
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const userId = req.user!.id
    const ext = req.file.originalname.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    res.status(201).json({ path, url: urlData.publicUrl })
  }
)

// DELETE /storage/:path — delete a file
router.delete('/*filePath', requireAuth, async (req: AuthRequest, res: Response) => {
  const filePath = (req.params as Record<string, string>)['filePath']
  const userId = req.user!.id

  // Users can only delete their own files
  if (!String(filePath).startsWith(userId + '/')) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([String(filePath)])

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ message: 'File deleted' })
})

// GET /storage/list — list user's files
router.get('/list', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const files = data.map((file) => ({
    name: file.name,
    path: `${userId}/${file.name}`,
    size: file.metadata?.size,
    created_at: file.created_at,
    url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
  }))

  res.json(files)
})

export default router
