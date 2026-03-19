import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Row, Space, Tag, Typography, message, Table, DatePicker, Statistic, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { fetchOverviewSummary, type OverviewSummary } from "../api";

const { RangePicker } = DatePicker;

// Mock data expansion for BI dashboard demo
const fallbackSummary = {
  snapshots: [
    {
      direction_code: "MOW-SVO",
      direction_name: "Moscow - Sheremetyevo",
      airport_code: "SVO",
      temperature_mode: "+2..+8",
      booking_status: "pending",
      execution_status: "pending",
      awb_number: "555-12345675",
      days_in_planning: 2,
    },
    {
      direction_code: "MOW-VKO",
      direction_name: "Moscow - Vnukovo",
      airport_code: "VKO",
      temperature_mode: "-20",
      booking_status: "confirmed",
      execution_status: "flown_partial",
      awb_number: null,
      days_in_planning: 4,
    },
    {
      direction_code: "LED-KGD",
      direction_name: "Pulkovo - Khrabrovo",
      airport_code: "KGD",
      temperature_mode: "+15..+25",
      booking_status: "draft",
      execution_status: "pending",
      awb_number: "555-99887766",
      days_in_planning: 0,
    },
    {
      direction_code: "OVB-SVX",
      direction_name: "Tolmachevo - Koltsovo",
      airport_code: "SVX",
      temperature_mode: "NO_TEMP_CONTROL",
      booking_status: "confirmed",
      execution_status: "pending",
      awb_number: "111-22233344",
      days_in_planning: 1,
    }
  ],
};

const bookingLabel: Record<string, string> = {
  pending: "Ожидает",
  draft: "Черновик",
  confirmed: "Подтверждена",
  partial: "Частично",
  fixed: "Фикс",
};

