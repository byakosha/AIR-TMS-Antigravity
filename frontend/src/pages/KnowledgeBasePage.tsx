import { Space, Typography, Card, Collapse, Row, Col } from "antd";
import { BookOpen, Info, HelpCircle } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

export function KnowledgeBasePage() {
  const items = [
    {
      key: '1',
      label: <span style={{ fontWeight: 600 }}>Как работает Авто-планировщик (Planning Engine)?</span>,
      children: (
        <Space direction="vertical">
          <Paragraph>
            Алгоритм запускается по кнопке <b>"Спланировать"</b> на вкладке Планирование.
          </Paragraph>
          <Paragraph>
            1. Бэкенд находит все заявки в статусе <Text code>pending</Text> без привязанного номера накладной.
            <br />
            2. Группирует их по ключу: <Text strong>Аэропорт + Температурный режим + Тип груза</Text>.
            <br />
            3. Для каждой группы ищет правило (Supply Chain Rule) в <b>Матрице цепочек поставок</b>.
            <br />
            4. Если правило найдено, берет закрепленную Авиакомпанию и извлекает из пула бланков <i>следующий свободный номер AWB</i>.
            <br />
            5. Номер резервируется (с учетом +1 и контрольного числа % 7), и всем грузам этой группы присваивается эта накладная.
          </Paragraph>
        </Space>
      ),
    },
    {
      key: '2',
      label: <span style={{ fontWeight: 600 }}>Жизненный цикл груза (SLA & Статусы)</span>,
      children: (
        <Space direction="vertical">
          <Paragraph>У каждой заявки есть два основных измерения: Бронь (Booking) и Исполнение (Execution).</Paragraph>
          <ul>
            <li><b>draft:</b> Заявка только загружена, с ней никто не работал.</li>
            <li><b>pending:</b> В процессе планирования, ожидает подбора рейса.</li>
            <li><b>confirmed:</b> Рейс подтвержден (вручную или через парсер авиакомпании).</li>
            <li><b>executed:</b> Груз фактически улетел.</li>
          </ul>
          <Paragraph>
            В разделе Дашборды (Analytics) реализован светофор SLA (<b>Service Level Agreement</b>):
            <br/>
            🟢 Зеленый: прошло меньше 1.5 дней с момента создания заявки.
            <br/>
            🟡 Желтый: от 1.5 до 3 дней.
            <br/>
            🔴 Красный (Alarm): <b>Более 3 дней!</b> Груз требует немедленного вмешательства.
          </Paragraph>
        </Space>
      ),
    },
    {
      key: '3',
      label: <span style={{ fontWeight: 600 }}>Загрузка реестра (Excel/CSV парсер)</span>,
      children: (
        <Space direction="vertical">
          <Paragraph>
            До тех пор, пока интеграция с 1С via Webhooks не работает автоматически, используйте загрузку файлов <b>Импорт реестра (CSV)</b>.
          </Paragraph>
          <Paragraph>
            Формат загрузки строго зафиксирован (<b>;</b> как разделитель):
            <br/>
            <Text code>Направление;Аэропорт;Места;Вес;Объем;Температура;Груз;Тара;Клиент</Text>
          </Paragraph>
        </Space>
      ),
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Header section */}
      <div className="premium-hero" style={{ padding: "40px", borderRadius: "12px", background: "#ffffff", border: "1px solid #f0f0f0" }}>
        <Space align="center" size="middle">
          <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '50%', display: 'flex' }}>
            <BookOpen size={32} color="#1890ff" />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>База знаний (Knowledge Base)</Title>
            <Text style={{ fontSize: 16, color: "var(--text-muted)" }}>Инструкции, глоссарий и регламенты для диспетчеров и логистов.</Text>
          </div>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} title={<><Info size={18} style={{marginRight: 8, transform: 'translateY(3px)'}} /> Основные регламенты</>}>
            <Collapse items={items} defaultActiveKey={['1']} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false} title={<><HelpCircle size={18} style={{marginRight: 8, transform: 'translateY(3px)'}} /> Быстрая помощь</>} style={{ background: '#fafafa' }}>
            <Paragraph>
              <b>Служба поддержки:</b>
              <br />
              Внутренний портал IT (Сервис Деск).
            </Paragraph>
            <Paragraph>
              <b>Архивные накладные:</b>
              <br />
              Накладные хранятся в системе <b>более 1 года</b>. Для доступа к старым накладным используйте выгрузку CSV, так как дашборды показывают агрегированную информацию по датам в целях высокой производительности базы данных.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
