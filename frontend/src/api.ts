const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type WorkbenchRow = {
  id: number;
  workbench_date: string;
  direction_code: string;
  direction_name: string;
  airport_code: string;
  linked_order_ids: number[];
  temperature_mode: string;
  cargo_profile: string;
  box_type_summary: string | null;
  client_name?: string | null;
  places_count: number;
  weight_total: number;
  volume_total: number;
  awb_id: number | null;
  awb_number: string | null;
  planned_flight_id: number | null;
  planned_flight_number: string | null;
  booking_status: string;
  handover_status: string;
  execution_status: string;
  operator_comment: string | null;
  color_tag: string | null;
  custom_sort_order: number;
  owner_user_id: number | null;
  is_outside_final_manifest: boolean;
};

export interface AuditLogRecord {
  id: number;
  user_id: number;
  action_type: string;
  target_resource: string;
  target_id?: string;
  old_values_json?: any;
  new_values_json?: any;
  created_at: string;
}

export interface AwbBlankRange {
  id: number;
  airline_id: number;
  start_number: number;
  end_number: number;
  current_number: number;
  is_active: boolean;
}

export interface AirlineDetails {
  id: number;
  carrier_code: string;
  name: string;
  awb_prefix: string;
  ranges: AwbBlankRange[];
}

export interface SupplyChainRule {
  id: number;
  airport_code: string;
  carrier_code: string;
  cargo_profile?: string;
  temperature_mode?: string;
}

export type Flight = {
  id: number;
  flight_number: string;
  carrier_code: string;
  airport_departure: string;
  airport_arrival: string;
  etd: string;
  eta: string | null;
  status_api: string | null;
  status_internal: string | null;
  source_type: string;
};

export async function fetchFlights(): Promise<Flight[]> {
  const response = await fetch(`${API_BASE_URL}/flights`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load flights: ${response.status}`);
  }
  return response.json();
}

export type WorkbenchFilters = {
  workbench_date?: string;
  workbench_date_from?: string;
  workbench_date_to?: string;
  airport_code?: string;
  direction_code?: string;
  temperature_mode?: string;
  booking_status?: string;
  handover_status?: string;
  execution_status?: string;
  color_tag?: string;
  has_awb?: boolean;
  has_flight?: boolean;
  is_outside_final_manifest?: boolean;
  search?: string;
};

export type AirportDirectoryItem = {
  code: string;
  name: string;
};

export type UserViewProfile = {
  id: number;
  user_id: number;
  profile_name: string;
  visible_columns_json: string[];
  column_order_json: string[];
  saved_filters_json: Record<string, unknown>;
  color_rules_json: Record<string, unknown>;
  grouping_rules_json: Record<string, unknown>;
  is_default: boolean;
};

export type ChangeLogItem = {
  id: number;
  entity_type: string;
  entity_id: number;
  action_type: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  reason_code: string | null;
  comment: string | null;
  user_id: number | null;
  created_at: string;
};

export type AuthUser = {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  role: string;
  user: AuthUser;
};

export type UserRecord = AuthUser;

export type UserCreatePayload = {
  username: string;
  full_name: string;
  email?: string | null;
  role: string;
  password: string;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserUpdatePayload = Partial<UserCreatePayload>;

export type SettingsSummaryStat = {
  label: string;
  value: string;
  note: string;
};

export type SettingsSectionItem = {
  title: string;
  description: string;
};

export type SettingsSection = {
  key: string;
  title: string;
  subtitle: string;
  accent: "blue" | "green" | "gold" | "purple";
  tags: string[];
  items: SettingsSectionItem[];
  actions: string[];
};

export type SettingsSummary = {
  hero_stats: SettingsSummaryStat[];
  sections: SettingsSection[];
  operational_notes: string[];
  side_metrics: { label: string; value: string }[];
};

export type OverviewStat = {
  label: string;
  value: string;
  note: string;
};

export type OverviewStage = {
  label: string;
  value: string;
  subtitle: string;
  accent: string;
};

export type OverviewAlert = {
  title: string;
  description: string;
  severity: "success" | "info" | "warning" | "critical";
};

export type OverviewSnapshot = {
  direction_code: string;
  direction_name: string;
  airport_code: string;
  temperature_mode: string;
  booking_status: string;
  handover_status: string;
  execution_status: string;
  awb_number: string | null;
  planned_flight_number: string | null;
  places_count: number;
  weight_total: number;
};

export type OverviewSummary = {
  hero_stats: OverviewStat[];
  pipeline: OverviewStage[];
  alerts: OverviewAlert[];
  snapshots: OverviewSnapshot[];
  operational_notes: string[];
};

function getAuthToken() {
  return localStorage.getItem("biocard_access_token") ?? "";
}

function authHeaders() {
  const token = getAuthToken();
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>);
}

export async function fetchWorkbenchRows(filters: WorkbenchFilters): Promise<WorkbenchRow[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const response = await fetch(`${API_BASE_URL}/workbench?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load workbench rows: ${response.status}`);
  }
  return response.json();
}

export async function downloadWorkbenchRowsCsv(filters: WorkbenchFilters): Promise<Blob> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const response = await fetch(`${API_BASE_URL}/workbench/export?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to export workbench rows: ${response.status}`);
  }
  return response.blob();
}

export async function seedWorkbench(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/workbench/seed`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Failed to seed workbench: ${response.status}`);
  }
}

export async function fetchAirports(search?: string): Promise<AirportDirectoryItem[]> {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/directories/airports${query ? `?${query}` : ""}`);
  if (!response.ok) {
    throw new Error(`Failed to load airports: ${response.status}`);
  }
  return response.json();
}

