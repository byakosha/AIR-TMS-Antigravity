import { useState } from "react";
import { Card, Col, Row, Space, Table, Tag, Typography, Input, message, Spin } from "antd";

interface ExecutionOrder {
  flight: string;
  awb: string;
  direction: string;
  planned_places: number;
  actual_places: number;
  booking: string;
  handover: string;
  flight_status: string;
  remainder: number;
  [key: string]: any;
}

export function ExecutionPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExecutionOrder[]>([]);
  const [summary, setSummary] = useState({
    planned: 0,
    actual: 0,
    remainder: 0,
    status: "",
  });

  const handleSearch = async (aviaTn: string) => {
    if (!aviaTn.trim()) {
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`/external-api/orders/${aviaTn.trim()}`);
      if (!resp.ok) {
        if (resp.status === 404) {
          throw new Error("Заказ не найден (404)");
        }
        throw new Error(`Ошибка API: ${resp.status}`);
      }
      const result = await resp.json();
      
      // Map API response to our table format. Using fallback default names if the API response structure differs exactly.
      const mappedResult: ExecutionOrder = {
        key: result.id || result.awb || aviaTn,
        flight: result.flight || result.planned_flight_number || "—",
        awb: result.awb || result.avia_tn || aviaTn,
        direction: result.direction || result.route || "—",
        planned_places: result.planned_places || result.places_count || 0,
        actual_places: result.actual_places || result.accepted_places || 0,
        booking: result.booking || result.booking_status || "pending",
        handover: result.handover || result.handover_status || "not_handed_over",
        flight_status: result.flight_status || result.execution_status || "not_flown",
        remainder: result.remainder !== undefined ? result.remainder : (result.planned_places - result.actual_places) || 0,
      };

      setData([mappedResult]);
      setSummary({
        planned: mappedResult.planned_places,
        actual: mappedResult.actual_places,
        remainder: mappedResult.remainder,
        status: mappedResult.flight_status,
      });
      message.success("Данные успешно загружены");
    } catch (err: any) {
      message.error(err.message || "Не удалось загрузить данные с внешнего API");
      setData([]);
      setSummary({ planned: 0, actual: 0, remainder: 0, status: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card className="hero-panel" bordered={false}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <Typography.Text className="hero-eyebrow">BIOCARD execution console</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>
                План против факта по брони, сдаче и вылету
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ maxWidth: 860, marginBottom: 0 }}>
                Экран контроля исполнения показывает, где план подтвердился, где произошел частичный вылет и какие остатки нужно
                перенести дальше.
              </Typography.Paragraph>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
             <Input.Search
                placeholder="Введите номер AWB (avia_tn) для загрузки данных"
                enterButton="Найти заказ"
                size="large"
                onSearch={handleSearch}
                loading={loading}
              />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">План мест</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {summary.planned}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Факт мест</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {summary.actual}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Остаток</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {summary.remainder}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Статус</Typography.Text>
            <div style={{ marginTop: 8 }}>
              {summary.status ? <Tag color="orange">{summary.status}</Tag> : <Typography.Text type="secondary">—</Typography.Text>}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="metric-card" title="План против факта" bordered={false}>
            <Spin spinning={loading}>
              <Table
                className="overview-table"
                dataSource={data}
                pagination={false}
                locale={{ emptyText: "Введите номер AWB для поиска заказа" }}
                rowClassName={(record: any) => record.booking === 'confirmed' ? 'overview-row-confirmed' : record.booking === 'pending' ? 'overview-row-pending' : record.flight_status === 'flown_partial' ? 'overview-row-critical' : ''}
                columns={[
                  { title: "Рейс", dataIndex: "flight", key: "flight" },
                  { title: "AWB", dataIndex: "awb", key: "awb" },
                  { title: "Направление", dataIndex: "direction", key: "direction" },
                  { title: "План мест", dataIndex: "planned_places", key: "planned_places" },
                  { title: "Факт мест", dataIndex: "actual_places", key: "actual_places" },
                  { title: "Бронь", dataIndex: "booking", key: "booking", render: (val: string) => <Tag color="green">{val === 'confirmed' ? 'Подтверждено' : val}</Tag> },
                  { title: "Сдача", dataIndex: "handover", key: "handover", render: (val: string) => <Tag color="orange">{val === 'handed_over_partial' ? 'Сдано частично' : val}</Tag> },
                  { title: "Факт вылета", dataIndex: "flight_status", key: "flight_status", render: (val: string) => <Tag color="orange">{val === 'flown_partial' ? 'Вылетело частично' : val}</Tag> },
                  { title: "Остаток", dataIndex: "remainder", key: "remainder" },
                ]}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="metric-card" title="Карта отклонений" bordered={false}>
            <Typography.Text type="secondary">
              Здесь мы соберем перенос остатка, частичный вылет и аудит исполнения.
            </Typography.Text>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
