'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Check, Loader2, Upload, FileText, Download } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

const h = () => ({ 'x-admin-secret': SECRET, 'Content-Type': 'application/json' })

interface Produto {
  id: string
  nome: string
  descricao: string
  preco_cents: number
  capa_url: string | null
  arquivo_url: string | null
  tipo: string
  ativo: boolean
  ordem: number
}

const emptyForm = {
  nome: '', descricao: '', tipo: 'pdf',
  preco_cents: 0, capa_url: '', arquivo_url: '', ordem: 0,
}

export default function AdminLojaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduto, setEditProduto] = useState<Produto | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const pdfRef = useRef<HTMLInputElement>(null)
  const capaRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/loja/admin/produtos`, { headers: h() })
      const data = await res.json()
      setProdutos(data.produtos ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditProduto(null)
    setForm(emptyForm)
    setPdfFile(null)
    setCapaFile(null)
    setShowModal(true)
  }

  function openEdit(p: Produto) {
    setEditProduto(p)
    setForm({
      nome: p.nome, descricao: p.descricao, tipo: p.tipo,
      preco_cents: p.preco_cents, capa_url: p.capa_url ?? '',
      arquivo_url: p.arquivo_url ?? '', ordem: p.ordem,
    })
    setPdfFile(null)
    setCapaFile(null)
    setShowModal(true)
  }

  async function uploadFile(file: File, tipo: 'pdf' | 'capa'): Promise<string> {
    const urlRes = await fetch(`${API}/loja/admin/upload-url`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ filename: file.name, tipo }),
    })
    if (!urlRes.ok) throw new Error('Erro ao obter URL de upload')
    const { signedUrl, path } = await urlRes.json()

    const up = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!up.ok) throw new Error('Erro ao enviar ficheiro')

    // Return Supabase public URL
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'produtos-pdf'
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  }

  async function guardar() {
    setSaving(true)
    setUploading(false)
    try {
      const payload = { ...form }

      if (pdfFile || capaFile) setUploading(true)

      if (pdfFile) {
        payload.arquivo_url = await uploadFile(pdfFile, 'pdf')
      }
      if (capaFile) {
        payload.capa_url = await uploadFile(capaFile, 'capa')
      }

      setUploading(false)

      if (editProduto) {
        await fetch(`${API}/loja/admin/produto/${editProduto.id}`, {
          method: 'PATCH',
          headers: h(),
          body: JSON.stringify(payload),
        })
      } else {
        await fetch(`${API}/loja/admin/produto`, {
          method: 'POST',
          headers: h(),
          body: JSON.stringify(payload),
        })
      }

      setShowModal(false)
      await load()
    } catch (e) {
      alert((e as Error).message)
    }
    setSaving(false)
    setUploading(false)
  }

  async function gerarLinkTeste(produtoId: string) {
    const email = prompt('Email para receber o link de teste:')
    if (!email) return
    const r = await fetch(`${API}/loja/admin/pedido-teste`, {
      method: 'POST', headers: h(),
      body: JSON.stringify({ produto_id: produtoId, email }),
    })
    const d = await r.json()
    if (d.download_url) {
      const copiado = confirm(`Link gerado:\n\n${d.download_url}\n\nClicar OK para copiar.`)
      if (copiado) navigator.clipboard.writeText(d.download_url)
    } else {
      alert(d.error ?? 'Erro ao gerar link')
    }
  }

  async function toggleAtivo(p: Produto) {
    await fetch(`${API}/loja/admin/produto/${p.id}`, {
      method: 'PATCH',
      headers: h(),
      body: JSON.stringify({ ativo: !p.ativo }),
    })
    setProdutos(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function confirmarDelete() {
    if (!deleteId) return
    await fetch(`${API}/loja/admin/produto/${deleteId}`, { method: 'DELETE', headers: h() })
    setProdutos(prev => prev.filter(p => p.id !== deleteId))
    setDeleteId(null)
  }

  const ativos = produtos.filter(p => p.ativo).length

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loja digital</h1>
          <p className="text-sm text-gray-400 mt-1">{produtos.length} produtos · {ativos} activos</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total produtos',    value: produtos.length },
          { label: 'Activos',           value: ativos },
          { label: 'Com ficheiro PDF',  value: produtos.filter(p => p.arquivo_url).length },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              {['Produto', 'Preço', 'PDF', 'Estado', 'Acções'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {produtos.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhum produto ainda. Crie o primeiro!</td></tr>
            )}
            {produtos.map(p => (
              <tr key={p.id} className={`transition-colors ${p.ativo ? 'hover:bg-cream-200/40' : 'bg-gray-50 opacity-60'}`}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-800">{p.nome}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{p.descricao}</p>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-800">
                  {(p.preco_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="px-5 py-3.5">
                  {p.arquivo_url
                    ? <span className="inline-flex items-center gap-1 text-xs text-sage-600"><FileText className="h-3.5 w-3.5" />PDF</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={p.ativo ? 'sage' : 'cream'}>{p.ativo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} title="Editar"
                      className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => gerarLinkTeste(p.id)} title="Gerar link de teste"
                      className="p-1.5 rounded-lg hover:bg-sage-50 text-gray-400 hover:text-sage-600 transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                    <button onClick={() => toggleAtivo(p)} title={p.ativo ? 'Desactivar' : 'Activar'}
                      className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                      {p.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setDeleteId(p.id)} title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar produto</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acção é irreversível. O produto será removido permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <button onClick={confirmarDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editProduto ? 'Editar produto' : 'Novo produto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Nome" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="Ex: Guia de Regulação Emocional" />
              <Field label="Descrição" value={form.descricao} onChange={v => setForm(f => ({ ...f, descricao: v }))} placeholder="Breve descrição do produto" textarea />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Preço (€)</label>
                  <input
                    type="number" min={0} step={0.01}
                    value={form.preco_cents ? form.preco_cents / 100 : ''}
                    onChange={e => setForm(f => ({ ...f, preco_cents: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ordem</label>
                  <input
                    type="number" min={0}
                    value={form.ordem}
                    onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ficheiro PDF</label>
                <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => pdfRef.current?.click()}
                  className="w-full h-12 border-2 border-dashed border-cream-400 rounded-xl text-sm text-gray-500 hover:border-sage-400 hover:text-sage-600 transition-colors flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  {pdfFile ? pdfFile.name : (form.arquivo_url ? '📄 PDF já carregado — clique para substituir' : 'Carregar PDF')}
                </button>
              </div>

              {/* Cover image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Imagem de capa (opcional)</label>
                <input ref={capaRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setCapaFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => capaRef.current?.click()}
                  className="w-full h-12 border-2 border-dashed border-cream-400 rounded-xl text-sm text-gray-500 hover:border-sage-400 hover:text-sage-600 transition-colors flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  {capaFile ? capaFile.name : (form.capa_url ? '🖼️ Capa já carregada — clique para substituir' : 'Carregar imagem de capa')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-cream-200">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar}
                disabled={saving || !form.nome.trim() || form.preco_cents <= 0}
                className="gap-2 min-w-[120px]">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> A enviar…</>
                  : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</>
                  : saving ? '' : editProduto ? <><Check className="h-4 w-4" /> Guardar</> : <><Plus className="h-4 w-4" /> Criar produto</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
      )}
    </div>
  )
}
