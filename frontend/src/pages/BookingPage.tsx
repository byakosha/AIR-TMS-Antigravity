import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Space, Table, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import { fetchWorkbenchRows, type WorkbenchRow } from "../api";
import { StatusTag, bookingLabels } from "../uiUtils";

export function BookingPage() {
  const [data, setData] = useState<WorkbenchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rows = await fetchWorkbenchRows({ });
        // Assume booking desk works with rows that need booking or have awb
        const bookings = rows.filter(r => r.awb_number || r.booking_status !== 'draft');
        setData(bookings);
      } catch (err) {
        message.error("Не удалось загрузить реестр бронирований");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalInWork = data.filter(d => ['pending', 'draft'].includes(d.booking_status)).length;
  const waitingAnswer = data.filter(d => d.booking_status === 'pending').length;
  const partialAnswer = data.filter(d => d.booking_status === 'partial').length;
  const refused = data.filter(d => d.execution_status === 'not_flown' || d.booking_status === 'postponed').length;

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
              {totalInWork}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Ожидают ответ</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {waitingAnswer}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Частичные ответы</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {partialAnswer}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card" bordered={false}>
            <Typography.Text type="secondary">Отказы / Не улетели</Typography.Text>
            <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
              {refused}
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
              loading={loading}
              pagination={false}
              dataSource={data}
              rowKey="id"
              rowClassName={(record) => record.booking_status === 'confirmed' ? 'overview-row-confirmed' : record.booking_status === 'pending' ? 'overview-row-pending' : ''}
              columns={[
                { title: "Дата", dataIndex: "workbench_date", key: "date", render: (val) => val ? dayjs(val).format('YYYY-MM-DD') : '—' },
                { title: "AWB", dataIndex: "awb_number", key: "awb", render: (val) => val ?? '—' },
                { title: "Маршрут", dataIndex: "direction_code", key: "route" },
                { title: "Клиент", dataIndex: "client_name", key: "client", render: (val) => val ?? '—' },
                { title: "Рейс", dataIndex: "planned_flight_number", key: "flight", render: (val) => val ?? '—' },
                {
                  title: "Статус",
                  dataIndex: "booking_status",
                  key: "status",
                  render: (value: string) => <StatusTag status={value} type="booking" />,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card className="metric-card" title="Карточка бронирования" bordered={false}>
              <Typography.Text type="secondary">
                Здесь будет храниться ответ перевозчика, ответ агента и история изменений. Выберите строку слева.
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
