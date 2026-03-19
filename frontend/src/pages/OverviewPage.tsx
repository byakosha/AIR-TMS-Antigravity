import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Row, Space, Tag, Timeline, Typography, message } from "antd";

import { fetchOverviewSummary, type OverviewSummary } from "../api";

const fallbackSummary: OverviewSummary = {
  hero_stats: [
    { label: "Строк в манифесте", value: "8", note: "активные рабочие строки" },
    { label: "AWB привязано", value: "4", note: "строки с номером авианакладной" },
    { label: "Рейсы в контуре", value: "6", note: "плановые flight records" },
    { label: "Пользователи", value: "4", note: "активные учетные записи" },
  ],
  pipeline: [
    { label: "1С TMS", value: "12", subtitle: "исходные заказы и манифесты", accent: "blue" },
    { label: "Планирование", value: "8", subtitle: "рабочие строки и AWB", accent: "gold" },
    { label: "Исполнение", value: "3", subtitle: "частичные вылеты и отклонения", accent: "green" },
    { label: "Доступ", value: "4", subtitle: "роли и активные аккаунты", accent: "purple" },
  ],
  alerts: [
    { title: "Есть строки без AWB", description: "4 строки еще ждут ручного присвоения авианакладной.", severity: "warning" },
    { title: "Ожидают ответ по брони", description: "3 строки пока в статусе pending/draft.", severity: "info" },
    { title: "Частичное исполнение", description: "2 строки уже ушли частично и требуют контроля остатка.", severity: "critical" },
  ],
  snapshots: [
    {
      direction_code: "MOW-SVO",
      direction_name: "Moscow - Sheremetyevo",
      airport_code: "SVO",
      temperature_mode: "+2..+8",
      booking_status: "pending",
      handover_status: "not_handed_over",
      execution_status: "pending",
      awb_number: "555-12345675",
      planned_flight_number: "SU-012",
      places_count: 14,
      weight_total: 120.5,
    },
    {
      direction_code: "MOW-VKO",
      direction_name: "Moscow - Vnukovo",
      airport_code: "VKO",
      temperature_mode: "-20",
      booking_status: "confirmed",
      handover_status: "handed_over_partial",
      execution_status: "flown_partial",
      awb_number: null,
      planned_flight_number: "SU-123",
      places_count: 9,
      weight_total: 86,
    },
  ],
  operational_notes: [
    "Логика потока уже опирается на реальные статусы workbench.",
    "Критичные случаи лучше видеть в начале экрана, а не в списке ниже.",
    "Пользователи и доступ теперь живут в системе, а не в текстовой заглушке.",
  ],
};

const bookingColor: Record<string, string> = {
  pending: "gold",
  draft: "default",
  confirmed: "green",
  partial: "orange",
  fixed: "blue",
};

const executionColor: Record<string, string> = {
  pending: "default",
  flown_full: "green",
  flown_partial: "orange",
  not_flown: "red",
  postponed: "volcano",
};

