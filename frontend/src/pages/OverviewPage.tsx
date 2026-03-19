import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Row, Space, Typography, Table, DatePicker, Statistic, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { FileTextOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PackageOpen, PlaneTakeoff, RefreshCcw } from "lucide-react";
import { StatusTag, bookingLabels, executionLabels } from "../uiUtils";

const { RangePicker } = DatePicker;

// Richer mock data
const fallbackSummary = {
  snapshots: [
    { direction_code: "MOW-SVO", direction_name: "Moscow - Sheremetyevo", airport_code: "SVO", temperature_mode: "+2..+8", booking_status: "pending", execution_status: "pending", awb_number: "555-12345675", days_in_planning: 2, volume: 140 },
    { direction_code: "MOW-VKO", direction_name: "Moscow - Vnukovo", airport_code: "VKO", temperature_mode: "-20", booking_status: "confirmed", execution_status: "flown_partial", awb_number: null, days_in_planning: 4, volume: 86 },
    { direction_code: "LED-KGD", direction_name: "Pulkovo - Khrabrovo", airport_code: "KGD", temperature_mode: "+15..+25", booking_status: "draft", execution_status: "pending", awb_number: "555-99887766", days_in_planning: 0, volume: 320 },
    { direction_code: "OVB-SVX", direction_name: "Tolmachevo - Koltsovo", airport_code: "SVX", temperature_mode: "NO_TEMP_CONTROL", booking_status: "confirmed", execution_status: "pending", awb_number: "111-22233344", days_in_planning: 1, volume: 45 },
    { direction_code: "MOW-DME", direction_name: "Moscow - Domodedovo", airport_code: "DME", temperature_mode: "+2..+8", booking_status: "fixed", execution_status: "flown_full", awb_number: "555-10203040", days_in_planning: 1, volume: 210 },
    { direction_code: "LED-VVO", direction_name: "Pulkovo - Vladivostok", airport_code: "VVO", temperature_mode: "-70", booking_status: "partial", execution_status: "not_flown", awb_number: "111-99988877", days_in_planning: 5, volume: 60 },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(fallbackSummary.snapshots);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const slaGreen = useMemo(() => data.filter(d => d.days_in_planning < 1).length, [data]);
  const slaYellow = useMemo(() => data.filter(d => d.days_in_planning >= 1 && d.days_in_planning <= 3).length, [data]);
  const slaRed = useMemo(() => data.filter(d => d.days_in_planning > 3).length, [data]);
  const totalAWB = useMemo(() => data.filter(d => d.awb_number !== null).length, [data]);

  // Chart Data preparation
  const pieData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      acc[curr.booking_status] = (acc[curr.booking_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name: bookingLabels[name] || name, value }));
  }, [data]);

  const barData = useMemo(() => {
    return [
      { name: 'Эта неделя', weight: 850, places: 42 },
      { name: 'Прошлая нед.', weight: 1120, places: 55 },
      { name: '2 нед. назад', weight: 980, places: 48 },
      { name: '3 нед. назад', weight: 1250, places: 60 }
    ];
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Premium Luxury Hero Section */}
      <div className="premium-hero" style={{ padding: "40px" }}>
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>
              Аналитика и контроль
            </Typography.Title>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Сводка по объемам, SLA и выполнению рейсов за выбранный период
            </Typography.Text>
          </Col>
          <Col>
            <Space size="large">
              <Space>
                <Typography.Text strong style={{ color: 'var(--text-muted)' }}>Оценка:</Typography.Text>
                <RangePicker defaultValue={[dayjs().subtract(7, 'day'), dayjs()]} format="DD.MM.YYYY" bordered={false} style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }} />
              </Space>
              <Button type="primary" size="large" onClick={() => navigate('/planning')} style={{ boxShadow: 'var(--shadow-md)' }}>
                Запустить планирование
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        {/* KPI Summary */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={8}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Всего заявок в пайплайне" value={data.length} prefix={<PackageOpen size={20} style={{marginRight: 8, color: '#8c1c24'}}/>} valueStyle={{fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Оформлено AWB" value={totalAWB} prefix={<FileTextOutlined style={{marginRight: 8, color: '#52c41a'}}/>} valueStyle={{color: '#52c41a', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Ожидают отправки (Без AWB)" value={data.length - totalAWB} prefix={<RefreshCcw size={20} style={{marginRight: 8, color: '#faad14'}}/>} valueStyle={{color: '#faad14', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            {/* SLA Controls */}
            <Col span={24}>
              <Typography.Title level={5}>Контроль SLA (Дней в планировании)</Typography.Title>
              <div style={{display: 'flex', gap: 16}}>
                 <div style={{flex: 1, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16}}>
                   <Statistic title={<span style={{color: '#389e0d'}}>Норма (&lt; 1 дн)</span>} value={slaGreen} valueStyle={{color: '#389e0d', fontWeight: 'bold'}} />
                 </div>
                 <div style={{flex: 1, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: 16}}>
                   <Statistic title={<span style={{color: '#d48806'}}>Внимание (1-3 дн)</span>} value={slaYellow} valueStyle={{color: '#d48806', fontWeight: 'bold'}} />
                 </div>
                 <div style={{flex: 1, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, padding: 16}}>
                   <Statistic title={<span style={{color: '#cf1322'}}>Просрочка (&gt; 3 дн)</span>} value={slaRed} valueStyle={{color: '#cf1322', fontWeight: 'bold'}} />
                 </div>
              </div>
            </Col>
            {/* Extended Charts */}
            <Col span={24}>
              <Card className="metric-card" title="Объемы за последний месяц" bordered={false}>
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="weight" name="Вес (кг)" fill="#1890ff" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="places" name="Места" fill="#52c41a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Breakdown Panel */}
        <Col xs={24} md={8}>
          <Card bordered={false} className="metric-card" title="Статусы бронирования" style={{ height: '100%' }}>
             <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div style={{marginTop: 32}}>
                <Typography.Title level={5}>Топ направлений (Места)</Typography.Title>
                <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16}}>
                  {data.slice(0, 4).map(d => (
                    <div key={d.direction_code} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-subtle)', transition: 'all 0.2s', cursor: 'default'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                       <Space>
                         <PlaneTakeoff size={18} color="var(--primary)"/>
                         <Typography.Text strong>{d.direction_code}</Typography.Text>
                       </Space>
                       <Badge count={`${d.volume} кг`} style={{backgroundColor: '#52c41a', boxShadow: '0 2px 8px rgba(82,196,26,0.3)'}} />
                    </div>
                  ))}
                </div>
             </div>
          </Card>
        </Col>
      </Row>

      {/* Operational Monitor Table */}
      <Card className="overview-panel" title={<Typography.Title level={4} style={{ margin: 0 }}>Операционный мониторинг</Typography.Title>} bordered={false}>
        <Table
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 5 }}
          rowKey={(record) => `${record.direction_code}-${record.awb_number}`}
          className="overview-table"
          onRow={(record) => ({
             className: record.booking_status === 'confirmed' ? 'overview-row-confirmed' : record.booking_status === 'pending' ? 'overview-row-pending' : record.execution_status === 'flown_partial' ? 'overview-row-critical' : ''
          })}
          columns={[
            { title: 'Направление', dataIndex: 'direction_code', key: 'direction', render: (text, record) => (<Space direction="vertical" size={0}><Typography.Text strong>{text}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: '12px' }}>{record.direction_name}</Typography.Text></Space>) },
            { title: 'Аэропорт', dataIndex: 'airport_code', key: 'airport' },
            { title: 'Авианакладная', dataIndex: 'awb_number', key: 'awb', render: (text) => text ? <Typography.Text strong color="#000">{text}</Typography.Text> : <Typography.Text type="secondary">Не назначена</Typography.Text> },
            { title: 'Бронь', dataIndex: 'booking_status', key: 'booking', render: (status: string) => <StatusTag status={status} type="booking" /> },
            { title: 'Исполнение', dataIndex: 'execution_status', key: 'execution', render: (status: string) => <StatusTag status={status} type="execution" /> },
            { title: 'Дней', dataIndex: 'days_in_planning', key: 'days_in_planning', render: (days: number) => { let badgeColor = 'success'; if (days >= 1 && days <= 3) badgeColor = 'warning'; if (days > 3) badgeColor = 'error'; return <Badge status={badgeColor as any} text={`${days} дн.`} />; } }
          ] as ColumnsType<any>}
        />
      </Card>
    </Space>
  );
}
