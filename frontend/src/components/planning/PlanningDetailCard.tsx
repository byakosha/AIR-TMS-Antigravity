import { Card, Space, Typography, Tag, Row, Col, Alert, Button, Timeline } from "antd";
import { StatusTag } from "../../uiUtils";
import type { WorkbenchRow, ChangeLogItem } from "../../api";
import type { AwbGroup } from "./PlanningAwbGrid";
import { useAuth } from "../../auth/AuthContext";

const statusColor: Record<string, string> = { pending: "gold", draft: "default", confirmed: "green", partial: "orange", fixed: "blue", handed_over_partial: "orange", handed_over_full: "green", not_handed_over: "default", flown_partial: "orange", flown_full: "green", not_flown: "red", postponed: "volcano" };

function fmt(n: number) { return Number(n.toFixed(2)).toString(); }

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

function temperatureLabel(value: string | null | undefined) {
  return temperatureOptions.find((item) => item.value === value)?.label ?? value ?? "—";
}

export interface PlanningDetailCardProps {
  activeRow: WorkbenchRow | null;
  activeAwbGroup: AwbGroup | null;
  selectedStatus: string;
  selectedRows: WorkbenchRow[];
  changeLog: ChangeLogItem[];
  onOpenAwb: () => void;
  onOpenSplit: () => void;
  onOpenFlight: () => void;
  onOpenMerge: () => void;
  onOpenFix: () => void;
  onOpenEdit: () => void;
}

export function PlanningDetailCard({
  activeRow,
  activeAwbGroup,
  selectedStatus,
  selectedRows,
  changeLog,
  onOpenAwb,
  onOpenSplit,
  onOpenFlight,
  onOpenMerge,
  onOpenFix,
  onOpenEdit,
}: PlanningDetailCardProps) {
  const { user } = useAuth();
  
  return (
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
                  {activeRow.linked_order_ids.length ? activeRow.linked_order_ids.map((orderId: number) => <Tag key={orderId}>#{orderId}</Tag>) : <Typography.Text type="secondary">Связанных заказов нет</Typography.Text>}
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
            {user?.role === "admin" && (
              <Button block onClick={onOpenEdit} disabled={!activeRow}>
                Изменить (Admin)
              </Button>
            )}
            <Button block onClick={onOpenAwb}>
              Создать AWB
            </Button>
            <Button block onClick={onOpenSplit} disabled={!activeRow}>
              Разделить
            </Button>
            <Button block onClick={onOpenFlight} disabled={!activeRow}>
              Назначить рейс
            </Button>
            <Button block onClick={onOpenMerge} disabled={selectedRows.length < 2}>
              Объединить
            </Button>
            <Button block type="primary" onClick={onOpenFix}>
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
  );
}
