import { useMemo, useState } from "react";
import { Button, Card, Col, Empty, Input, Row, Space, Tag, Typography } from "antd";

type KnowledgeArticle = {
  title: string;
  description: string;
  updated: string;
  readTime: string;
};

type KnowledgeSection = {
  key: string;
  title: string;
  subtitle: string;
  accent: "blue" | "green" | "gold" | "purple";
  summary: string;
  articles: KnowledgeArticle[];
};

const knowledgeSections: KnowledgeSection[] = [
  {
    key: "directories",
    title: "Справочники и коды",
    subtitle: "Базовые каталоги, которые дают системе единый язык данных",
    accent: "blue",
    summary: "Аэропорты, направления, авиакомпании, агенты и другие master data, на которых строится весь рабочий процесс.",
    articles: [
      { title: "Коды аэропортов и московские направления", description: "Как читать сокращения, отображать IATA и не путать направление с аэропортом.", updated: "Сегодня", readTime: "4 мин" },
      { title: "Список направлений для планирования", description: "Правила отображения направлений в фильтрах и в рабочем манифесте.", updated: "Вчера", readTime: "6 мин" },
      { title: "Авиакомпании, агенты и соглашения", description: "Базовая структура справочников и что важно держать актуальным.", updated: "На неделе", readTime: "5 мин" },
    ],
  },
  {
    key: "temperature",
    title: "Температуры и упаковка",
    subtitle: "Медлогистика, контроль температуры и специальные режимы",
    accent: "green",
    summary: "Режимы +2..+8, +8, +15, +15..+25, +25, -20, -70 и без контроля температуры должны читаться одинаково понятно.",
    articles: [
      { title: "Температурные режимы", description: "Справочник режимов и человекочитаемые названия для фильтров и карточек.", updated: "Сегодня", readTime: "3 мин" },
      { title: "Совместимость грузов", description: "Что можно смешивать в одной группе, а что нужно разделять в разные AWB.", updated: "Вчера", readTime: "7 мин" },
      { title: "Упаковка и тары", description: "Coolbox, dry ice, deep freeze и особые требования к оформлению.", updated: "На неделе", readTime: "5 мин" },
    ],
  },
  {
    key: "planning",
    title: "AWB и планирование",
    subtitle: "Рабочий манифест диспетчера, split / merge и ручное решение",
    accent: "gold",
    summary: "Как создавать авианакладные, делить строки, фиксировать план и держать процесс под контролем без Excel.",
    articles: [
      { title: "Жизненный цикл AWB", description: "От создания до фиксации, подтверждения и передачи в исполнение.", updated: "Сегодня", readTime: "6 мин" },
      { title: "Split и merge", description: "Когда дробить строку, когда объединять и как не потерять контекст.", updated: "Сегодня", readTime: "4 мин" },
      { title: "Фиксация плана", description: "Правила, предупреждения и блокирующие условия перед фиксацией.", updated: "Вчера", readTime: "5 мин" },
    ],
  },
  {
    key: "execution",
    title: "Бронирование и исполнение",
    subtitle: "Статусы брони, сдачи и факта вылета",
    accent: "purple",
    summary: "Поток от бронирования к сдаче и вылету, включая частичные ответы и переносы остатков.",
    articles: [
      { title: "Статусы бронирования", description: "confirmed, rejected, pending, partial и их операционный смысл.", updated: "Сегодня", readTime: "4 мин" },
      { title: "Факт вылета", description: "Как отмечать flown_full, flown_partial, not_flown и postponed.", updated: "Вчера", readTime: "5 мин" },
      { title: "Отклонения исполнения", description: "Перенос остатка, частичный вылет и журнал отклонений.", updated: "На неделе", readTime: "6 мин" },
    ],
  },
];

const quickPaths = [
  "Температуры",
  "Аэропорты",
  "AWB",
  "Бронирование",
  "Исполнение",
  "Split / merge",
];

const featuredItems = [
  { label: "Быстрый старт", value: "Как найти нужный материал за 10 секунд" },
  { label: "Частые правки", value: "Температуры, справочники, статусы и правила" },
  { label: "Подсказка", value: "Лучше искать по термину или сокращению" },
];

