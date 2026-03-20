import { Card, Space, Typography, Tag, Badge, Button, Row, Col } from "antd";
import { StatusTag } from "../../uiUtils";
import type { WorkbenchRow } from "../../api";

export interface AwbGroup {
  awbNumber: string;
  items: WorkbenchRow[];
  totalPlaces: number;
  totalWeight: number;
  totalVolume: number;
  flight: string | null;
  bookingStatus: string;
  handoverStatus: string;
  executionStatus: string;
}

function fmt(n: number) { return Number(n.toFixed(2)).toString(); }

function placesText(p: number, w: number) {
  return `${p} мест / ${fmt(w)} кг`;
}

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

export interface PlanningAwbGridProps {
  awbGroups: AwbGroup[];
  activeAwbGroup: AwbGroup | null;
  dragOverAwb: string | null;
  selectedAwbNumber: string | null;
  draggedRowId: number | null;
  onSelectAwb: (awbNumber: string, firstRow: WorkbenchRow | null) => void;
  onDragOverAwb: (awbNumber: string) => void;
  onDragLeaveAwb: (awbNumber: string) => void;
  onDropOnAwb: (awbNumber: string) => void;
}

export function PlanningAwbGrid({
  awbGroups,
  activeAwbGroup,
  dragOverAwb,
  selectedAwbNumber,
  draggedRowId,
  onSelectAwb,
  onDragOverAwb,
  onDragLeaveAwb,
  onDropOnAwb,
}: PlanningAwbGridProps) {
  return (
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
              onClick={() => onSelectAwb(group.awbNumber, group.items[0] ?? null)}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedRowId) {
                  onDragOverAwb(group.awbNumber);
                }
              }}
              onDragLeave={() => {
                if (dragOverAwb === group.awbNumber) {
                  onDragLeaveAwb(group.awbNumber);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDropOnAwb(group.awbNumber);
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
  );
}
