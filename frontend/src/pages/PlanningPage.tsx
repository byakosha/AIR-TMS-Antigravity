import { useEffect, useMemo, useState } from "react";
import type { Key } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Badge,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
  Upload,
} from "antd";
import type { DefaultOptionType } from "antd/es/select";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { CopyOutlined, DragOutlined, PlusOutlined, RobotOutlined, FileTextOutlined, UploadOutlined } from "@ant-design/icons";

import {

  assignAwb,
  assignFlight,
  autoPlan,
  createViewProfile,
  deleteWorkbenchRow,
  downloadWorkbenchRowsCsv,
  fetchAirports,
  fetchFlights,
  fetchViewProfiles,
  fetchWorkbenchChanges,
  fetchWorkbenchRows,
  fixPlan,
  mergeRows,
  seedWorkbench,
  splitRow,
  createManualOrder,
  updateWorkbenchRow,
  importWorkbenchCsv,
  updateViewProfile,
  type Flight,
  type ChangeLogItem,
  type UserViewProfile,
  type WorkbenchFilters,
  type WorkbenchRow,
} from "../api";

const { RangePicker } = DatePicker;

type ViewMode = "kanban" | "table";
type TableColumnKey =
  | "direction_code"
  | "airport_code"
  | "linked_order_ids"
  | "temperature_mode"
  | "cargo_profile"
  | "box_type_summary"
  | "places_count"
  | "weight_total"
  | "volume_total"
  | "awb_number"
  | "planned_flight_number"
  | "booking_status"
  | "handover_status"
  | "execution_status"
  | "color_tag";

type SplitFormValues = { split_places_count: number; awb_number?: string; planned_flight_number?: string; color_tag?: string; operator_comment?: string };
type AssignAwbFormValues = { awb_number: string; route_from?: string; route_to?: string; temperature_mode?: string; comments?: string };
type AssignFlightFormValues = { flight_number: string; carrier_code: string; airport_departure: string; airport_arrival: string; etd: string; eta?: string };
type CreateOrderFormValues = { direction_code: string; airport_code: string; places_count: number; weight_total: number; volume_total: number; temperature_mode: string; box_type_summary?: string };
type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

const defaultVisibleColumns: TableColumnKey[] = [
  "direction_code","airport_code","linked_order_ids","temperature_mode","cargo_profile","box_type_summary","places_count","weight_total","volume_total","awb_number","planned_flight_number","booking_status","handover_status","execution_status","color_tag",
];
const tableColumnOptions = [
  ["direction_code","Направление"],["airport_code","Аэропорт"],["linked_order_ids","Заказы"],["temperature_mode","Температура"],["cargo_profile","Груз"],["box_type_summary","Тара"],["places_count","Места"],["weight_total","Вес"],["volume_total","Объем"],["awb_number","AWB"],["planned_flight_number","Рейс"],["booking_status","Бронь"],["handover_status","Сдача"],["execution_status","Вылет"],["color_tag","Цвет"],
].map(([value,label]) => ({ value: value as TableColumnKey, label }));
const statusColor: Record<string, string> = { pending: "gold", draft: "default", confirmed: "green", partial: "orange", fixed: "blue", handed_over_partial: "orange", handed_over_full: "green", not_handed_over: "default", flown_partial: "orange", flown_full: "green", not_flown: "red", postponed: "volcano" };

import { StatusTag, bookingLabels, executionLabels, handoverLabels } from "../uiUtils";
import { useAuth } from "../auth/AuthContext";
import { PlanningFilterModal } from "../components/planning/PlanningFilterModal";
import { PlanningQueueList } from "../components/planning/PlanningQueueList";
import { PlanningAwbGrid, AwbGroup } from "../components/planning/PlanningAwbGrid";
import { PlanningDetailCard } from "../components/planning/PlanningDetailCard";

const temperatureOptions = [
  { value: "+2..+8", label: "+2..+8 °C" },
  { value: "+8", label: "+8 °C" },
  { value: "+15", label: "+15 °C" },
  { value: "+15..+25", label: "+15..+25 °C" },
  { value: "+25", label: "+25 °C" },
  { value: "-20", label: "-20 °C" },
  { value: "-70", label: "-70 °C (сухой лед)" },
  { value: "DEEP_FREEZE", label: "Deep Freeze / сосуд Дьюара" },
  { value: "NO_TEMP_CONTROL", label: "Без контроля температуры" },
];
const options = {
  booking: ["pending","draft","confirmed","partial","fixed"],
  handover: ["not_handed_over","handed_over_partial","handed_over_full"],
  execution: ["pending","not_flown","postponed","flown_partial","flown_full"],
  color: ["blue","green","yellow","orange","red","purple","gray"],
  temperature: temperatureOptions,
};