export async function assignAwb(rowId: number, payload: Record<string, unknown>): Promise<WorkbenchRow> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}/assign-awb`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to assign AWB: ${response.status}`);
  }
  return response.json();
}

export async function assignFlight(rowId: number, payload: Record<string, unknown>): Promise<WorkbenchRow> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}/assign-flight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to assign flight: ${response.status}`);
  }
  return response.json();
}

export async function splitRow(rowId: number, payload: Record<string, unknown>): Promise<WorkbenchRow[]> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to split row: ${response.status}`);
  }
  return response.json();
}

export async function mergeRows(payload: Record<string, unknown>): Promise<WorkbenchRow> {
  const response = await fetch(`${API_BASE_URL}/workbench/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to merge rows: ${response.status}`);
  }
  return response.json();
}

export async function fixPlan(payload: Record<string, unknown>): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/workbench/fix-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to fix plan: ${response.status}`);
  }
  return response.json();
}

export async function autoPlan(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/workbench/auto-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to auto-plan: ${response.status}`);
  }
  return response.json();
}

export async function deleteWorkbenchRow(rowId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to delete row: ${response.status}`);
  }
}

export async function updateWorkbenchRow(rowId: number, payload: Record<string, unknown>): Promise<WorkbenchRow> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to update row: ${response.status}`);
  }
  return response.json();
}

export async function createManualOrder(payload: Record<string, unknown>): Promise<WorkbenchRow> {
  const response = await fetch(`${API_BASE_URL}/workbench/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to create manual order: ${response.status}`);
  }
  return response.json();
}

export async function importWorkbenchCsv(file: File): Promise<{ status: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE_URL}/workbench/import-csv`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to import CSV: ${response.status}`);
  }
  return response.json();
}

export async function fetchViewProfiles(userId = 1): Promise<UserViewProfile[]> {
  const response = await fetch(`${API_BASE_URL}/view-profiles?user_id=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to load view profiles: ${response.status}`);
  }
  return response.json();
}

export async function createViewProfile(payload: Record<string, unknown>): Promise<UserViewProfile> {
  const response = await fetch(`${API_BASE_URL}/view-profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to save view profile: ${response.status}`);
  }
  return response.json();
}

export async function updateViewProfile(profileId: number, payload: Record<string, unknown>): Promise<UserViewProfile> {
  const response = await fetch(`${API_BASE_URL}/view-profiles/${profileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to update view profile: ${response.status}`);
  }
  return response.json();
}

export async function fetchWorkbenchChanges(rowId: number): Promise<ChangeLogItem[]> {
  const response = await fetch(`${API_BASE_URL}/workbench/${rowId}/changes`);
  if (!response.ok) {
    throw new Error(`Failed to load change log: ${response.status}`);
  }
  return response.json();
}

export async function fetchSettingsSummary(): Promise<SettingsSummary> {
  const response = await fetch(`${API_BASE_URL}/settings/summary`);
  if (!response.ok) {
    throw new Error(`Failed to load settings summary: ${response.status}`);
  }
  return response.json();
}

export async function fetchOverviewSummary(): Promise<OverviewSummary> {
  const response = await fetch(`${API_BASE_URL}/overview/summary`);
  if (!response.ok) {
    throw new Error(`Failed to load overview summary: ${response.status}`);
  }
  return response.json();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to login: ${response.status}`);
  }
  return response.json();
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load current user: ${response.status}`);
  }
  return response.json();
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load users: ${response.status}`);
  }
  return response.json();
}

export async function createUser(payload: UserCreatePayload): Promise<UserRecord> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to create user: ${response.status}`);
  }
  return response.json();
}

export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<UserRecord> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to update user: ${response.status}`);
  }
  return response.json();
}

export async function deleteUser(userId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to delete user: ${response.status}`);
  }
}

// --- Rules & Catalogues ---

export async function getAirlines(): Promise<AirlineDetails[]> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/airlines`);
  if (!response.ok) throw new Error("Failed to fetch airlines");
  return response.json();
}

export async function createAirline(data: Partial<AirlineDetails>): Promise<AirlineDetails> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/airlines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function createAwbRange(airlineId: number, data: Partial<AwbBlankRange>): Promise<AwbBlankRange> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/airlines/${airlineId}/ranges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function getSupplyChains(): Promise<SupplyChainRule[]> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/supply-chains`);
  if (!response.ok) throw new Error("Failed to fetch supply chains");
  return response.json();
}

export async function createSupplyChainRule(data: Partial<SupplyChainRule>): Promise<SupplyChainRule> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/supply-chains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function deleteSupplyChainRule(ruleId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/planning-rules/supply-chains/${ruleId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await response.text());
}
