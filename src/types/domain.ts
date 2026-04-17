export type UserRole = "superadmin" | "coordenador" | "diretor";

export type MetaCategoria = "medico" | "enfermeiro" | "odonto";

export type PerformanceStatus = "regular" | "suficiente" | "bom" | "otimo";

export type ThresholdConfig = {
  limite_regular: number;
  limite_suficiente: number;
  limite_bom: number;
  limite_otimo: number;
};

export type UbsRecord = {
  id: string;
  nome: string;
  endereco: string;
  contato: string | null;
};

export type PerfilRecord = {
  id: string;
  nome_completo: string;
  role: UserRole;
  ubs_id: string | null;
};

export type ProfileWithUbs = PerfilRecord & {
  ubs: UbsRecord | null;
};

export type GlobalSettingsRecord = {
  id: number;
  nome_sistema: string;
  logo_url: string | null;
};

export type GoalConfigRecord = {
  id: string;
  ubs_id: string;
  categoria: MetaCategoria;
} & ThresholdConfig;

export type ProductionRecord = {
  id: string;
  ubs_id: string;
  criado_por: string;
  data: string;
  medico: number;
  enfermeiro: number;
  odonto: number;
  receitas: number;
  notificacoes: number;
  nutri: number;
  psico: number;
  faltas: number;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProductionFormInput = {
  data: string;
  medico: number;
  enfermeiro: number;
  odonto: number;
  receitas: number;
  notificacoes: number;
  nutri: number;
  psico: number;
  faltas: number;
  observacao?: string;
};

export type GaugeData = {
  categoria: MetaCategoria;
  label: string;
  total: number;
  status: PerformanceStatus;
  maxValue: number;
  progress: number;
  thresholds: ThresholdConfig;
  color: string;
  summary: string;
};

export type DirectorDashboardData = {
  profile: ProfileWithUbs;
  settings: GlobalSettingsRecord;
  competencia: {
    month: number;
    year: number;
    label: string;
  };
  gauges: GaugeData[];
  todayRecord: ProductionRecord | null;
  isWeekend: boolean;
};

export type PendingUnitRow = {
  ubsId: string;
  nome: string;
  contato: string | null;
  submittedToday: boolean;
};

export type UbsPerformanceCard = {
  ubsId: string;
  nome: string;
  gauges: GaugeData[];
  pendingToday: boolean;
  latestObservation: string | null;
  monthLabel: string;
};

export type CoordinatorDashboardData = {
  settings: GlobalSettingsRecord;
  competencia: {
    month: number;
    year: number;
    label: string;
  };
  pendingUnits: PendingUnitRow[];
  cards: UbsPerformanceCard[];
  ubsOptions: UbsRecord[];
  goalConfigs: GoalConfigRecord[];
};

export type AdminUserRow = {
  id: string;
  email: string;
  nome_completo: string;
  role: UserRole;
  ubs_id: string | null;
  ubs_nome: string | null;
  last_sign_in_at: string | null;
};

export type AdminPanelData = {
  currentUserId: string;
  settings: GlobalSettingsRecord;
  users: AdminUserRow[];
  ubsOptions: UbsRecord[];
};

export type ActionResult<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  issues?: string[];
};
