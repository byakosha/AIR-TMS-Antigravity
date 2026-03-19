import { useState } from "react";
import { Card, Col, Input, List, Modal, Row, Space, Tag, Typography } from "antd";

const knowledgeSections = [
  {
    key: "directories",
    title: "Справочники и коды",
    subtitle: "Базовые каталоги, которые дают системе единый язык данных",
    accent: "blue",
    articles: [
      { title: "Коды аэропортов и московские направления", description: "Как читать сокращения, отображать IATA и не путать направление с аэропортом.", text: "Аэропорты обозначаются 3-буквенными кодами IATA (SVO, VKO, DME). Особое внимание стоит уделить направлениям Москва (MOW), так как грузы могут распределяться между разными аэропортами узла." },
      { title: "Список направлений", description: "Правила отображения направлений в фильтрах.", text: "Фильтры по направлениям применяются строго по коду IATA пункта назначения. Мультиплеерные рейсы отображаются по финальной точке." },
    ],
  },
  {
    key: "temperature",
    title: "Температуры и упаковка",
    subtitle: "Медлогистика, контроль температуры и режимы",
    accent: "green",
    articles: [
      { title: "Температурные режимы", description: "Справочник режимов для карточек.", text: "+2..+8: Фарма. +15..+25: Общий мед.режим. -20: Глубокая заморозка. -70: Сухой лед. Требуется строгая проверка IATA DGR." },
      { title: "Совместимость грузов", description: "Что можно смешивать в одной группе.", text: "Категорически запрещено оформлять грузы +2..+8 и +15..+25 в одной AWB без явного разрешения заказчика." },
    ],
  },
  {
    key: "planning",
    title: "AWB и планирование",
    subtitle: "Рабочий манифест и split / merge",
    accent: "gold",
    articles: [
      { title: "Жизненный цикл AWB", description: "От создания до фиксации.", text: "1. Драфт (создана AWB). 2. Plan (привязаны строки). 3. Фиксация (готовность к отправке на склад)." },
      { title: "Split и merge", description: "Деление строк на части.", text: "Сплит используется, когда количество мест не помещается на рейс. Мердж обратен сплиту." },
    ],
  },
];

export function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<{title: string, text: string} | null>(null);

  const filtered = search.trim() 
    ? knowledgeSections.map(s => ({
        ...s,
        articles: s.articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
      })).filter(s => s.articles.length > 0)
    : knowledgeSections;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Premium Luxury Hero */}
      <div className="premium-hero" style={{ padding: "40px" }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>
          База знаний
        </Typography.Title>
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          Структурированный справочный центр. Нажмите на любую статью, чтобы открыть подробное руководство.
        </Typography.Text>
        <div style={{ marginTop: 24, padding: 4 }}>
          <Input.Search
            allowClear
            size="large"
            placeholder="Найти правило, сокращение или статус..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 600, boxShadow: 'var(--shadow-md)', borderRadius: 8 }}
          />
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {filtered.map(section => (
          <Col xs={24} lg={12} key={section.key}>
            <Card title={section.title} bordered={false} style={{ height: '100%', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}>
              <div style={{ padding: '0 24px 16px', color: 'var(--text-muted)' }}>{section.subtitle}</div>
              <List
                dataSource={section.articles}
                renderItem={(article) => (
                  <List.Item 
                    onClick={() => setSelectedArticle({ title: article.title, text: article.text })}
                    style={{ padding: '16px 24px', cursor: 'pointer', transition: 'all 0.2s', borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <List.Item.Meta
                      title={<Typography.Text strong style={{ color: 'var(--primary)', fontSize: 15 }}>{article.title}</Typography.Text>}
                      description={article.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal 
        title={<Typography.Title level={4} style={{margin: 0}}>{selectedArticle?.title}</Typography.Title>}
        open={!!selectedArticle} 
        onCancel={() => setSelectedArticle(null)}
        footer={[<Button key="close" type="primary" onClick={() => setSelectedArticle(null)}>Понятно</Button>]}
        width={700}
      >
        <div style={{ padding: '16px 0', fontSize: 15, lineHeight: 1.6, color: 'var(--text-main)' }}>
          {selectedArticle?.text}
        </div>
        <div style={{ marginTop: 24, padding: 16, background: '#f8fbff', borderRadius: 8, border: '1px solid #dce7f5' }}>
          <Typography.Text type="secondary" style={{fontSize: 13}}>Информация актуальна. Если вы нашли неточность, обратитесь к администратору.</Typography.Text>
        </div>
      </Modal>
    </Space>
  );
}
