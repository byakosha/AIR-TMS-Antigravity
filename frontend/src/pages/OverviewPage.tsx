import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Row, Space, Typography, Table, Select, Statistic, Badge, message, Segmented, Steps } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { FileTextOutlined } from "@ant-design/icons";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PackageOpen, PlaneTakeoff, RefreshCcw, AlertOctagon } from "lucide-react";
import { StatusTag, bookingLabels, executionLabels } from "../uiUtils";
import { fetchWorkbenchRows, type WorkbenchRow } from "../api";

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkbenchRow[]>([]);
  const navigate = useNavigate();
  
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [weightType, setWeightType] = useState<"physical" | "volume">("physical");

  useEffect(() => {
    async function loadData() {
      try {
        const rows = await fetchWorkbenchRows({});
        setData(rows || []);
      } catch (err) {
        message.error("Не удалось загрузить данные дашборда");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
       const date = dayjs(d.workbench_date);
       if (date.year() !== selectedYear) return false;
       if (selectedMonth !== null && date.month() !== selectedMonth) return false;
       return true;
    });
  }, [data, selectedYear, selectedMonth]);

  const totalAWB = useMemo(() => filteredData.filter(d => Boolean(d.awb_number)).length, [filteredData]);
  
  // SLA Calculations
  const { greenSLA, yellowSLA, redSLA } = useMemo(() => {
    let green = 0, yellow = 0, red = 0;
    const now = dayjs();
    filteredData.forEach(r => {
      // Check difference in days (ignoring execution status for this strict time metric as per request)
      const diff = now.diff(dayjs(r.workbench_date), 'day', true);
      if (diff < 1.5) green++;
      else if (diff <= 3) yellow++;
      else red++; // Alarm region (> 3 days)
    });
    return { greenSLA: green, yellowSLA: yellow, redSLA: red };
  }, [filteredData]);

  // Charts data (grouped by month for the selected year, ignoring month filter to show full year trend)
  const monthlyData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const aggregation = months.map(m => ({ name: m, weight: 0, volume_weight: 0, places: 0 }));
    
    data.filter(d => dayjs(d.workbench_date).year() === selectedYear).forEach(r => {
       const m = dayjs(r.workbench_date).month();
       aggregation[m].weight += r.weight_total;
       aggregation[m].volume_weight += (r.volume_total || 0) * 167;
       aggregation[m].places += r.places_count;
    });
    return aggregation.map(a => ({ 
      ...a, 
      weight: Math.round(a.weight), 
      volume_weight: Math.round(a.volume_weight) 
    }));
  }, [data, selectedYear]);

  const monthOptions = [
    { value: null, label: 'Все месяцы' },
    ...['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
      .map((m, i) => ({ value: i, label: m }))
  ];

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
              Сводка по объемам, метрикам SLA и выполнению рейсов
            </Typography.Text>
          </Col>
          <Col>
            <Space size="large" align="center">
              <Space>
                <Typography.Text strong style={{ color: 'var(--text-muted)' }}>Фильтры:</Typography.Text>
                <Select 
                  value={selectedYear} 
                  onChange={setSelectedYear} 
                  options={[{value: 2026, label: '2026 год'}, {value: 2027, label: '2027 год'}]} 
                  style={{ width: 120 }} 
                />
                <Select 
                  value={selectedMonth} 
                  onChange={setSelectedMonth} 
                  options={monthOptions} 
                  style={{ width: 150 }} 
                />
              </Space>
              <Button type="primary" size="large" onClick={() => navigate('/planning')} style={{ boxShadow: 'var(--shadow-md)' }}>
                Запустить планирование
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card bordered={false} className="metric-card" style={{ padding: '0 24px' }}>
        <Typography.Title level={5} style={{ marginBottom: 24, paddingLeft: 12 }}>От заказа до бухгалтерии: Жизненный цикл груза</Typography.Title>
        <Steps
           current={1}
           items={[
             {
               title: 'Новые Заказы',
               description: 'Поступают из системы клиента или Excel',
             },
             {
               title: 'Планирование AWB',
               description: 'Сборка грузов, назначение рейса и авианакладной',
             },
             {
               title: 'Исполнение и Трекинг',
               description: 'Сдача на терминал, вылет и мониторинг',
             },
             {
               title: 'Интеграция 1С',
               description: 'Передача актов в бухгалтерию',
             },
           ]}
           className="premium-steps"
        />
      </Card>

      <Row gutter={[16, 16]}>
        {/* KPI Panel */}
        <Col xs={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Ожидают отправки (Без AWB)" value={filteredData.length - totalAWB} prefix={<RefreshCcw size={20} style={{marginRight: 8, color: '#faad14'}}/>} valueStyle={{color: '#faad14', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Оформлено AWB" value={totalAWB} prefix={<FileTextOutlined style={{marginRight: 8, color: '#52c41a'}}/>} valueStyle={{color: '#52c41a', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card">
                <Statistic title="Всего заявок (Пайплайн)" value={filteredData.length} prefix={<PackageOpen size={20} style={{marginRight: 8, color: '#1890ff'}}/>} valueStyle={{fontSize: 28, fontWeight: 'bold', color: '#1890ff'}} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="metric-card" style={{ background: redSLA > 0 ? '#fff1f0' : '#fff' }}>
                <Statistic title="ALARM! (Просрочка SLA > 3 дн)" value={redSLA} prefix={<AlertOctagon size={20} style={{marginRight: 8, color: '#cf1322'}}/>} valueStyle={{color: '#cf1322', fontSize: 28, fontWeight: 'bold'}} />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* SLA Traffic Lights */}
        <Col span={24}>
          <Typography.Title level={5}>Контроль SLA (Дней с момента создания)</Typography.Title>
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
             <div style={{flex: 1, minWidth: 200, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16}}>
               <Statistic title={<span style={{color: '#389e0d'}}>Зеленая зона (&lt; 1.5 дн)</span>} value={greenSLA} valueStyle={{color: '#389e0d', fontWeight: 'bold', fontSize: 32}} />
               <Typography.Text type="secondary" style={{fontSize: 12}}>Отработано вовремя</Typography.Text>
             </div>
             <div style={{flex: 1, minWidth: 200, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: 16}}>
               <Statistic title={<span style={{color: '#d48806'}}>Желтая зона (1.5 - 3 дн)</span>} value={yellowSLA} valueStyle={{color: '#d48806', fontWeight: 'bold', fontSize: 32}} />
               <Typography.Text type="secondary" style={{fontSize: 12}}>Внимание, срок на исходе</Typography.Text>
             </div>
             <div style={{flex: 1, minWidth: 200, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, padding: 16, boxShadow: redSLA > 0 ? '0 0 12px rgba(207,19,34,0.2)' : 'none'}}>
               <Statistic title={<span style={{color: '#cf1322'}}>Красная зона (&gt; 3 дн) ALARM</span>} value={redSLA} valueStyle={{color: '#cf1322', fontWeight: 'bold', fontSize: 32}} />
               <Typography.Text type="secondary" style={{fontSize: 12}}>Требуется срочная отправка</Typography.Text>
             </div>
          </div>
        </Col>

        {/* Two Separate Charts */}
        <Col xs={24} lg={12}>
          <Card 
            className="metric-card" 
            title={`Динамика по весу (кг) - ${selectedYear}`} 
            bordered={false}
            extra={
              <Segmented 
                options={[
                  { label: "Физический вес", value: "physical" },
                  { label: "Объемный вес (vW)", value: "volume" }
                ]}
                value={weightType}
                onChange={(val) => setWeightType(val as "physical" | "volume")}
              />
            }
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey={weightType === "physical" ? "weight" : "volume_weight"} name={weightType === "physical" ? "Физ. Вес (кг)" : "Объемный Вес (vW кг)"} fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card className="metric-card" title={`Динамика по количеству (места) - ${selectedYear}`} bordered={false}>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="places" name="Места" fill="#52c41a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Operational Monitor Table */}
      <Card className="overview-panel" title={<Typography.Title level={4} style={{ margin: 0 }}>Операционный мониторинг</Typography.Title>} bordered={false}>
        <Table
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          className="overview-table"
          onRow={(record) => {
             const diff = dayjs().diff(dayjs(record.workbench_date), 'day', true);
             return {
               onClick: () => navigate(record.awb_number ? '/execution' : '/planning'),
               style: { cursor: 'pointer' },
               className: diff > 3 ? 'overview-row-critical' : record.booking_status === 'confirmed' ? 'overview-row-confirmed' : ''
             };
          }}
          columns={[
            { title: 'Дата создания', dataIndex: 'workbench_date', key: 'date', render: (val) => dayjs(val).format('DD.MM.YYYY') },
            { title: 'Направление', dataIndex: 'direction_code', key: 'direction', render: (text, record) => (<Space direction="vertical" size={0}><Typography.Text strong>{text}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: '12px' }}>{record.direction_name}</Typography.Text></Space>) },
            { title: 'Авианакладная', dataIndex: 'awb_number', key: 'awb', render: (text) => text ? <Typography.Text strong color="#000">{text}</Typography.Text> : <Typography.Text type="secondary">Не назначена</Typography.Text> },
            { title: 'Бронь', dataIndex: 'booking_status', key: 'booking', render: (status: string) => <StatusTag status={status} type="booking" /> },
            { title: 'Исполнение', dataIndex: 'execution_status', key: 'execution', render: (status: string) => <StatusTag status={status} type="execution" /> },
            { title: 'Места', dataIndex: 'places_count', key: 'places_count' },
            { title: 'Вес', dataIndex: 'weight_total', key: 'weight_total' },
            { title: 'SLA', key: 'sla', render: (_, record) => {
                 const diff = dayjs().diff(dayjs(record.workbench_date), 'day', true);
                 let color = '#52c41a';
                 if (diff >= 1.5 && diff <= 3) color = '#faad14';
                 else if (diff > 3) color = '#cf1322';
                 return <Badge color={color} text={`${diff.toFixed(1)} дн.`} style={{fontWeight: diff>3 ? 'bold': 'normal', color: diff>3 ? color: 'inherit'}}/>
            }}
          ]}
        />
      </Card>
    </Space>
  );
}
