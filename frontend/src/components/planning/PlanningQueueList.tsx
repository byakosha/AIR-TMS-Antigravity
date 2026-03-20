import { Card, Space, Typography, Tag, Badge, Button, Modal, message } from "antd";
import type { WorkbenchRow } from "../../api";

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

export interface PlanningQueueListProps {
  queueRows: WorkbenchRow[];
  activeRowId?: number;
  draggedRowId: number | null;
  onSelectRow: (row: WorkbenchRow) => void;
  onRowDragStart: (row: WorkbenchRow) => void;
  onRowDragEnd: () => void;
  onSplitRow: (row: WorkbenchRow) => void;
  userRole?: string;
  onDeleteRow: (rowId: number) => Promise<void>;
}

export function PlanningQueueList({
  queueRows,
  activeRowId,
  draggedRowId,
  onSelectRow,
  onRowDragStart,
  onRowDragEnd,
  onSplitRow,
  userRole,
  onDeleteRow,
}: PlanningQueueListProps) {
  return (
    <Card
      className="planning-column planning-column-left"
      title={<Space direction="vertical" size={0}><Typography.Text strong>1. Рабочий манифест</Typography.Text><Typography.Text type="secondary">Очередь заявок без назначенной AWB</Typography.Text></Space>}
      extra={<Badge count={queueRows.length} overflowCount={999} />}
    >
      <div className="queue-list">
        {queueRows.map((row) => {
          const isActive = activeRowId === row.id;
          return (
            <Card
              key={row.id}
              size="small"
              className={`queue-row-card ${isActive ? "queue-row-card-active" : ""} ${draggedRowId === row.id ? "queue-row-card-dragging" : ""}`}
              onClick={() => onSelectRow(row)}
              draggable
              onDragStart={() => onRowDragStart(row)}
              onDragEnd={onRowDragEnd}
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
                  <Space wrap>
                    <Button
                      type="link"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSplitRow(row);
                      }}
                    >
                      Разделить
                    </Button>
                    {userRole === "admin" && (
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          Modal.confirm({
                            title: "Удалить заказ?",
                            content: "Это действие необратимо. Окном ниже заказ будет навсегда удален.",
                            okText: "Удалить",
                            okType: "danger",
                            cancelText: "Отмена",
                            onOk: async () => {
                              try {
                                message.loading({ content: "Удаление...", key: "del_order" });
                                await onDeleteRow(row.id);
                                message.success({ content: "Заказ удален", key: "del_order" });
                              } catch (e: any) {
                                message.error({ content: e.message || "Ошибка удаления", key: "del_order" });
                              }
                            }
                          });
                        }}
                      >
                        Удалить
                      </Button>
                    )}
                  </Space>
                </Space>
              </Space>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