function fmt(n: number) { return Number(n.toFixed(2)).toString(); }
function placesText(places: number, weight: number) { return `${places} мест / ${fmt(weight)} кг`; }
function temperatureLabel(value: string | null | undefined) { return temperatureOptions.find((item) => item.value === value)?.label ?? value ?? "—"; }
function optStr(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : undefined; }
function normalizeVisibleColumns(value: unknown): TableColumnKey[] { return Array.isArray(value) && value.length ? value.filter((x): x is TableColumnKey => typeof x === "string" && defaultVisibleColumns.includes(x as TableColumnKey)) : [...defaultVisibleColumns]; }
function buildFilters(values: Record<string, unknown>): WorkbenchFilters {
  const r = values.workbench_date_range as DateRangeValue | undefined;
  return {
    workbench_date: dayjs.isDayjs(values.workbench_date) ? values.workbench_date.toISOString() : undefined,
    workbench_date_from: r?.[0] ? r[0].toISOString() : undefined,
    workbench_date_to: r?.[1] ? r[1].toISOString() : undefined,
    airport_code: optStr(values.airport_code),
    direction_code: optStr(values.direction_code),
    temperature_mode: optStr(values.temperature_mode),
    booking_status: optStr(values.booking_status),
    handover_status: optStr(values.handover_status),
    execution_status: optStr(values.execution_status),
    color_tag: optStr(values.color_tag),
    has_awb: values.has_awb === true ? true : values.has_awb === false ? false : undefined,
    has_flight: values.has_flight === true ? true : values.has_flight === false ? false : undefined,
    is_outside_final_manifest: values.is_outside_final_manifest === true ? true : values.is_outside_final_manifest === false ? false : undefined,
    search: optStr(values.search),
  };
}
function filtersToFormValues(filters: WorkbenchFilters) {
  return { ...filters, workbench_date_range: filters.workbench_date_from || filters.workbench_date_to ? [filters.workbench_date_from ? dayjs(filters.workbench_date_from) : null, filters.workbench_date_to ? dayjs(filters.workbench_date_to) : null] : filters.workbench_date ? [dayjs(filters.workbench_date), dayjs(filters.workbench_date)] : undefined };
}
function groupRowsByAwb(rows: WorkbenchRow[]): AwbGroup[] {
  const map = new Map<string, WorkbenchRow[]>();
  rows.filter((r) => r.awb_number && !r.is_outside_final_manifest).forEach((row) => { const key = row.awb_number ?? "UNASSIGNED"; const bucket = map.get(key) ?? []; bucket.push(row); map.set(key, bucket); });
  return Array.from(map.entries()).map(([awbNumber, items]) => ({ awbNumber, items: items.sort((a,b) => a.custom_sort_order - b.custom_sort_order || a.id - b.id), totalPlaces: items.reduce((s,i) => s + i.places_count, 0), totalWeight: items.reduce((s,i) => s + i.weight_total, 0), totalVolume: items.reduce((s,i) => s + i.volume_total, 0), flight: items[0]?.planned_flight_number ?? null, bookingStatus: items[0]?.booking_status ?? "pending", handoverStatus: items[0]?.handover_status ?? "not_handed_over", executionStatus: items[0]?.execution_status ?? "pending" })).sort((a,b) => a.awbNumber.localeCompare(b.awbNumber));
}
function getTableColumn(key: TableColumnKey): ColumnType<WorkbenchRow> {
  switch (key) {
    case "direction_code": return { title: "Направление", dataIndex: "direction_code", key, width: 150, render: (_: unknown, row) => <Space direction="vertical" size={0}><Typography.Text strong>{row.direction_code}</Typography.Text><Typography.Text type="secondary">{row.direction_name}</Typography.Text></Space> };
    case "airport_code": return { title: "Аэропорт", dataIndex: "airport_code", key, width: 110 };
    case "linked_order_ids": return { title: "Заказы", dataIndex: "linked_order_ids", key, width: 140, render: (v: number[]) => v.join(", ") };
    case "temperature_mode": return { title: "Температура", dataIndex: "temperature_mode", key, width: 150, render: (value: string | null) => temperatureLabel(value) };
    case "cargo_profile": return { title: "Груз", dataIndex: "cargo_profile", key, width: 130 };
    case "box_type_summary": return { title: "Тара", dataIndex: "box_type_summary", key, width: 140, render: (v: string | null) => v ?? "—" };
    case "places_count": return { title: "Места", dataIndex: "places_count", key, width: 90 };
    case "weight_total": return { title: "Вес", dataIndex: "weight_total", key, width: 100, render: (v: number) => `${fmt(v)} кг` };
    case "volume_total": return { title: "Объем", dataIndex: "volume_total", key, width: 100, render: (v: number) => `${fmt(v)} м³` };
    case "awb_number": return { title: "AWB", dataIndex: "awb_number", key, width: 140, render: (v: string | null) => v ?? "—" };
    case "planned_flight_number": return { title: "Рейс", dataIndex: "planned_flight_number", key, width: 130, render: (v: string | null) => v ?? "—" };
    case "booking_status": return { title: "Бронь", dataIndex: "booking_status", key, width: 140, render: (v: string) => <StatusTag status={v} type="booking" /> };
    case "handover_status": return { title: "Сдача", dataIndex: "handover_status", key, width: 150, render: (v: string) => <StatusTag status={v} type="handover" /> };
    case "execution_status": return { title: "Вылет", dataIndex: "execution_status", key, width: 150, render: (v: string) => <StatusTag status={v} type="execution" /> };
    case "color_tag": return { title: "Цвет", dataIndex: "color_tag", key, width: 100, render: (v: string | null) => (v ? <Tag color={v}>{v}</Tag> : "—") };
  }
}

