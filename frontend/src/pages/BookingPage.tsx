import { Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";

const data = [
  {
    key: 1,
    date: "2026-03-19",
    awb: "555-12345675",
    route: "LED-MOW-KGD",
    agent: "Агент A",
    flight: "SU-012",
    status: "pending",
  },
];

export function BookingPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card className="hero-panel" bordered={false}>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Typography.Text className="hero-eyebrow">BIOCARD booking desk</Typography.Text>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Реестр бронирований и ответов перевозчика
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ maxWidth: 860, marginBottom: 0 }}>
            Единая рабочая зона для подтверждений, отказов и частичных ответов по AWB. Экран держится на белом фоне и говорит
            только о важном.
          </Typography.Paragraph>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">В работе</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              1
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Ожидают ответ</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              1
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Частичные ответы</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              0
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Отказы</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              0
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            className="metric-card"
            title="Реестр бронирований"
            bordered={false}
            extra={
              <Space>
                <Button>Новая бронь</Button>
                <Button type="primary">Отправить запрос</Button>
              </Space>
            }
          >
            <Table
              className="overview-table"
              pagination={false}
              dataSource={data}
              rowClassName={(record) => record.status === 'confirmed' ? 'overview-row-confirmed' : record.status === 'pending' ? 'overview-row-pending' : ''}
              columns={[
                { title: "Дата", dataIndex: "date", key: "date" },
                { title: "AWB", dataIndex: "awb", key: "awb" },
                { title: "Маршрут", dataIndex: "route", key: "route" },
                { title: "Агент", dataIndex: "agent", key: "agent" },
                { title: "Рейс", dataIndex: "flight", key: "flight" },
                {
                  title: "Статус",
                  dataIndex: "status",
                  key: "status",
                  render: (value: string) => <Tag color={value === 'confirmed' ? 'green' : 'gold'}>{value === 'confirmed' ? 'Подтверждено' : 'Ожидает'}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card className="metric-card" title="Карточка бронирования" bordered={false}>
              <Typography.Text type="secondary">
                Здесь будет храниться ответ перевозчика, ответ агента и история изменений.
              </Typography.Text>
            </Card>
            <Card className="metric-card" title="Что важно проверять" bordered={false}>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Typography.Text type="secondary">
                  AWB, агент, рейс, дата и тип ответа должны быть видны без лишних кликов.
                </Typography.Text>
                <Typography.Text type="secondary">
                  В следующем слое мы добавим карточку ответа и ручную фиксацию результата.
                </Typography.Text>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
