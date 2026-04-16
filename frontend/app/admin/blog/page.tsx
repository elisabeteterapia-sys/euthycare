'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Eye, X } from 'lucide-react'

interface Post {
  id: string
  titulo: string
  categoria: string
  autor: string
  data: string
  publicado: boolean
}

const postsIniciais: Post[] = []

const emptyForm = { titulo: '', categoria: 'Bem-estar', autor: '' }

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>(postsIniciais)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function togglePublicado(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, publicado: !p.publicado } : p))
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    setDeleteId(null)
  }

  function addPost() {
    if (!form.titulo.trim()) return
    const novo: Post = {
      id: String(Date.now()),
      ...form,
      data: new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }),
      publicado: false,
    }
    setPosts(prev => [novo, ...prev])
    setForm(emptyForm)
    setShowModal(false)
  }

  const publicados = posts.filter(p => p.publicado).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-400 mt-1">{posts.length} artigos · {publicados} publicados</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
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

      <Card className="p-0 overflow-hidden">
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
                <td className="px-5 py-3.5">
                  <Badge variant="lilac" className="text-xs">{p.categoria}</Badge>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{p.autor}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.data}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={p.publicado ? 'sage' : 'cream'}>{p.publicado ? 'Publicado' : 'Rascunho'}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublicado(p.id)}
                      title={p.publicado ? 'Despublicar' : 'Publicar'}
                      className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {p.publicado ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar artigo</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acção é irreversível.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <button
                onClick={() => deletePost(deleteId)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Novo artigo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Título do artigo"
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  {['Bem-estar', 'Terapia', 'Saúde', 'Mindfulness', 'Ansiedade', 'Relações'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Autor</label>
                <input
                  value={form.autor}
                  onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={addPost} disabled={!form.titulo.trim()}>
                Criar rascunho
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