export function PlanningPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<WorkbenchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiBusy, setApiBusy] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<WorkbenchFilters>({});
  const [selectedRowIds, setSelectedRowIds] = useState<Key[]>([]);
  const [activeRow, setActiveRow] = useState<WorkbenchRow | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>([...defaultVisibleColumns]);
  const [airportOptions, setAirportOptions] = useState<DefaultOptionType[]>([]);
  const [airportLoading, setAirportLoading] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [viewProfiles, setViewProfiles] = useState<UserViewProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [changeLog, setChangeLog] = useState<ChangeLogItem[]>([]);
  const [draggedRowId, setDraggedRowId] = useState<number | null>(null);
  const [dragOverAwb, setDragOverAwb] = useState<string | null>(null);
  const [selectedAwbNumber, setSelectedAwbNumber] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [awbOpen, setAwbOpen] = useState(false);
  const [flightOpen, setFlightOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editRowOpen, setEditRowOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [splitForm] = Form.useForm<SplitFormValues>();
  const [awbForm] = Form.useForm<AssignAwbFormValues>();
  const [flightForm] = Form.useForm<AssignFlightFormValues>();
  const [createOrderForm] = Form.useForm<CreateOrderFormValues>();
  const [editRowForm] = Form.useForm<{ places_count: number; weight_total: number; volume_total: number }>();
  const [filterForm] = Form.useForm();

  const selectedRows = useMemo(() => rows.filter((row) => selectedRowIds.includes(row.id)), [rows, selectedRowIds]);
  const awbGroups = useMemo(() => groupRowsByAwb(rows), [rows]);
  const queueRows = useMemo(() => rows.filter((row) => !row.awb_number || row.is_outside_final_manifest), [rows]);
  const directionOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => { if (!map.has(row.direction_code)) map.set(row.direction_code, row.direction_name); });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label: `${value} - ${label}` }));
  }, [rows]);
  const activeAwbGroup = useMemo(() => {
    const awbNumber = selectedAwbNumber ?? activeRow?.awb_number ?? null;
    if (!awbNumber) {
      return null;
    }
    return awbGroups.find((group) => group.awbNumber === awbNumber) ?? null;
  }, [activeRow, awbGroups, selectedAwbNumber]);
  const tableColumns: ColumnsType<WorkbenchRow> = useMemo(() => visibleColumns.map((columnKey) => getTableColumn(columnKey)), [visibleColumns]);

  async function loadRows(nextFilters: WorkbenchFilters = filters) {
    setLoading(true);
    try {
      const data = await fetchWorkbenchRows(nextFilters);
      setRows(data);
      setSelectedRowIds([]);
      setActiveRow((current) => current ? data.find((item) => item.id === current.id) ?? data[0] ?? null : data[0] ?? null);
      setSelectedAwbNumber((current) => {
        if (!current) return null;
        return data.some((item) => item.awb_number === current) ? current : null;
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось загрузить манифест");
    } finally {
      setLoading(false);
    }
  }

  async function loadAirports() {
    setAirportLoading(true);
    try {
      const data = await fetchAirports();
      setAirportOptions(data.map((airport) => ({ label: `${airport.name} (${airport.code})`, value: airport.code })));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось загрузить справочник аэропортов");
    } finally {
      setAirportLoading(false);
    }
  }

  async function loadViewProfiles() {
    try {
      setViewProfiles(await fetchViewProfiles());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось загрузить представления");
    }
  }

  async function loadChangeLog(rowId: number | null) {
    if (!rowId) {
      setChangeLog([]);
      return;
    }
    try {
      setChangeLog(await fetchWorkbenchChanges(rowId));
    } catch {
      setChangeLog([]);
    }
  }

  async function loadFlights() {
    setFlightsLoading(true);
    try {
      setFlights(await fetchFlights());
    } catch {
      message.error("Не удалось загрузить справочник рейсов");
    } finally {
      setFlightsLoading(false);
    }
  }

  useEffect(() => { void loadRows({}); void loadAirports(); void loadViewProfiles(); void loadFlights(); }, []);
  useEffect(() => { void loadChangeLog(activeRow?.id ?? null); }, [activeRow?.id]);

  function handleApplyFilters(values: Record<string, unknown>) {
    const nextFilters = buildFilters(values);
    setFilters(nextFilters);
    void loadRows(nextFilters);
    setFilterModalOpen(false);
  }
  function handleResetFilters() { filterForm.resetFields(); setFilters({}); void loadRows({}); setFilterModalOpen(false); }
  function handleSelectProfile(profileId: number) {
    const profile = viewProfiles.find((item) => item.id === profileId);
    if (!profile) return;
    setSelectedProfileId(profile.id);
    setProfileName(profile.profile_name);
    setVisibleColumns(normalizeVisibleColumns(profile.visible_columns_json));
    const saved = profile.saved_filters_json as WorkbenchFilters;
    setFilters(saved ?? {});
    filterForm.setFieldsValue(filtersToFormValues(saved ?? {}));
    setViewMode(profile.grouping_rules_json?.view_mode === "table" ? "table" : "kanban");
    void loadRows(saved ?? {});
  }
  async function handleSaveProfile() {
    if (!profileName.trim()) { message.warning("Введите название представления"); return; }
    setApiBusy(true);
    try {
      const payload = { user_id: 1, profile_name: profileName.trim(), visible_columns_json: visibleColumns, column_order_json: visibleColumns, saved_filters_json: filters, color_rules_json: {}, grouping_rules_json: { view_mode: viewMode }, is_default: false };
      const saved = selectedProfileId ? await updateViewProfile(selectedProfileId, payload) : await createViewProfile(payload);
      setSelectedProfileId(saved.id);
      await loadViewProfiles();
      message.success("Представление сохранено");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось сохранить представление");
    } finally {
      setApiBusy(false);
    }
  }

  async function handleEditRow(values: { places_count: number; weight_total: number; volume_total: number }) {
    if (!activeRow) return;
    setApiBusy(true);
    try {
      await updateWorkbenchRow(activeRow.id, values);
      message.success("Параметры заказа обновлены");
      setEditRowOpen(false);
      void loadRows();
    } catch (e: any) {
      message.error(e.message || "Ошибка при обновлении параметров");
    } finally {
      setApiBusy(false);
    }
  }

  async function handleAutoPlan() {
    setApiBusy(true);
    try {
      const res = await autoPlan();
      message.success(res.message);
      await loadRows(filters);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Авто-планирование не удалось");
    } finally {
      setApiBusy(false);
    }
  }

  async function handleDownloadCsv() {
    setApiBusy(true);
    try {
      const blob = await downloadWorkbenchRowsCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workbench_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("CSV выгрузка готова");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось скачать CSV");
    } finally { setApiBusy(false); }
  }
  async function handleSeedWorkbench() {
    setApiBusy(true);
    try { await seedWorkbench(); await loadRows(filters); message.success("Демо-данные загружены"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось загрузить демо-данные"); }
    finally { setApiBusy(false); }
  }
  async function handleSplit(values: SplitFormValues) {
    if (!activeRow) { message.warning("Выберите строку для разделения"); return; }
    setApiBusy(true);
    try { await splitRow(activeRow.id, values); setSplitOpen(false); splitForm.resetFields(); await loadRows(filters); message.success("Строка разделена"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось разделить строку"); }
    finally { setApiBusy(false); }
  }
  async function handleAssignAwb(values: AssignAwbFormValues) {
    if (!activeRow) { message.warning("Выберите строку для назначения AWB"); return; }
    setApiBusy(true);
    try { await assignAwb(activeRow.id, values); setAwbOpen(false); awbForm.resetFields(); await loadRows(filters); message.success("AWB назначен"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось назначить AWB"); }
    finally { setApiBusy(false); }
  }
  async function handleAssignFlight(values: AssignFlightFormValues) {
    if (!activeRow) { message.warning("Выберите строку для назначения рейса"); return; }
    setApiBusy(true);
    try { await assignFlight(activeRow.id, { ...values, etd: dayjs(values.etd).toISOString(), eta: values.eta ? dayjs(values.eta).toISOString() : undefined }); setFlightOpen(false); flightForm.resetFields(); await loadRows(filters); message.success("Рейс назначен"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось назначить рейс"); }
    finally { setApiBusy(false); }
  }
  async function handleMerge() {
    if (selectedRows.length < 2) { message.warning("Выберите минимум две строки"); return; }
    setApiBusy(true);
    try { await mergeRows({ row_ids: selectedRows.map((row) => row.id), target_row_id: selectedRows[0].id }); setMergeOpen(false); await loadRows(filters); message.success("Строки объединены"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось объединить строки"); }
    finally { setApiBusy(false); }
  }
  async function handleFixPlan() {
    setApiBusy(true);
    try { await fixPlan({ row_ids: selectedRows.length ? selectedRows.map((row) => row.id) : undefined }); setFixOpen(false); await loadRows(filters); message.success("План зафиксирован"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Не удалось зафиксировать план"); }
    finally { setApiBusy(false); }
  }
  async function handleCreateOrder(values: CreateOrderFormValues) {
    setApiBusy(true);
    try {
      await createManualOrder(values);
      setCreateOrderOpen(false);
      createOrderForm.resetFields();
      await loadRows(filters);
      message.success("Новый заказ создан");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось создать заказ");
    } finally { setApiBusy(false); }
  }

  async function handleImportCsv(file: File) {
    setApiBusy(true);
    message.loading({ content: 'Импорт реестра...', key: 'import_csv' });
    try {
      const res = await importWorkbenchCsv(file);
      message.success({ content: res.message || "Импорт завершен", key: 'import_csv', duration: 3 });
      await loadRows(filters);
    } catch (err: any) {
      message.error({ content: err.message || "Ошибка импорта CSV", key: 'import_csv', duration: 5 });
    } finally {
      setApiBusy(false);
    }
    return false; // Prevent default upload behavior
  }

  function handleRowDragStart(row: WorkbenchRow) {
    setDraggedRowId(row.id);
  }

  function handleRowDragEnd() {
    setDraggedRowId(null);
    setDragOverAwb(null);
  }

  const handleSelectRow = (row: WorkbenchRow) => {
    setActiveRow(row);
    setSelectedAwbNumber(row.awb_number ?? null);
  };

  const handleDeleteRow = async (rowId: number) => {
    try {
      setApiBusy(true);
      await deleteWorkbenchRow(rowId);
      void loadRows(filters);
    } catch (e: any) {
      message.error({ content: e.message || "Ошибка при удалении", key: "del_order" });
    } finally {
      setApiBusy(false);
    }
  };

  async function handleDropOnAwb(groupAwbNumber: string) {
    const rowId = draggedRowId;
    if (!rowId) {
      return;
    }
    const draggedRow = rows.find((row) => row.id === rowId);
    if (!draggedRow) {
      return;
    }
    if (draggedRow.awb_number === groupAwbNumber) {
      handleRowDragEnd();
      return;
    }

    setApiBusy(true);
    try {
      await assignAwb(rowId, {
        awb_number: groupAwbNumber,
        is_manual_number: true,
        comments: `Assigned via drag-and-drop to AWB ${groupAwbNumber}`,
      });
      await loadRows(filters);
      message.success(`Строка ${rowId} назначена на AWB ${groupAwbNumber}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Не удалось назначить AWB через drag-and-drop");
    } finally {
      setApiBusy(false);
      handleRowDragEnd();
    }
  }

  const planningSummary = `${rows.length} строк · ${awbGroups.length} AWB · ${queueRows.length} без AWB`;
  const selectedStatus = activeRow?.booking_status ?? "pending";
  const activeFilterTags = [
    filters.search ? `Поиск: ${filters.search}` : null,
    filters.airport_code ? `Аэропорт: ${filters.airport_code}` : null,
    filters.direction_code ? `Направление: ${filters.direction_code}` : null,
    filters.temperature_mode ? `Температура: ${temperatureLabel(filters.temperature_mode)}` : null,
    filters.workbench_date_from || filters.workbench_date_to
      ? `Дата: ${filters.workbench_date_from ? dayjs(filters.workbench_date_from).format("DD.MM.YYYY") : "…"} - ${filters.workbench_date_to ? dayjs(filters.workbench_date_to).format("DD.MM.YYYY") : "…"}`
      : filters.workbench_date
        ? `Дата: ${dayjs(filters.workbench_date).format("DD.MM.YYYY")}`
        : null,
    filters.booking_status ? `Бронь: ${bookingLabels[filters.booking_status] ?? filters.booking_status}` : null,
    filters.handover_status ? `Сдача: ${handoverLabels[filters.handover_status] ?? filters.handover_status}` : null,
    filters.execution_status ? `Вылет: ${executionLabels[filters.execution_status] ?? filters.execution_status}` : null,
    filters.color_tag ? `Цвет: ${filters.color_tag}` : null,
    typeof filters.has_awb === "boolean" ? `AWB: ${filters.has_awb ? "да" : "нет"}` : null,
    typeof filters.has_flight === "boolean" ? `Рейс: ${filters.has_flight ? "да" : "нет"}` : null,
    typeof filters.is_outside_final_manifest === "boolean" ? `Манифест: ${filters.is_outside_final_manifest ? "вне" : "внутри"}` : null,
  ].filter((value): value is string => Boolean(value));
  return (
    <Space direction="vertical" size="large" className="planning-page" style={{ width: "100%" }}>
      <Card className="filter-panel" bordered={false}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row gutter={[16, 12]} align="middle" justify="space-between" wrap className="planning-toolbar">
            <Col flex="1 1 320px">
              <Typography.Title level={4} style={{ margin: 0 }}>Планирование (AWB)</Typography.Title>
              <Typography.Text type="secondary">{planningSummary}</Typography.Text>
            </Col>
            <Col>
              <Space wrap>
                <Button type="primary" style={{ backgroundColor: '#faad14', borderColor: '#faad14' }} onClick={handleAutoPlan} icon={<RobotOutlined />} loading={apiBusy}>
                  Авто-планирование
                </Button>
                <Button onClick={() => setFilterModalOpen(true)}>
                  Фильтры {activeFilterTags.length ? `(${activeFilterTags.length})` : ""}
                </Button>
                <Segmented value={viewMode} onChange={(value) => setViewMode(value as ViewMode)} options={[{ label: "Канбан", value: "kanban" }, { label: "Таблица (Excel)", value: "table" }]} />
                <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={() => setCreateOrderOpen(true)} icon={<PlusOutlined />}>
                  Новый заказ
                </Button>
                <Button type="primary" onClick={() => setAwbOpen(true)} disabled={!activeRow}>
                  + Новая AWB
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleDownloadCsv} loading={apiBusy}>
                  Скачать таблицу
                </Button>
                <Upload beforeUpload={handleImportCsv} showUploadList={false} accept=".csv">
                  <Button icon={<UploadOutlined />} loading={apiBusy} style={{ borderColor: '#1890ff', color: '#1890ff' }}>
                    Импорт реестра (CSV)
                  </Button>
                </Upload>
                <Button 
                  onClick={() => {
                    const csvContent = "Направление;Аэропорт;Места;Вес;Объем;Температура;Груз;Тара;Клиент\nSVO-VVO;VVO;12;125.5;1.2;+2..+8;Pharma;Термобокс 50L x12;BIOCAD";
                    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "template.csv";
                    link.click();
                  }}
                  type="link"
                >
                  Шаблон CSV
                </Button>
              </Space>
            </Col>
          </Row>


          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small" className="metric-card" bordered={false}>
                <Typography.Text type="secondary">Без AWB</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
                  {queueRows.length}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small" className="metric-card" bordered={false}>
                <Typography.Text type="secondary">AWB групп</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
                  {awbGroups.length}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small" className="metric-card" bordered={false}>
                <Typography.Text type="secondary">Выбрано строк</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
                  {selectedRows.length}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small" className="metric-card" bordered={false}>
                <Typography.Text type="secondary">С цветом</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
                  {rows.filter((row) => Boolean(row.color_tag)).length}
                </Typography.Title>
              </Card>
            </Col>
          </Row>

          <PlanningFilterModal
            open={filterModalOpen}
            onCancel={() => setFilterModalOpen(false)}
            form={filterForm}
            onApply={handleApplyFilters}
            initialValues={filtersToFormValues({})}
            airportLoading={airportLoading}
            airportOptions={airportOptions}
            directionOptions={directionOptions}
            options={options}
            bookingLabels={bookingLabels}
            handoverLabels={handoverLabels}
            executionLabels={executionLabels}
            apiBusy={apiBusy}
            onSeedWorkbench={handleSeedWorkbench}
            onResetFilters={handleResetFilters}
          />

          <Space wrap className="active-filter-strip">
            <Typography.Text className="active-filter-label">Активные фильтры:</Typography.Text>
            {activeFilterTags.length ? activeFilterTags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Tag color="green">Фильтры не заданы</Tag>}
          </Space>

          <Card size="small" className="mode-panel" bordered={false}>
            <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
              <Space wrap>
                <Typography.Text strong>Сохраненные представления</Typography.Text>
                <Select style={{ minWidth: 280 }} placeholder="Выберите view" value={selectedProfileId ?? undefined} allowClear onChange={(value) => { if (typeof value === "number") handleSelectProfile(value); else setSelectedProfileId(null); }} options={viewProfiles.map((profile) => ({ label: profile.profile_name, value: profile.id }))} />
                <Input style={{ width: 220 }} value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Название view" />
                <Button type="primary" onClick={handleSaveProfile} loading={apiBusy}>Сохранить view</Button>
              </Space>
            </Space>
          </Card>
        </Space>
      </Card>

      {loading ? (
        <Card bordered={false} className="metric-card"><Spin /></Card>
      ) : rows.length === 0 ? (
        <Card bordered={false} className="metric-card"><Empty description="Манифест пуст. Можно загрузить демо-данные или подключить 1C TMS." /></Card>
      ) : viewMode === "kanban" ? (
        <div className="planning-grid">
          <PlanningQueueList
            queueRows={queueRows}
            activeRowId={activeRow?.id}
            draggedRowId={draggedRowId}
            onSelectRow={(row) => {
              setActiveRow(row);
              setSelectedAwbNumber(row.awb_number ?? null);
            }}
            onRowDragStart={(row) => setDraggedRowId(row.id)}
            onRowDragEnd={() => setDraggedRowId(null)}
            onSplitRow={(row) => {
              setActiveRow(row);
              setSplitOpen(true);
            }}
            userRole={user?.role}
            onDeleteRow={handleDeleteRow}
          />

          <PlanningAwbGrid
            awbGroups={awbGroups}
            activeAwbGroup={activeAwbGroup}
            dragOverAwb={dragOverAwb}
            selectedAwbNumber={selectedAwbNumber}
            draggedRowId={draggedRowId}
            onSelectAwb={(awbNumber, firstRow) => {
              setSelectedAwbNumber(awbNumber);
              setActiveRow(firstRow);
            }}
            onDragOverAwb={(awbNumber) => setDragOverAwb(awbNumber)}
            onDragLeaveAwb={() => setDragOverAwb(null)}
            onDropOnAwb={(awbNumber) => void handleDropOnAwb(awbNumber)}
          />

          <PlanningDetailCard
            activeRow={activeRow}
            activeAwbGroup={activeAwbGroup}
            selectedStatus={selectedStatus}
            selectedRows={selectedRows}
            changeLog={changeLog}
            onOpenAwb={() => setAwbOpen(true)}
            onOpenSplit={() => setSplitOpen(true)}
            onOpenFlight={() => setFlightOpen(true)}
            onOpenMerge={() => setMergeOpen(true)}
            onOpenFix={() => setFixOpen(true)}
            onOpenEdit={() => {
              editRowForm.setFieldsValue({
                places_count: activeRow?.places_count,
                weight_total: activeRow?.weight_total,
                volume_total: activeRow?.volume_total,
              });
              setEditRowOpen(true);
            }}
          />
        </div>
      ) : (
        <Card title="Рабочий манифест" extra={<Space wrap><Tag color="blue">{rows.length} строк</Tag><Tag color="gold">{selectedRows.length} выбрано</Tag></Space>}>
          <Table<WorkbenchRow> className="overview-table" rowKey="id" size="middle" pagination={false} scroll={{ x: 1500 }} dataSource={rows} columns={tableColumns} rowSelection={{ selectedRowKeys: selectedRowIds, onChange: (keys, selected) => { setSelectedRowIds(keys); const next = selected.at(-1) ?? selected[0] ?? null; setActiveRow(next); if (next) setSelectedAwbNumber(next.awb_number ?? null); } }} onRow={(record) => ({ onClick: () => handleSelectRow(record) })} rowClassName={(record) => record.booking_status === 'confirmed' ? 'overview-row-confirmed' : record.booking_status === 'pending' ? 'overview-row-pending' : record.execution_status === 'flown_partial' ? 'overview-row-critical' : ''} />
        </Card>
      )}

      <Modal title="Разделить строку" open={splitOpen} onCancel={() => setSplitOpen(false)} footer={null}>
        <Form form={splitForm} layout="vertical" onFinish={handleSplit} initialValues={{ split_places_count: 1 }}>
          <Form.Item name="split_places_count" label="Количество мест для выделения" rules={[{ required: true, message: "Укажите количество мест" }]}><InputNumber min={1} max={activeRow?.places_count ?? undefined} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="awb_number" label="AWB для новой строки"><Input placeholder="Номер AWB вручную" /></Form.Item>
          <Form.Item name="planned_flight_number" label="Рейс для новой строки"><Input placeholder="Номер рейса" /></Form.Item>
          <Form.Item name="color_tag" label="Цветовая метка"><Select allowClear placeholder="Не менять" options={options.color.map((value) => ({ label: value, value }))} /></Form.Item>
          <Form.Item name="operator_comment" label="Комментарий"><Input.TextArea rows={3} /></Form.Item>
          <Space><Button onClick={() => setSplitOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit" loading={apiBusy}>Разделить</Button></Space>
        </Form>
      </Modal>

      <Modal title="Назначить AWB" open={awbOpen} onCancel={() => setAwbOpen(false)} footer={null}>
        <Form form={awbForm} layout="vertical" onFinish={handleAssignAwb}>
          <Form.Item name="awb_number" label="Номер AWB" rules={[{ required: true, message: "Укажите AWB" }]}><Input placeholder="555-12345675" /></Form.Item>
          <Form.Item name="route_from" label="Откуда"><Input placeholder="LED" /></Form.Item>
          <Form.Item name="route_to" label="Куда"><Input placeholder="SVO" /></Form.Item>
          <Form.Item name="temperature_mode" label="Температурный режим"><Select allowClear placeholder="Выберите режим" options={options.temperature} /></Form.Item>
          <Form.Item name="comments" label="Комментарий"><Input.TextArea rows={3} /></Form.Item>
          <Space><Button onClick={() => setAwbOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit" loading={apiBusy}>Сохранить</Button></Space>
        </Form>
      </Modal>

      <Modal title="Назначить рейс" open={flightOpen} onCancel={() => setFlightOpen(false)} footer={null}>
        <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 16 }}>
          <Typography.Text type="secondary">Выберите существующий рейс из расписания или введите данные вручную ниже:</Typography.Text>
          <Select
            showSearch
            allowClear
            loading={flightsLoading}
            placeholder="Поиск рейса (например, SU-1730)"
            style={{ width: "100%" }}
            filterOption={(input, option) => (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())}
            options={flights.map(f => ({ label: `${f.flight_number} (${f.airport_departure} → ${f.airport_arrival}) ETD: ${dayjs(f.etd).format("DD.MM HH:mm")}`, value: f.id }))}
            onChange={(value) => {
              const selected = flights.find(f => f.id === value);
              if (selected) {
                flightForm.setFieldsValue({
                  flight_number: selected.flight_number,
                  carrier_code: selected.carrier_code,
                  airport_departure: selected.airport_departure,
                  airport_arrival: selected.airport_arrival,
                  etd: selected.etd,
                  eta: selected.eta || undefined,
                });
              } else {
                flightForm.resetFields();
              }
            }}
          />
        </Space>
        <Form form={flightForm} layout="vertical" onFinish={handleAssignFlight}>
          <Form.Item name="flight_number" label="Номер рейса" rules={[{ required: true, message: "Укажите номер рейса" }]}><Input placeholder="SU-1730" /></Form.Item>
          <Form.Item name="carrier_code" label="Код перевозчика" rules={[{ required: true, message: "Укажите код перевозчика" }]}><Input placeholder="SU" /></Form.Item>
          <Form.Item name="airport_departure" label="Аэропорт вылета" rules={[{ required: true, message: "Укажите аэропорт вылета" }]}><Input placeholder="LED" /></Form.Item>
          <Form.Item name="airport_arrival" label="Аэропорт прилета" rules={[{ required: true, message: "Укажите аэропорт прилета" }]}><Input placeholder="SVO" /></Form.Item>
          <Form.Item name="etd" label="ETD (ISO datetime)" rules={[{ required: true, message: "Укажите ETD" }]}><Input placeholder="2026-03-19T10:00:00Z" /></Form.Item>
          <Form.Item name="eta" label="ETA (ISO datetime)"><Input placeholder="2026-03-19T14:00:00Z" /></Form.Item>
          <Space><Button onClick={() => setFlightOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit" loading={apiBusy}>Сохранить</Button></Space>
        </Form>
      </Modal>

      <Modal title="Объединить выбранные строки" open={mergeOpen} onCancel={() => setMergeOpen(false)} onOk={handleMerge} okText="Объединить" confirmLoading={apiBusy}><Typography.Paragraph>Выбрано {selectedRows.length} строк. Первая выбранная строка станет целевой.</Typography.Paragraph></Modal>
      <Modal title="Зафиксировать план" open={fixOpen} onCancel={() => setFixOpen(false)} onOk={handleFixPlan} okText="Зафиксировать" confirmLoading={apiBusy}><Typography.Paragraph>Если выбраны строки, фиксация применится к ним. Иначе будет зафиксирован текущий рабочий манифест.</Typography.Paragraph></Modal>
      
      <Modal title="Редактировать места и вес (Admin)" open={editRowOpen} onCancel={() => setEditRowOpen(false)} footer={null}>
        <Form form={editRowForm} layout="vertical" onFinish={handleEditRow}>
          <Form.Item name="places_count" label="Количество мест" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="weight_total" label="Физ. вес (кг)" rules={[{ required: true }]}><InputNumber min={0.1} step={0.1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="volume_total" label="Объем (м³)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} style={{ width: "100%" }} /></Form.Item>
          <Space><Button onClick={() => setEditRowOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit" loading={apiBusy}>Сохранить изменения</Button></Space>
        </Form>
      </Modal>

      <Modal title="Новый ручной заказ" open={createOrderOpen} onCancel={() => setCreateOrderOpen(false)} footer={null}>
        <Form form={createOrderForm} layout="vertical" onFinish={handleCreateOrder} initialValues={{ places_count: 1, weight_total: 10, volume_total: 0.1, temperature_mode: "+15..+25" }}>
          <Form.Item name="direction_code" label="Направление" rules={[{ required: true, message: "Укажите направление" }]}><Input placeholder="SVO-KHV" /></Form.Item>
          <Form.Item name="airport_code" label="Аэропорт назначения" rules={[{ required: true, message: "Укажите аэропорт" }]}><Input placeholder="KHV" /></Form.Item>
          <Row gutter={16}>
             <Col span={8}><Form.Item name="places_count" label="Мест" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
             <Col span={8}><Form.Item name="weight_total" label="Вес (кг)" rules={[{ required: true }]}><InputNumber min={0.1} step={0.1} style={{ width: "100%" }} /></Form.Item></Col>
             <Col span={8}><Form.Item name="volume_total" label="Объем (м³)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>
          <Form.Item name="temperature_mode" label="Температурный режим" rules={[{ required: true, message: "Выберите температурный режим" }]}><Select options={options.temperature} /></Form.Item>
          <Form.Item name="box_type_summary" label="Тип упаковки (опционально)"><Input placeholder="2 x Термобокс 50L" /></Form.Item>
          <Space><Button onClick={() => setCreateOrderOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit" loading={apiBusy}>Создать заказ</Button></Space>
        </Form>
      </Modal>
    </Space>
  );
}