const executionLabel: Record<string, string> = {
  pending: "В очереди",
  flown_full: "Вылетело",
  flown_partial: "Частичный вылет",
  not_flown: "Не вылетело",
  postponed: "Отложено",
};

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(fallbackSummary.snapshots);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app we would fetch the BI data here
    setTimeout(() => {
      setLoading(false);
    }, 600);
  }, []);

  // Compute SLA aging zones
  const slaGreen = useMemo(() => data.filter(d => d.days_in_planning < 1).length, [data]);
  const slaYellow = useMemo(() => data.filter(d => d.days_in_planning >= 1 && d.days_in_planning <= 3).length, [data]);
  const slaRed = useMemo(() => data.filter(d => d.days_in_planning > 3).length, [data]);
  const totalAWB = useMemo(() => data.filter(d => d.awb_number !== null).length, [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Header & Global Filters */}
      <Card className="overview-hero" bordered={false} bodyStyle={{ padding: "24px 32px" }}>
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Аналитика и контроль (Dashboard)
            </Typography.Title>
            <Typography.Text type="secondary">
              Отслеживайте SLA, объемы планирования и критические отклонения
            </Typography.Text>
          </Col>
          <Col>
            <Space>
              <Typography.Text strong>Период:</Typography.Text>
              <RangePicker defaultValue={[dayjs().subtract(7, 'day'), dayjs()]} format="DD.MM.YYYY" />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* SLA Aging Zones (Red, Yellow, Green) */}
      <div style={{ padding: "0" }}>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          Контроль SLA (Жизненный цикл планирования)
        </Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f', border: '1px solid #b7eb8f' }}>
              <Statistic
                title={<Typography.Text strong style={{ color: '#389e0d' }}>Зеленая зона (В норме, &lt; 1 дня)</Typography.Text>}
                value={slaGreen}
                suffix="строк"
                valueStyle={{ color: '#389e0d', fontSize: "2rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f', border: '1px solid #ffe58f' }}>
              <Statistic
                title={<Typography.Text strong style={{ color: '#d48806' }}>Желтая зона (Внимание, 1-3 дня)</Typography.Text>}
                value={slaYellow}
                suffix="строк"
                valueStyle={{ color: '#d48806', fontSize: "2rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ backgroundColor: '#fff2f0', borderColor: '#ffccc7', border: '1px solid #ffccc7' }}>
              <Statistic
                title={<Typography.Text strong style={{ color: '#cf1322' }}>Красная зона (Просрочка, &gt; 3 дней)</Typography.Text>}
                value={slaRed}
                suffix="строк"
                valueStyle={{ color: '#cf1322', fontSize: "2rem", fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Overall Numbers */}
      <Row gutter={[16, 16]}>
         <Col xs={24} sm={12} xl={6}>
            <Card className="metric-card overview-metric-card" bordered={false}>
              <Typography.Text type="secondary">Всего заявок (строк)</Typography.Text>
              <Typography.Title level={3} style={{ margin: "6px 0 2px" }}>{data.length}</Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="metric-card overview-metric-card" bordered={false}>
              <Typography.Text type="secondary">Оформлено AWB</Typography.Text>
              <Typography.Title level={3} style={{ margin: "6px 0 2px", color: '#096dd9' }}>{totalAWB}</Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="metric-card overview-metric-card" bordered={false}>
              <Typography.Text type="secondary">Ожидают сборки</Typography.Text>
              <Typography.Title level={3} style={{ margin: "6px 0 2px" }}>{data.length - totalAWB}</Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="metric-card overview-metric-card" bordered={false} onClick={() => navigate('/planning')} style={{ cursor: 'pointer', backgroundColor: '#e6f7ff' }}>
              <Space style={{ width: '100%', justifyContent: 'center', height: '100%' }}>
                <Typography.Text strong style={{ color: '#1890ff', fontSize: 16 }}>Перейти в Планирование →</Typography.Text>
              </Space>
            </Card>
          </Col>
      </Row>

      {/* Clean Table */}
      <Card 
        className="overview-panel" 
        title={<Typography.Title level={4} style={{ margin: 0 }}>Операционный мониторинг заказов</Typography.Title>} 
        bordered={false}
      >
        <Table
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 5 }}
          rowKey={(record) => `${record.direction_code}-${record.awb_number}`}
          className="overview-table"
          // Minimalist Row Highlight Rules
          onRow={(record) => ({
            className: record.booking_status === 'confirmed' 
              ? 'overview-row-confirmed'
              : record.booking_status === 'pending' 
              ? 'overview-row-pending' 
              : record.execution_status === 'flown_partial' 
              ? 'overview-row-critical' 
              : ''
          })}
          columns={[
            {
              title: 'Направление',
              dataIndex: 'direction_code',
              key: 'direction',
              render: (text, record) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{text}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{record.direction_name}</Typography.Text>
                </Space>
              )
            },
            {
              title: 'Аэропорт',
              dataIndex: 'airport_code',
              key: 'airport',
            },
            {
              title: 'Температура',
              dataIndex: 'temperature_mode',
              key: 'temp',
              render: (text) => <Typography.Text>{text}</Typography.Text>
            },
            {
              title: 'Авианакладная',
              dataIndex: 'awb_number',
              key: 'awb',
              render: (text) => text ? <Typography.Text strong>{text}</Typography.Text> : <Typography.Text type="secondary">Не назначена</Typography.Text>
            },
            {
              title: 'В планировании',
              dataIndex: 'days_in_planning',
              key: 'days_in_planning',
              render: (days: number) => {
                let badgeColor = 'success';
                if (days >= 1 && days <= 3) badgeColor = 'warning';
                if (days > 3) badgeColor = 'error';
                return <Badge status={badgeColor as any} text={`${days} дн.`} />;
              }
            },
            {
              title: 'Бронь',
              dataIndex: 'booking_status',
              key: 'booking',
              // Use simple text instead of Tag to clean up the UI
              render: (status: string) => <Typography.Text strong={status==='confirmed'} type={status==='confirmed' ? 'success' : 'secondary'}>{bookingLabel[status] ?? status}</Typography.Text>
            },
            {
              title: 'Исполнение',
              dataIndex: 'execution_status',
              key: 'execution',
              render: (status: string) => <Typography.Text>{executionLabel[status] ?? status}</Typography.Text>
            }
          ] as ColumnsType<any>}
        />
      </Card>
    </Space>
  );
}
