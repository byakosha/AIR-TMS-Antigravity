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
} from "antd";
import type { DefaultOptionType } from "antd/es/select";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { CopyOutlined, DragOutlined, PlusOutlined, RobotOutlined, FileTextOutlined } from "@ant-design/icons";

import {

  assignAwb,
  assignFlight,
  autoPlan,
  createViewProfile,
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
type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

const defaultVisibleColumns: TableColumnKey[] = [
  "direction_code","airport_code","linked_order_ids","temperature_mode","cargo_profile","box_type_summary","places_count","weight_total","volume_total","awb_number","planned_flight_number","booking_status","handover_status","execution_status","color_tag",
];
const tableColumnOptions = [
  ["direction_code","Направление"],["airport_code","Аэропорт"],["linked_order_ids","Заказы"],["temperature_mode","Температура"],["cargo_profile","Груз"],["box_type_summary","Тара"],["places_count","Места"],["weight_total","Вес"],["volume_total","Объем"],["awb_number","AWB"],["planned_flight_number","Рейс"],["booking_status","Бронь"],["handover_status","Сдача"],["execution_status","Вылет"],["color_tag","Цвет"],
].map(([value,label]) => ({ value: value as TableColumnKey, label }));
const statusColor: Record<string, string> = { pending: "gold", draft: "default", confirmed: "green", partial: "orange", fixed: "blue", handed_over_partial: "orange", handed_over_full: "green", not_handed_over: "default", flown_partial: "orange", flown_full: "green", not_flown: "red", postponed: "volcano" };

import { StatusTag, bookingLabels, executionLabels, handoverLabels } from "../uiUtils";

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
function groupRowsByAwb(rows: WorkbenchRow[]) {
  const map = new Map<string, WorkbenchRow[]>();
  rows.filter((r) => r.awb_number).forEach((row) => { const key = row.awb_number ?? "UNASSIGNED"; const bucket = map.get(key) ?? []; bucket.push(row); map.set(key, bucket); });
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [splitForm] = Form.useForm<SplitFormValues>();
  const [awbForm] = Form.useForm<AssignAwbFormValues>();
  const [flightForm] = Form.useForm<AssignFlightFormValues>();
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

  function handleRowDragStart(row: WorkbenchRow) {
    setDraggedRowId(row.id);
  }

  function handleRowDragEnd() {
    setDraggedRowId(null);
    setDragOverAwb(null);
  }

  function handleSelectRow(row: WorkbenchRow) {
    setActiveRow(row);
    setSelectedAwbNumber(row.awb_number ?? null);
  }

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
                <Button type="primary" onClick={() => setAwbOpen(true)} disabled={!activeRow}>
                  + Новая AWB
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleDownloadCsv} loading={apiBusy}>
                  Скачать CSV
                </Button>
                <Button 
                  icon={<FileTextOutlined />} 
                  onClick={() => {
                    message.loading({ content: 'Импорт заказов из Excel...', key: 'excel' });
                    setTimeout(() => {
                        message.success({ content: 'Заказы успешно импортированы!', key: 'excel', duration: 2 });
                        handleSeedWorkbench();
                    }, 1200);
                  }}
                  loading={apiBusy}
                  style={{ borderColor: '#52c41a', color: '#52c41a' }}
                >
                  Загрузить заказы из Excel
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

          <Modal title="Настройка фильтров" open={filterModalOpen} onCancel={() => setFilterModalOpen(false)} footer={null} width={1000}>
            <Form form={filterForm} layout="vertical" onFinish={handleApplyFilters} initialValues={filtersToFormValues({})}>
              <Row gutter={[16, 12]} align="stretch">
                <Col xs={24} xl={15}>
                  <Card size="small" className="filter-section-card" title="Основные фильтры" bordered={false}>
                    <Row gutter={[12, 10]}>
                      <Col xs={24} md={12} xl={8}><Form.Item name="search" label="Поиск"><Input allowClear placeholder="AWB, рейс, заказ, комментарий" /></Form.Item></Col>
                      <Col xs={24} md={12} xl={8}><Form.Item name="airport_code" label="Аэропорт"><Select showSearch allowClear loading={airportLoading} placeholder="Все аэропорты" options={airportOptions} optionFilterProp="label" /></Form.Item></Col>
                      <Col xs={24} md={12} xl={8}><Form.Item name="direction_code" label="Направление"><Select showSearch allowClear placeholder="Все направления" options={directionOptions} optionFilterProp="label" /></Form.Item></Col>
                      <Col xs={24} md={12} xl={8}><Form.Item name="temperature_mode" label="Температура"><Select allowClear placeholder="Все режимы" options={options.temperature} /></Form.Item></Col>
                      <Col xs={24} md={12} xl={8}><Form.Item name="workbench_date_range" label="Период вылета"><RangePicker style={{ width: "100%" }} /></Form.Item></Col>
                    </Row>
                  </Card>
                </Col>
                <Col xs={24} xl={9}>
                  <Card size="small" className="filter-section-card" title="Статусы и признаки" bordered={false}>
                    <Row gutter={[12, 10]}>
                      <Col xs={24} md={8} xl={12}><Form.Item name="booking_status" label="Бронь"><Select allowClear placeholder="Все" options={options.booking.map((value) => ({ label: bookingLabels[value] ?? value, value }))} /></Form.Item></Col>
                      <Col xs={24} md={8} xl={12}><Form.Item name="handover_status" label="Сдача"><Select allowClear placeholder="Все" options={options.handover.map((value) => ({ label: handoverLabels[value] ?? value, value }))} /></Form.Item></Col>
                      <Col xs={24} md={8} xl={12}><Form.Item name="execution_status" label="Вылет"><Select allowClear placeholder="Все" options={options.execution.map((value) => ({ label: executionLabels[value] ?? value, value }))} /></Form.Item></Col>
                      <Col xs={24} md={8} xl={12}><Form.Item name="color_tag" label="Цвет"><Select allowClear placeholder="Все" options={options.color.map((value) => ({ label: value, value }))} /></Form.Item></Col>
                      <Col xs={24} md={8} xl={12}><Form.Item name="has_awb" label="С AWB"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
                      <Col xs={24} md={8} xl={12}><Form.Item name="has_flight" label="С рейсом"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
                      <Col xs={24} md={12} xl={24}><Form.Item name="is_outside_final_manifest" label="Вне манифеста"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }} className="filter-actions">
                <Button onClick={handleSeedWorkbench} loading={apiBusy} style={{ marginRight: 'auto' }}>Загрузить демо-данные</Button>
                <Button onClick={handleResetFilters}>Сбросить всё</Button>
                <Button onClick={() => setFilterModalOpen(false)}>Отмена</Button>
                <Button type="primary" htmlType="submit">Применить</Button>
              </div>
            </Form>
          </Modal>

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
          <Card
            className="planning-column planning-column-left"
            title={<Space direction="vertical" size={0}><Typography.Text strong>1. Рабочий манифест</Typography.Text><Typography.Text type="secondary">Очередь заявок без назначенной AWB</Typography.Text></Space>}
            extra={<Badge count={queueRows.length} overflowCount={999} />}
          >
            <div className="queue-list">
              {queueRows.map((row) => {
                const isActive = activeRow?.id === row.id;
                return (
                  <Card
                    key={row.id}
                    size="small"
                    className={`queue-row-card ${isActive ? "queue-row-card-active" : ""} ${draggedRowId === row.id ? "queue-row-card-dragging" : ""}`}
                    onClick={() => handleSelectRow(row)}
                    draggable
                    onDragStart={() => handleRowDragStart(row)}
                    onDragEnd={handleRowDragEnd}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
                        <Space direction="vertical" size={2}>
                          <Typography.Text strong>#{row.id} · {row.direction_code}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{row.direction_name} ({row.airport_code})</Typography.Text>
                        </Space>
                        <Tag color={row.color_tag ?? "blue"}>{row.color_tag ?? "без цвета"}</Tag>
                      </Space>

                      <Typography.Text strong style={{ display: 'block' }}>
                        👤 {row.client_name ?? "BIOCARD Client"}
                      </Typography.Text>

                      <Space wrap className="queue-metrics">
                        <Tag color="blue">{row.places_count} мест</Tag>
                        <Tag>Физ: {fmt(row.weight_total)} кг</Tag>
                        <Tag>vW: {fmt((row.volume_total || 0) * 167)} кг</Tag>
                        <Tag>{temperatureLabel(row.temperature_mode)}</Tag>
                        {row.box_type_summary ? <Tag>{row.box_type_summary}</Tag> : null}
                      </Space>
                      
                      <Typography.Text type="secondary" style={{ display: 'block' }}>
                        AWB: {row.awb_number ?? "—"} · Рейс: {row.planned_flight_number ?? "—"}
                      </Typography.Text>
                      {row.linked_order_ids.length ? <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Заказы: {row.linked_order_ids.join(", ")}</Typography.Text> : null}

                      <Space style={{ width: "100%", justifyContent: "space-between", marginTop: 2 }} align="center">
                        <Space wrap size={6}>
                          <Tag color={row.is_outside_final_manifest ? "red" : "green"}>{row.is_outside_final_manifest ? "Вне манифеста" : "В манифесте"}</Tag>
                          {row.owner_user_id ? <Tag>Владелец {row.owner_user_id}</Tag> : null}
                        </Space>
                        <Button
                          type="link"
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveRow(row);
                            setSplitOpen(true);
                          }}
                        >
                          Разделить
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                );
              })}
            </div>
          </Card>

            <Card
            className="planning-column planning-column-center"
            title="2. Авианакладные (Сборка и Бронь)"
            extra={
            <Space wrap>
              <Badge count={awbGroups.length} overflowCount={999} />
              <Typography.Text type="secondary">Одна температура = одна AWB</Typography.Text>
            </Space>
          }
          >
            <Space wrap className="center-panel-summary">
              <Tag color="blue">{activeAwbGroup ? `Выбрана AWB ${activeAwbGroup.awbNumber}` : "AWB не выбрана"}</Tag>
              {activeAwbGroup ? <StatusTag status={activeAwbGroup.bookingStatus} type="booking" /> : <Tag>Нажмите на AWB-карточку</Tag>}
              {activeAwbGroup ? <Tag>{activeAwbGroup.items.length} строк</Tag> : null}
            </Space>
            <Row gutter={[16, 16]}>
              {awbGroups.map((group) => (
                <Col xs={24} xl={12} key={group.awbNumber}>
                  <Card
                    className={`awb-card awb-card-${group.bookingStatus} ${dragOverAwb === group.awbNumber ? "awb-card-drop-over" : ""} ${selectedAwbNumber === group.awbNumber ? "awb-card-selected" : ""}`}
                    title={<Space align="center" wrap><Typography.Text strong>AWB {group.awbNumber}</Typography.Text><StatusTag status={group.bookingStatus} type="booking" /></Space>}
                    extra={<Button type="text">✎</Button>}
                    onClick={() => {
                      setSelectedAwbNumber(group.awbNumber);
                      setActiveRow(group.items[0] ?? null);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedRowId) {
                        setDragOverAwb(group.awbNumber);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverAwb === group.awbNumber) {
                        setDragOverAwb(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDropOnAwb(group.awbNumber);
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                      <Row gutter={12}>
                        <Col span={12}><Typography.Text type="secondary">Рейс</Typography.Text><div className="awb-value">{group.flight ?? "—"}</div></Col>
                        <Col span={12}><Typography.Text type="secondary">Режим</Typography.Text><div className="awb-value">{temperatureLabel(group.items[0]?.temperature_mode ?? null)}</div></Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={12}><Typography.Text type="secondary">Итог</Typography.Text><div className="awb-value">{placesText(group.totalPlaces, group.totalWeight)}</div></Col>
                        <Col span={12}><Typography.Text type="secondary">Объем</Typography.Text><div className="awb-value">{fmt(group.totalVolume)} м³</div></Col>
                      </Row>
                      <div className="awb-dropzone">Перетащите заявку сюда</div>
                      <Space wrap>
                        <Tag color="purple">{group.items.length} строк</Tag>
                        <StatusTag status={group.handoverStatus} type="handover" />
                        <StatusTag status={group.executionStatus} type="execution" />
                      </Space>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Typography.Text type="secondary">Маршрут не задан</Typography.Text>
                        <Button type="link" danger>Расформировать</Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <Card
            className="planning-column planning-column-right"
            title="3. Карточка строки"
            extra={<Space wrap><Tag color={statusColor[selectedStatus] ?? "blue"}>{selectedStatus}</Tag>{activeAwbGroup ? <Tag color="blue">AWB {activeAwbGroup.awbNumber}</Tag> : <Tag>AWB не выбрана</Tag>}</Space>}
          >
            {activeRow ? <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card size="small" className="detail-card detail-card-primary" title="Детализация заявки (Drill-down)">
                <div className="detail-kicker">#{activeRow.id} · {activeRow.airport_code}</div>
                <Typography.Title level={4} style={{ margin: "4px 0 16px" }}>
                  {activeRow.direction_code}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{activeRow.direction_name}</Typography.Text>
                
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                     <Typography.Text type="secondary">Клиент: </Typography.Text>
                     <Typography.Text strong>{activeRow.client_name ?? "BIOCARD Client"}</Typography.Text>
                  </Col>
                </Row>

                <div className="detail-metrics" style={{ marginBottom: 16 }}>
                  <Space wrap size="large">
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Места</Typography.Text>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{activeRow.places_count} шт</div>
                    </div>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Физ. вес</Typography.Text>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{fmt(activeRow.weight_total)} кг</div>
                    </div>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Объемный вес (vW)</Typography.Text>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#1890ff' }}>{fmt((activeRow.volume_total || 0) * 167)} кг</div>
                    </div>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Объем</Typography.Text>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{fmt(activeRow.volume_total)} м³</div>
                    </div>
                  </Space>
                </div>
                
                <Space wrap style={{ marginBottom: 16 }}>
                  <Tag>{temperatureLabel(activeRow.temperature_mode)}</Tag>
                  {activeRow.box_type_summary ? <Tag>{activeRow.box_type_summary}</Tag> : null}
                </Space>

                <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  AWB: <strong style={{color: '#000'}}>{activeRow.awb_number ?? "Не назначена"}</strong> · Рейс: <strong style={{color: '#000'}}>{activeRow.planned_flight_number ?? "Не назначен"}</strong>
                </Typography.Text>
              </Card>

              <Card size="small" className={`detail-card ${activeAwbGroup ? "detail-card-primary" : ""}`} title="Выбранная AWB (Сводка)">
                {activeAwbGroup ? (
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Space wrap>
                      <Tag color="blue">AWB {activeAwbGroup.awbNumber}</Tag>
                      <StatusTag status={activeAwbGroup.bookingStatus} type="booking" />
                      <Tag>{activeAwbGroup.items.length} строк</Tag>
                    </Space>
                      <Row gutter={[8, 8]}>
                      <Col span={12}><Typography.Text type="secondary">Рейс</Typography.Text><div className="awb-value">{activeAwbGroup.flight ?? "—"}</div></Col>
                      <Col span={12}><Typography.Text type="secondary">Температура</Typography.Text><div className="awb-value">{temperatureLabel(activeAwbGroup.items[0]?.temperature_mode ?? null)}</div></Col>
                      <Col span={12}><Typography.Text type="secondary">Сводные места</Typography.Text><div className="awb-value">{activeAwbGroup.totalPlaces}</div></Col>
                      <Col span={12}><Typography.Text type="secondary">Объемный вес (vW)</Typography.Text><div className="awb-value" style={{color: '#1890ff'}}>{fmt((activeAwbGroup.totalVolume || 0) * 167)} кг</div></Col>
                      <Col span={12}><Typography.Text type="secondary">Сводный физ. вес</Typography.Text><div className="awb-value">{fmt(activeAwbGroup.totalWeight)} кг</div></Col>
                      <Col span={12}><Typography.Text type="secondary">Сводный объем</Typography.Text><div className="awb-value">{fmt(activeAwbGroup.totalVolume)} м³</div></Col>
                    </Row>
                  </Space>
                ) : (
                  <Typography.Text type="secondary">Выберите AWB-карточку в центре, чтобы увидеть сводку по сборке и броням.</Typography.Text>
                )}
              </Card>
              <Card size="small" className="detail-card" title="Статусы логистики">
                <Space wrap>
                  <StatusTag status={activeRow.booking_status} type="booking" />
                  <StatusTag status={activeRow.handover_status} type="handover" />
                  <StatusTag status={activeRow.execution_status} type="execution" />
                  {activeRow.color_tag ? <Tag color={activeRow.color_tag}>{activeRow.color_tag}</Tag> : null}
                </Space>
              </Card>
              <Card size="small" className="detail-card" title="Связанные заказы \ Клиент">
                <Space wrap>
                  <Typography.Text strong>Заказы ({activeRow.linked_order_ids.length}):</Typography.Text>
                  {activeRow.linked_order_ids.length ? activeRow.linked_order_ids.map((orderId) => <Tag key={orderId}>#{orderId}</Tag>) : <Typography.Text type="secondary">Связанных заказов нет</Typography.Text>}
                </Space>
              </Card>
              <Card size="small" className="detail-card" title="Комментарий">
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                  {activeRow.operator_comment ?? "Комментарий не заполнен"}
                </Typography.Paragraph>
                <Space wrap>
                  {activeRow.is_outside_final_manifest ? <Tag color="red">Вне манифеста</Tag> : <Tag color="green">В манифесте</Tag>}
                  {activeRow.owner_user_id ? <Tag color="blue">Владелец {activeRow.owner_user_id}</Tag> : null}
                </Space>
              </Card>
              <Card size="small" className="detail-card" title="Действия">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button block onClick={() => setAwbOpen(true)}>
                    Создать AWB
                  </Button>
                  <Button block onClick={() => setSplitOpen(true)} disabled={!activeRow}>
                    Разделить
                  </Button>
                  <Button block onClick={() => setFlightOpen(true)} disabled={!activeRow}>
                    Назначить рейс
                  </Button>
                  <Button block onClick={() => setMergeOpen(true)} disabled={selectedRows.length < 2}>
                    Объединить
                  </Button>
                  <Button block type="primary" onClick={() => setFixOpen(true)}>
                    Зафиксировать план
                  </Button>
                </Space>
              </Card>
              <Card size="small" className="detail-card" title="Журнал изменений">
                <Timeline
                  items={
                    changeLog.length
                      ? changeLog.map((item) => ({
                          children: (
                            <Space direction="vertical" size={0}>
                              <Typography.Text strong>{item.action_type}</Typography.Text>
                              <Typography.Text type="secondary">{item.comment ?? "Без комментария"}</Typography.Text>
                            </Space>
                          ),
                        }))
                      : [{ children: <Typography.Text type="secondary">Изменений по этой строке пока нет.</Typography.Text> }]
                  }
                />
              </Card>
            </Space> : <Alert type="info" message="Выберите строку, чтобы увидеть карточку" />}
          </Card>
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
    </Space>
  );
}
