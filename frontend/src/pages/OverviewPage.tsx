import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Row, Space, Typography, DatePicker, message, Spin, Statistic, Steps, Table } from "antd";
import dayjs from "dayjs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTCooltip, AreaChart, Area, LabelList } from "recharts";
import { fetchAnalytics, type AnalyticsData } from "../api";
import { PackageOpen, PlaneTakeoff, RefreshCcw, AlertOctagon } from "lucide-react";

const { RangePicker } = DatePicker;

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const navigate = useNavigate();
  
  // Default to short-term radar: 7 days ago to today
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  useEffect(() => {
    async function loadAnalysis() {
      setLoading(true);
      try {
        const start = dateRange[0] ? dateRange[0].toISOString() : undefined;
        const end = dateRange[1] ? dateRange[1].toISOString() : undefined;
        
        const payload = await fetchAnalytics({ start_date: start, end_date: end });
        setData(payload);
      } catch (err) {
        message.error("Не удалось загрузить данные дашборда");
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [dateRange]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Premium Hero */}
      <div className="premium-hero" style={{ padding: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #001529 0%, #1890ff 100%)", color: "white" }}>
        <Row justify="space-between" align="middle" wrap gutter={[16, 16]}>
          <Col>
            <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.03em', color: "white" }}>
              Оперативный Пульт (Here & Now)
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              Фокус на ближайшем горизонте планирования и горящих направлениях.
            </Typography.Text>
          </Col>
          <Col>
            <Space size="large" align="center">
              <Space>
                <Typography.Text strong style={{ color: 'rgba(255,255,255,0.9)' }}>Оперативный период:</Typography.Text>
                <RangePicker 
                  value={dateRange} 
                  onChange={(dates) => setDateRange(dates as any)} 
                />
              </Space>
              <Button type="primary" size="large" onClick={() => navigate('/planning')} style={{ boxShadow: 'var(--shadow-md)', background: "#fff", color: "#1890ff" }}>
                Срочное Планирование
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {data && (
          <Row gutter={[16, 16]}>
            {/* STAGE 1: PIPELINE FUNNEL */}
            <Col xs={24}>
              <Card className="metric-card" title="Конверсия заказов (Pipeline Funnel)" bordered={false}>
                <Steps
                  current={4}
                  items={[
                    {
                      title: 'Получено (Draft/Новые)',
                      description: <span style={{fontSize: 24, fontWeight: 'bold', color: '#1890ff'}}>{data.pipeline_stats.draft} шт</span>,
                    },
                    {
                      title: 'В планировании (Pending)',
                      description: <span style={{fontSize: 24, fontWeight: 'bold', color: '#faad14'}}>{data.pipeline_stats.pending} шт</span>,
                    },
                    {
                      title: 'Ожидают рейса (Confirmed)',
                      description: <span style={{fontSize: 24, fontWeight: 'bold', color: '#13c2c2'}}>{data.pipeline_stats.confirmed} шт</span>,
                    },
                    {
                      title: 'Исполнены (Улетели)',
                      description: <span style={{fontSize: 24, fontWeight: 'bold', color: '#52c41a'}}>{data.pipeline_stats.executed} шт</span>,
                    },
                  ]}
                  className="premium-steps"
                />
              </Card>
            </Col>

            {/* QUICK STATS */}
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Всего заявок (Pipeline)" value={data.total_rows} prefix={<PackageOpen size={20} style={{marginRight: 8, color: '#1890ff'}}/>} valueStyle={{fontSize: 28, fontWeight: 'bold', color: '#1890ff'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Ожидают планирования" value={data.pipeline_stats.draft + data.pipeline_stats.pending} prefix={<RefreshCcw size={20} style={{marginRight: 8, color: '#faad14'}}/>} valueStyle={{color: '#faad14', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="В воздухе / Улетели" value={data.pipeline_stats.executed} prefix={<PlaneTakeoff size={20} style={{marginRight: 8, color: '#52c41a'}}/>} valueStyle={{color: '#52c41a', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card" style={{ background: data.sla_stats.red > 0 ? '#fff1f0' : '#fff' }}>
                <Statistic title="ALARM! Просрочка > 3 дн" value={data.sla_stats.red} prefix={<AlertOctagon size={20} style={{marginRight: 8, color: '#cf1322'}}/>} valueStyle={{color: '#cf1322', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>

            {/* RADAR: DAILY LOAD */}
            <Col xs={24} lg={14}>
              <Card className="metric-card" title="Радар загрузки (Физ. вес по дням)" bordered={false}>
                <div style={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer>
                    <AreaChart data={data.daily_weight} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RTCooltip cursor={{fill: 'transparent'}} />
                      <Area type="monotone" dataKey="weight" name="Вес на терминале (кг)" stroke="#1890ff" fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* TOP 5 HOT BACKLOG DESTINATIONS */}
            <Col xs={24} lg={10}>
              <Card className="metric-card" title="Топ-5 'Горящих' направлений (Бэклог)" bordered={false}>
                {data.top_destinations.length === 0 ? (
                  <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography.Text type="secondary">Нет застрявших грузов. Всё распланировано!</Typography.Text>
                  </div>
                ) : (
                  <div style={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart layout="vertical" data={data.top_destinations} margin={{ top: 10, right: 50, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={60} />
                        <RTCooltip cursor={{fill: '#f5f5f5'}} />
                        <Bar dataKey="weight" name="Неотправленный вес (кг)" fill="#cf1322" radius={[0, 4, 4, 0]} barSize={24}>
                          <LabelList dataKey="weight" position="right" style={{ fill: '#cf1322', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </Col>

            {/* SNAPSHOTS TABLE */}
            <Col xs={24}>
              <Card borderless={false} className="metric-card" title="Краткая таблица заявок (Снапшот)">
                <Table
                  dataSource={data.snapshots}
                  rowKey={(record, i) => `${record.direction_code}_${i}`}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                  scroll={{ x: 1000 }}
                  columns={[
                    { title: "Направление", dataIndex: "direction_name", key: "direction_name" },
                    { title: "Аэропорт", dataIndex: "airport_code", key: "airport_code" },
                    { title: "Места", dataIndex: "places_count", key: "places_count" },
                    { title: "Вес (кг)", dataIndex: "weight_total", key: "weight_total" },
                    { title: "AWB", dataIndex: "awb_number", key: "awb_number", render: (v) => v || "—" },
                    { title: "Рейс", dataIndex: "planned_flight_number", key: "planned_flight_number", render: (v) => v || "—" },
                    { title: "Бронь", dataIndex: "booking_status", key: "booking_status" },
                    { title: "Вылет", dataIndex: "execution_status", key: "execution_status" },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </Space>
  );
}