export function OverviewPage() {
  const [summary, setSummary] = useState<OverviewSummary>(fallbackSummary);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetchOverviewSummary()
      .then((data) => {
        if (active) {
          setSummary(data);
        }
      })
      .catch(() => {
        message.warning("Не удалось загрузить обзор с backend, показан локальный fallback.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const heroValue = useMemo(() => summary.hero_stats[0]?.value ?? "0", [summary.hero_stats]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card className="overview-hero" bordered={false} loading={loading}>
        <div className="overview-hero-grid">
          <div className="overview-hero-copy">
            <Typography.Text className="hero-eyebrow">BIOCARD operational cockpit</Typography.Text>
            <Typography.Title level={2} style={{ margin: "8px 0 8px" }}>
              Управление авиационным этапом, бронированием и исполнением в одном рабочем месте
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 860, marginBottom: 20 }}>
              Единый обзор показывает поток сегодняшнего дня: где план, где бронь, где частичное исполнение и где нужно вмешательство
              диспетчера.
            </Typography.Paragraph>

            <Space wrap className="overview-actions">
              <Button type="primary" onClick={() => navigate('/planning')}>Открыть планирование</Button>
              <Button onClick={() => navigate('/execution')}>Перейти к исполнению</Button>
            </Space>
          </div>

          <div className="overview-hero-brief">
            <div className="overview-hero-brief-card">
              <Typography.Text type="secondary">Сегодня в работе</Typography.Text>
              <Typography.Title level={2} style={{ margin: "6px 0 0" }}>
                {heroValue}
              </Typography.Title>
              <Typography.Text type="secondary">строк на рабочем столе</Typography.Text>
            </div>
            <div className="overview-hero-brief-card">
              <Typography.Text type="secondary">Фокус смены</Typography.Text>
              <Typography.Text strong>AWB · Booking · Execution</Typography.Text>
            </div>
            <div className="overview-hero-brief-card overview-hero-brief-card-muted">
              <Typography.Text type="secondary">Смысл экрана</Typography.Text>
              <Typography.Text>
                Сразу видеть поток, а не читать длинные списки.
              </Typography.Text>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {summary.hero_stats.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.label}>
            <Card className="metric-card overview-metric-card" bordered={false}>
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <Typography.Title level={3} style={{ margin: "6px 0 2px" }}>
                {item.value}
              </Typography.Title>
              <Typography.Text className="overview-metric-note">{item.note}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {summary.pipeline.map((stage) => (
          <Col xs={24} sm={12} xl={6} key={stage.label}>
            <Card className={`overview-stage overview-stage-${stage.accent}`} bordered={false}>
              <Typography.Text type="secondary">{stage.label}</Typography.Text>
              <Typography.Title level={2} style={{ margin: "6px 0 4px" }}>
                {stage.value}
              </Typography.Title>
              <Typography.Text className="overview-stage-note">{stage.subtitle}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card className="overview-panel" title="Операционный поток" bordered={false}>
            <Timeline
              className="overview-timeline"
              items={[
                { color: "green", children: "Заказы загружены из 1С TMS и разложены по направлениям" },
                { color: "blue", children: "Рабочий манифест обновлен и отфильтрован" },
                { color: "orange", children: "Часть AWB ждет подтверждения по брони" },
                { color: "red", children: "Есть частичное исполнение и остатки для переноса" },
              ]}
            />

            <div className="overview-snapshot-grid">
              {(summary.snapshots.length > 0 ? summary.snapshots : fallbackSummary.snapshots).map((snapshot) => (
                <div className="overview-snapshot-card" key={`${snapshot.direction_code}-${snapshot.airport_code}`}>
                  <div className="overview-snapshot-head">
                    <div>
                      <Typography.Text strong>{snapshot.direction_code}</Typography.Text>
                      <Typography.Text type="secondary" className="overview-snapshot-subtitle">
                        {snapshot.direction_name}
                      </Typography.Text>
                    </div>
                    <Tag>{snapshot.airport_code}</Tag>
                  </div>

                  <div className="overview-snapshot-tags">
                    <Tag color="blue">{snapshot.temperature_mode}</Tag>
                    <Tag color={bookingColor[snapshot.booking_status] ?? "default"}>{snapshot.booking_status}</Tag>
                    <Tag color={executionColor[snapshot.execution_status] ?? "default"}>{snapshot.execution_status}</Tag>
                  </div>

                  <div className="overview-snapshot-meta">
                    <span>{snapshot.awb_number ?? "AWB не задан"}</span>
                    <span>{snapshot.planned_flight_number ?? "Рейс не задан"}</span>
                    <span>{snapshot.places_count} мест / {snapshot.weight_total.toFixed(1)} кг</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card className="overview-panel" title="Сигналы" bordered={false}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {summary.alerts.map((alertItem) => (
                  <Alert
                    key={alertItem.title}
                    type={alertItem.severity === "critical" ? "error" : alertItem.severity === "success" ? "success" : "info"}
                    message={alertItem.title}
                    description={alertItem.description}
                    showIcon
                  />
                ))}
              </Space>
            </Card>

            <Card className="overview-panel" title="Что важно держать в голове" bordered={false}>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {summary.operational_notes.map((note) => (
                  <div className="overview-note" key={note}>
                    <span className="overview-note-dot" />
                    <Typography.Text>{note}</Typography.Text>
                  </div>
                ))}
              </Space>
            </Card>

            <Card className="overview-panel" title="Быстрые переходы" bordered={false}>
              <Space wrap>
                <Tag color="blue" style={{cursor: 'pointer'}} onClick={() => navigate('/planning')}>Planning</Tag>
                <Tag color="green" style={{cursor: 'pointer'}} onClick={() => navigate('/execution')}>Execution</Tag>
                <Tag color="gold" style={{cursor: 'pointer'}} onClick={() => navigate('/booking')}>Booking</Tag>
                <Tag color="purple" style={{cursor: 'pointer'}} onClick={() => navigate('/settings')}>Settings</Tag>
                <Tag color="default" style={{cursor: 'pointer'}} onClick={() => navigate('/knowledge-base')}>Knowledge</Tag>
              </Space>
              <Button type="primary" block style={{ marginTop: 16 }} onClick={() => navigate('/planning')}>
                Открыть рабочий манифест
              </Button>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