export function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return knowledgeSections
      .map((section) => {
        const sectionMatches =
          activeSection === "all" ||
          activeSection === section.key ||
          section.title.toLowerCase().includes(activeSection.toLowerCase());

        if (!sectionMatches) {
          return null;
        }

        if (!query) {
          return section;
        }

        const articles = section.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query) ||
            section.summary.toLowerCase().includes(query),
        );

        if (articles.length === 0 && !section.title.toLowerCase().includes(query) && !section.summary.toLowerCase().includes(query)) {
          return null;
        }

        return {
          ...section,
          articles: articles.length > 0 ? articles : section.articles,
        };
      })
      .filter((section): section is KnowledgeSection => section !== null);
  }, [activeSection, search]);

  const hasQuery = search.trim().length > 0;
  const noResults = hasQuery && filteredSections.length === 0;
  const sectionsToShow = noResults ? [] : filteredSections;

  return (
    <Space direction="vertical" size="large" className="knowledge-page" style={{ width: "100%" }}>
      <Card className="knowledge-hero" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Typography.Text className="knowledge-eyebrow">BIOCARD knowledge hub</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0 }}>
              База знаний для диспетчерской команды
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 900, marginBottom: 0 }}>
              Структурированный справочный центр для температур, сокращений, AWB, статусов и операционных правил. Один белый экран,
              который помогает искать, читать и быстро переключаться между темами.
            </Typography.Paragraph>
          </Space>

          <div className="knowledge-hero-grid">
            {featuredItems.map((item) => (
              <div className="knowledge-hero-stat" key={item.label}>
                <Typography.Text type="secondary">{item.label}</Typography.Text>
                <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
                  {item.value}
                </Typography.Title>
              </div>
            ))}
          </div>

          <div className="knowledge-toolbar">
            <Input.Search
              allowClear
              placeholder="Найти правило, сокращение, температуру или статус"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="knowledge-search"
            />

            <div className="knowledge-pills">
              <Tag.CheckableTag checked={activeSection === "all"} onChange={() => setActiveSection("all")}>
                Все
              </Tag.CheckableTag>
              {knowledgeSections.map((section) => (
                <Tag.CheckableTag key={section.key} checked={activeSection === section.key} onChange={() => setActiveSection(section.key)}>
                  {section.title}
                </Tag.CheckableTag>
              ))}
            </div>
          </div>
        </Space>
      </Card>

      <div className="knowledge-layout">
        <div className="knowledge-main">
          <Card className="knowledge-featured-card" bordered={false} title="С чего начать">
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {quickPaths.map((item, index) => (
                <div className="knowledge-featured-item" key={item}>
                  <div className="knowledge-featured-item-copy">
                    <span className="knowledge-featured-index">{String(index + 1).padStart(2, "0")}</span>
                    <Typography.Text strong>{item}</Typography.Text>
                  </div>
                  <Button type="text">Открыть</Button>
                </div>
              ))}
            </Space>
          </Card>

          {noResults ? (
            <Card className="knowledge-section-card" bordered={false}>
              <Empty description="Ничего не найдено по этому запросу" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {sectionsToShow.map((section) => (
                <Col xs={24} xl={12} key={section.key}>
                  <Card className={`knowledge-section-card knowledge-section-${section.accent}`} bordered={false}>
                    <div className="knowledge-section-head">
                      <div className="knowledge-section-head-copy">
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {section.title}
                        </Typography.Title>
                        <Typography.Text type="secondary">{section.subtitle}</Typography.Text>
                      </div>
                      <Tag color={section.accent}>{section.articles.length} статей</Tag>
                    </div>

                    <Typography.Paragraph type="secondary" className="knowledge-section-summary">
                      {section.summary}
                    </Typography.Paragraph>

                    <div className="knowledge-article-list">
                      {section.articles.map((article) => (
                        <div className="knowledge-article-item" key={article.title}>
                          <div className="knowledge-article-copy">
                            <Typography.Text strong>{article.title}</Typography.Text>
                            <Typography.Text type="secondary">{article.description}</Typography.Text>
                          </div>
                          <div className="knowledge-article-meta">
                            <Tag>{article.readTime}</Tag>
                            <Typography.Text type="secondary">{article.updated}</Typography.Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        <div className="knowledge-rail">
          <Card className="knowledge-rail-card" title="Как пользоваться" bordered={false}>
            <div className="knowledge-rail-list">
              <div className="knowledge-rail-note">
                <span className="knowledge-rail-dot" />
                <Typography.Text>Ищи по термину, сокращению или коду аэропорта.</Typography.Text>
              </div>
              <div className="knowledge-rail-note">
                <span className="knowledge-rail-dot" />
                <Typography.Text>Сначала открывай темы из блока «С чего начать».</Typography.Text>
              </div>
              <div className="knowledge-rail-note">
                <span className="knowledge-rail-dot" />
                <Typography.Text>Чаще всего обновляются температуры, статусы и справочники.</Typography.Text>
              </div>
            </div>
          </Card>

          <Card className="knowledge-rail-card" title="Что читают чаще всего" bordered={false}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {[
                "Температурные режимы",
                "Коды аэропортов",
                "Split / merge",
                "Статусы бронирования",
                "Отклонения исполнения",
              ].map((item) => (
                <div className="knowledge-rail-metric" key={item}>
                  <Typography.Text strong>{item}</Typography.Text>
                  <Typography.Text type="secondary">Операционные правила и быстрые пояснения</Typography.Text>
                </div>
              ))}
            </Space>
          </Card>

          <Card className="knowledge-rail-card" title="Быстрые теги" bordered={false}>
            <Space wrap>
              {["AWB", "Airport", "Temp", "Booking", "Execution", "Audit"].map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Card>
        </div>
      </div>
    </Space>
  );
}
