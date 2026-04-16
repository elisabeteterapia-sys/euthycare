'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2 } from 'lucide-react'

const API          = process.env.NEXT_PUBLIC_API_URL    ?? 'http://localhost:3001'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

interface Post {
  id: string
  titulo: string
  slug: string
  categoria: string
  autor: string
  resumo: string
  conteudo: string
  tempo_leitura: string
  publicado: boolean
  criado_em: string
}

const emptyForm = { titulo: '', categoria: 'Bem-estar', autor: '', resumo: '', conteudo: '', tempo_leitura: '5 min' }

export default function AdminBlogPage() {
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editPost, setEditPost]   = useState<Post | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [erro, setErro]           = useState('')

  const h = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }

  function loadPosts() {
    setLoading(true)
    fetch(`${API}/blog/admin`, { headers: h })
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setErro('Erro ao carregar posts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPosts() }, [])

  function openNew()        { setEditPost(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(p: Post) {
    setEditPost(p)
    setForm({ titulo: p.titulo, categoria: p.categoria, autor: p.autor, resumo: p.resumo, conteudo: p.conteudo, tempo_leitura: p.tempo_leitura })
    setShowModal(true)
  }

  async function save() {
    if (!form.titulo.trim()) return
    setSaving(true)
    const method = editPost ? 'PATCH' : 'POST'
    const url    = editPost ? `${API}/blog/admin/${editPost.id}` : `${API}/blog/admin`
    const r = await fetch(url, { method, headers: h, body: JSON.stringify(form) })
    const d = await r.json()
    setSaving(false)
    if (!r.ok) { alert(d.error ?? 'Erro ao guardar'); return }
    setShowModal(false)
    loadPosts()
  }

  async function togglePublicado(p: Post) {
    await fetch(`${API}/blog/admin/${p.id}`, {
      method: 'PATCH', headers: h,
      body: JSON.stringify({ publicado: !p.publicado }),
    })
    loadPosts()
  }

  async function deletePost(id: string) {
    await fetch(`${API}/blog/admin/${id}`, { method: 'DELETE', headers: h })
    setDeleteId(null)
    loadPosts()
  }

  const publicados = posts.filter(p => p.publicado).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-400 mt-1">{posts.length} artigos · {publicados} publicados</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo artigo
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total artigos', value: posts.length },
          { label: 'Publicados',   value: publicados },
          { label: 'Rascunhos',    value: posts.length - publicados },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…</div>}
      {erro    && <p className="text-red-500 text-sm">{erro}</p>}

      {!loading && (
        <Card className="p-0 overflow-hidden">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Sem artigos. Crie o primeiro!</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 bg-cream-200/50">
                  {['Título', 'Categoria', 'Autor', 'Data', 'Estado', 'Acções'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-cream-200/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800 max-w-xs truncate">{p.titulo}</td>
                    <td className="px-5 py-3.5"><Badge variant="lilac" className="text-xs">{p.categoria}</Badge></td>
                    <td className="px-5 py-3.5 text-gray-500">{p.autor || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{new Date(p.criado_em).toLocaleDateString('pt-PT')}</td>
                    <td className="px-5 py-3.5"><Badge variant={p.publicado ? 'sage' : 'cream'}>{p.publicado ? 'Publicado' : 'Rascunho'}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => togglePublicado(p)} title={p.publicado ? 'Despublicar' : 'Publicar'} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                          {p.publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-300">
              <h3 className="text-lg font-semibold text-gray-900">{editPost ? 'Editar artigo' : 'Novo artigo'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Título', key: 'titulo', placeholder: 'Título do artigo' },
                { label: 'Autor',  key: 'autor',  placeholder: 'Nome do autor' },
                { label: 'Tempo de leitura', key: 'tempo_leitura', placeholder: '5 min' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input value={(form as Record<string,string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400">
                  {['Bem-estar', 'Terapia', 'Saúde', 'Mindfulness', 'Ansiedade', 'Relações', 'Carreira', 'Clínica', 'Jurídico', 'Gestão', 'Infância', 'TCC', 'Geral'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Resumo</label>
                <textarea value={form.resumo} onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))} rows={2} placeholder="Breve descrição do artigo"
                  className="w-full px-3 py-2 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conteúdo</label>
                <textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={8} placeholder="Texto do artigo (suporta parágrafos separados por linha em branco)"
                  className="w-full px-3 py-2 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-y" />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-cream-300">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={save} disabled={!form.titulo.trim() || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editPost ? 'Guardar' : 'Criar rascunho'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar artigo</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acção é irreversível.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <button onClick={() => deletePost(deleteId)} className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
