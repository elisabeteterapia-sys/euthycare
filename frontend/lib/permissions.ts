// ─── Frontend plan permission helpers ─────────────────────────
// Mirrors backend lib/plans.ts so the UI can gate features
// without an extra API call for simple flag checks.

export type PlanId = 'essencial' | 'profissional' | 'premium' | 'clinica' | 'enterprise'
export type PlanTipo = 'terapeuta' | 'clinica' | 'enterprise'
export type IaNivel = 'nenhuma' | 'basica' | 'completa'
export type BackupTipo = 'nenhum' | 'parcial' | 'completo'

export interface PlanInfo {
  id: PlanId
  nome: string
  tipo: PlanTipo
  limite_terapeutas: number
  ia_nivel: IaNivel
  tem_backup: boolean
  tipo_backup: BackupTipo
  exportacao_total: boolean
  download_cliente: boolean
  contato_comercial: boolean
  preco_mensal_eur: number
  preco_anual_eur: number
  desconto_anual_pct: number
  features: string[]
}

export interface PlanPermissions {
  canAccessIA: boolean
  canUseFullIA: boolean
  canUseBackup: boolean
  hasFullBackup: boolean
  canExportAll: boolean
  canDownloadPerClient: boolean
  maxTherapists: number
  isEnterprise: boolean
  isClinica: boolean
  needsCommercialContact: boolean
}

// ── Static plan definitions (mirrors DB seeds) ────────────────
// Used for UI rendering without API call. Prices are displayed
// dynamically via API — this is for feature gates only.

export const PLAN_DEFINITIONS: Record<PlanId, PlanInfo> = {
  essencial: {
    id: 'essencial',
    nome: 'Essencial',
    tipo: 'terapeuta',
    limite_terapeutas: 1,
    ia_nivel: 'nenhuma',
    tem_backup: false,
    tipo_backup: 'nenhum',
    exportacao_total: false,
    download_cliente: true,
    contato_comercial: false,
    preco_mensal_eur: 19,
    preco_anual_eur: 190,
    desconto_anual_pct: 17,
    features: [
      '1 terapeuta',
      'Cadastro de pacientes',
      'Agenda e calendário',
      'Registo de sessões',
      'Cobrança de consultas',
      'Download por paciente',
    ],
  },
  profissional: {
    id: 'profissional',
    nome: 'Profissional',
    tipo: 'terapeuta',
    limite_terapeutas: 1,
    ia_nivel: 'basica',
    tem_backup: true,
    tipo_backup: 'parcial',
    exportacao_total: false,
    download_cliente: true,
    contato_comercial: false,
    preco_mensal_eur: 39,
    preco_anual_eur: 390,
    desconto_anual_pct: 17,
    features: [
      '1 terapeuta',
      'Tudo do Essencial',
      'IA básica (sugestões e resumos)',
      'Backup parcial mensal',
      'Exportação parcial de dados',
    ],
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    tipo: 'terapeuta',
    limite_terapeutas: 1,
    ia_nivel: 'completa',
    tem_backup: true,
    tipo_backup: 'completo',
    exportacao_total: true,
    download_cliente: true,
    contato_comercial: false,
    preco_mensal_eur: 69,
    preco_anual_eur: 690,
    desconto_anual_pct: 17,
    features: [
      '1 terapeuta',
      'Tudo do Profissional',
      'IA completa (análise, relatórios)',
      'Backup completo diário',
      'Exportação total de dados',
      'Relatórios avançados',
    ],
  },
  clinica: {
    id: 'clinica',
    nome: 'Clínica',
    tipo: 'clinica',
    limite_terapeutas: 10,
    ia_nivel: 'completa',
    tem_backup: true,
    tipo_backup: 'completo',
    exportacao_total: true,
    download_cliente: true,
    contato_comercial: false,
    preco_mensal_eur: 149,
    preco_anual_eur: 1490,
    desconto_anual_pct: 17,
    features: [
      'Até 10 terapeutas',
      'Gestão de equipa',
      'Dashboard clínico',
      'Permissões por terapeuta',
      'IA completa para todos',
      'Backup completo + exportação total',
      'Métricas clínicas e financeiras',
    ],
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    tipo: 'enterprise',
    limite_terapeutas: 999,
    ia_nivel: 'completa',
    tem_backup: true,
    tipo_backup: 'completo',
    exportacao_total: true,
    download_cliente: true,
    contato_comercial: true,
    preco_mensal_eur: 0,
    preco_anual_eur: 0,
    desconto_anual_pct: 0,
    features: [
      'Terapeutas ilimitados',
      'Tudo do Clínica',
      'SLA garantido',
      'Onboarding dedicado',
      'Suporte premium 24/7',
    ],
  },
}

// ── Permission resolver ────────────────────────────────────────

export function getPlanPermissions(planId: string): PlanPermissions {
  const plan = PLAN_DEFINITIONS[planId as PlanId] ?? PLAN_DEFINITIONS.essencial

  return {
    canAccessIA:            plan.ia_nivel !== 'nenhuma',
    canUseFullIA:           plan.ia_nivel === 'completa',
    canUseBackup:           plan.tem_backup,
    hasFullBackup:          plan.tipo_backup === 'completo',
    canExportAll:           plan.exportacao_total,
    canDownloadPerClient:   plan.download_cliente,
    maxTherapists:          plan.limite_terapeutas,
    isEnterprise:           plan.tipo === 'enterprise',
    isClinica:              plan.tipo === 'clinica' || plan.tipo === 'enterprise',
    needsCommercialContact: plan.contato_comercial,
  }
}

/** Returns a user-facing label for the IA level */
export function iaNivelLabel(nivel: IaNivel): string {
  return { nenhuma: 'Sem IA', basica: 'IA Básica', completa: 'IA Completa' }[nivel]
}

/** Returns a user-facing label for backup type */
export function backupTipoLabel(tipo: BackupTipo): string {
  return { nenhum: 'Sem backup', parcial: 'Backup parcial', completo: 'Backup completo' }[tipo]
}

/** Checks if upgrading a specific feature requires a higher plan */
export function requiredPlanForFeature(feature: keyof PlanPermissions): PlanId {
  const map: Record<keyof PlanPermissions, PlanId> = {
    canAccessIA:            'profissional',
    canUseFullIA:           'premium',
    canUseBackup:           'profissional',
    hasFullBackup:          'premium',
    canExportAll:           'premium',
    canDownloadPerClient:   'essencial',
    maxTherapists:          'clinica',
    isEnterprise:           'enterprise',
    isClinica:              'clinica',
    needsCommercialContact: 'enterprise',
  }
  return map[feature]
}
