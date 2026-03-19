import { Card, Col, Row, Space, Table, Tag, Typography } from "antd";

const data = [
  {
    key: 1,
    flight: "SU-012",
    awb: "555-12345675",
    direction: "LED-MOW",
    planned_places: 14,
    actual_places: 10,
    booking: "partial",
    handover: "handed_over_partial",
    flight_status: "flown_partial",
    remainder: 4,
  },
];

export function ExecutionPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card className="hero-panel" bordered={false}>
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
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">План мест</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              14
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Факт мест</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              10
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Остаток</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              4
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Статус</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="gold">Partial</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="metric-card" title="План против факта" bordered={false}>
            <Table
              dataSource={data}
              pagination={false}
              columns={[
                { title: "Рейс", dataIndex: "flight", key: "flight" },
                { title: "AWB", dataIndex: "awb", key: "awb" },
                { title: "Направление", dataIndex: "direction", key: "direction" },
                { title: "План мест", dataIndex: "planned_places", key: "planned_places" },
                { title: "Факт мест", dataIndex: "actual_places", key: "actual_places" },
                { title: "Бронь", dataIndex: "booking", key: "booking", render: (value: string) => <Tag color="gold">{value}</Tag> },
                { title: "Сдача", dataIndex: "handover", key: "handover" },
                { title: "Факт вылета", dataIndex: "flight_status", key: "flight_status" },
                { title: "Остаток", dataIndex: "remainder", key: "remainder" },
              ]}
            />
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
