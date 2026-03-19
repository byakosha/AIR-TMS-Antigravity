import { useState } from "react";
import { Card, Col, Row, Space, Table, Typography, Input, message, Spin, Timeline, Progress, Divider, Statistic, Avatar } from "antd";
import { Plane, PackageCheck, AlertTriangle, ArrowRight, UploadCloud, TrendingUp, CheckCircle2, Search, PlaneTakeoff } from "lucide-react";
import { StatusTag, bookingLabels, executionLabels } from "../uiUtils";

interface ExecutionOrder {
  key: string;
  flight: string;
  awb: string;
  direction: string;
  planned_places: number;
  actual_places: number;
  booking: string;
  handover: string;
  flight_status: string;
  remainder: number;
}

const mockAuditLogs = [
  { time: "10:30", action: "Груз принят на складе", status: "success", user: "Иванов И." },
  { time: "13:15", action: "Сборка AWB завершена", status: "success", user: "Петров А." },
  { time: "16:45", action: "Зафиксировано отклонение по весу (Факт < План)", status: "warning", user: "Сидоров В." },
  { time: "18:00", action: "Сдача груза в терминал (Частично)", status: "warning", user: "Смирнов К." },
];

export function ExecutionPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExecutionOrder[]>([]);
  const [summary, setSummary] = useState({
    planned: 0,
    actual: 0,
    remainder: 0,
    status: "",
    handover: ""
  });

  const handleSearch = async (aviaTn: string) => {
    if (!aviaTn.trim()) return;
    setLoading(true);
    try {
      // Simulate API Call for Premium Demo
      await new Promise((res) => setTimeout(res, 800));
      
      const mappedResult: ExecutionOrder = {
        key: aviaTn,
        flight: "SU-1730",
        awb: aviaTn,
        direction: "MOW-VVO",
        planned_places: 120,
        actual_places: 110,
        booking: "confirmed",
        handover: "handed_over_partial",
        flight_status: "flown_partial",
        remainder: 10,
      };

      setData([mappedResult]);
      setSummary({
        planned: mappedResult.planned_places,
        actual: mappedResult.actual_places,
        remainder: mappedResult.remainder,
        status: mappedResult.flight_status,
        handover: mappedResult.handover,
      });
      message.success("Данные телеметрии успешно загружены");
    } catch {
      message.error("Не удалось загрузить данные");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Premium Luxury Hero Panel */}
      <div className="premium-hero" style={{ padding: "40px" }}>
        <Row justify="space-between" align="middle" gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plane color="var(--primary)" size={16} />
                <Typography.Text style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 11 }}>
                  Logistics Command Center
                </Typography.Text>
              </div>
              <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>
                Исполнение рейсов и Контроль отклонений
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                Отслеживайте план/факт отгрузок в реальном времени. Введите номер AWB для получения телеметрии и аудита маршрута.
              </Typography.Text>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <div style={{ padding: 4 }}>
              <Input.Search
                placeholder="Поиск по AWB (напр. 555-12345675)"
                enterButton="Трекинг"
                size="large"
                onSearch={handleSearch}
                loading={loading}
                style={{ boxShadow: 'var(--shadow-md)', borderRadius: 8 }}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* Analytics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: 24 }}>
            <Statistic 
              title="Запланировано мест" 
              value={summary.planned} 
              prefix={<PackageCheck size={20} color="#8c1c24" style={{ marginRight: 8 }}/>} 
              valueStyle={{ fontSize: 28, fontWeight: 600 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: 24 }}>
            <Statistic 
              title="Фактически принято" 
              value={summary.actual} 
              prefix={<CheckCircle2 size={20} color={summary.actual < summary.planned ? "#faad14" : "#52c41a"} style={{ marginRight: 8 }}/>} 
              valueStyle={{ fontSize: 28, fontWeight: 600, color: summary.actual > 0 && summary.actual < summary.planned ? '#d48806' : '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: 24, background: summary.remainder > 0 ? '#fffbe6' : '#fff' }}>
            <Statistic 
              title="Остаток к переносу" 
              value={summary.remainder} 
              prefix={<ArrowRight size={20} color="#cf1322" style={{ marginRight: 8 }}/>} 
              valueStyle={{ fontSize: 28, fontWeight: 600, color: '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: 24 }}>
             <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Операционный статус</Typography.Text>
             <Space direction="vertical" size={12}>
               {summary.status ? <StatusTag status={summary.status} type="execution" /> : <Typography.Text type="secondary">—</Typography.Text>}
               {summary.handover ? <StatusTag status={summary.handover} type="handover" /> : null}
             </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Main Table Area */}
        <Col xs={24} xl={15}>
          <Card 
            className="overview-panel" 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>Реестр исполнения рейсов</Typography.Title>
                <Input.Search placeholder="Поиск в реестре (Рейс, AWB)..." style={{ maxWidth: 280 }} />
              </div>
            } 
            bordered={false}
          >
            <Spin spinning={loading}>
              <Table
                className="overview-table"
                dataSource={data}
                pagination={{ pageSize: 10 }}
                rowKey="awb"
                locale={{ emptyText: (
                  <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                    <Search color="var(--text-muted)" size={48} style={{ marginBottom: 16 }} />
                    <Typography.Paragraph>Введите номер AWB в верхнюю строку поиска для трекинга</Typography.Paragraph>
                  </div>
                )}}
                columns={[
                  { title: "Рейс", dataIndex: "flight", key: "flight", render: text => <Space><PlaneTakeoff size={14} color="var(--primary)"/><Typography.Text strong>{text}</Typography.Text></Space> },
                  { title: "AWB", dataIndex: "awb", key: "awb", render: text => <Typography.Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</Typography.Text> },
                  { title: "Направление", dataIndex: "direction", key: "direction" },
                  { title: "План", dataIndex: "planned_places", key: "planned_places", render: val => <Typography.Text strong>{val}</Typography.Text> },
                  { title: "Факт", dataIndex: "actual_places", key: "actual_places", render: val => <Typography.Text strong color="var(--primary)">{val}</Typography.Text> },
                  { title: "Бронь", dataIndex: "booking", key: "booking", render: (val: string) => <StatusTag status={val} type="booking" /> },
                  { title: "Сдача", dataIndex: "handover", key: "handover", render: (val: string) => <StatusTag status={val} type="handover" /> },
                  { title: "Вылет", dataIndex: "flight_status", key: "flight_status", render: (val: string) => <StatusTag status={val} type="execution" /> },
                ]}
              />
            </Spin>
          </Card>
        </Col>

        {/* Killer Feature: Deviation Map & Logistic Timeline */}
        <Col xs={24} xl={9}>
          <Card className="metric-card" title={<Space><TrendingUp color="#8c1c24"/><Typography.Title level={4} style={{ margin: 0 }}>Интеллектуальный трекинг</Typography.Title></Space>} bordered={false} style={{ height: '100%' }}>
            {data.length > 0 ? (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ background: '#f8fbff', borderRadius: 8, padding: 16, marginBottom: 24, border: '1px solid #dce7f5'}}>
                   <Space align="start">
                     <AlertTriangle color="#faad14" size={24} />
                     <div>
                       <Typography.Text strong style={{display: 'block'}}>Выявлено частичное исполнение</Typography.Text>
                       <Typography.Text type="secondary" style={{fontSize: 13}}>Остаток <b>{summary.remainder} мест</b> автоматически помещен в очередь планирования для переноса на следующий доступный рейс.</Typography.Text>
                     </div>
                   </Space>
                </div>

                <Typography.Title level={5} style={{ marginBottom: 16 }}>Журнал аудита операций</Typography.Title>
                <Timeline>
                  {mockAuditLogs.map((log, index) => (
                    <Timeline.Item 
                      key={index} 
                      color={log.status === 'warning' ? 'orange' : log.status === 'success' ? 'green' : 'blue'}
                    >
                      <Space direction="vertical" size={0}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text strong>{log.action}</Typography.Text>
                          <Typography.Text type="secondary" style={{fontSize: 12}}>{log.time}</Typography.Text>
                        </div>
                        <Space size={4} style={{ marginTop: 4 }}>
                           <Avatar size={16} style={{ backgroundColor: '#8c1c24' }}>{log.user[0]}</Avatar>
                           <Typography.Text type="secondary" style={{fontSize: 12}}>{log.user}</Typography.Text>
                        </Space>
                      </Space>
                    </Timeline.Item>
                  ))}
                  <Timeline.Item color="gray">
                    <Typography.Text type="secondary">Ожидание финального прибытия...</Typography.Text>
                  </Timeline.Item>
                </Timeline>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                <UploadCloud size={48} />
                <Typography.Paragraph style={{ marginTop: 16 }}>
                  Здесь появится хронология аудита, автоматический анализ отклонений и трекинг исполнения после поиска AWB.
                </Typography.Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
