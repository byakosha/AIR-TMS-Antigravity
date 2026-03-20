import { useState } from "react";
import { Card, Col, Input, List, Modal, Row, Space, Tag, Typography, Button } from "antd";

const knowledgeSections = [
  {
    key: "directories",
    title: "Справочники и коды",
    subtitle: "Базовые каталоги, которые дают системе единый язык данных",
    accent: "blue",
    articles: [
      { title: "Коды аэропортов и московские направления", description: "Обозначения IATA и распределение грузов в авиаузлах (MOW).", text: "Аэропорты обозначаются 3-буквенными кодами IATA (SVO, VKO, DME). Особое внимание стоит уделить направлениям Москва (MOW), так как грузы могут распределяться между разными аэропортами узла в зависимости от авиакомпании. Всегда проверяйте конечный аэропорт прибытия для корректной маршрутизации." },
      { title: "Список направлений", description: "Правила отображения направлений в фильтрах системы.", text: "Фильтры по направлениям применяются строго по коду IATA пункта назначения. Мультиплеерные рейсы (с промежуточными посадками) отображаются в системе по финальной точке. Промежуточные посадки указываются только в маршрутном листе AWB." },
    ],
  },
  {
    key: "temperature",
    title: "Температуры и упаковка",
    subtitle: "Медлогистика, контроль температуры и режимы",
    accent: "green",
    articles: [
      { title: "Температурные режимы", description: "Справочник режимов для термочувствительных карточек.", text: "Стандартные режимы: +2..+8 °C (Фарма, вакцины), +15..+25 °C (Общий мед.режим), -20 °C (Глубокая заморозка), -70 °C (Сухой лед). При использовании сухого льда требуется строгая проверка по стандартам IATA DGR, так как сухой лед (UN 1845) является опасным грузом 9 класса." },
      { title: "Совместимость грузов (Сплит/Мердж)", description: "Что можно и нельзя смешивать в одной отправке (AWB).", text: "Категорически запрещено оформлять грузы +2..+8 и +15..+25 в одной авианакладной (AWB) без явного письменного разрешения заказчика. При обнаружении конфликта система не даст объединить заявки в одну AWB. Применяйте Split для разделения несовместимых мест." },
    ],
  },
  {
    key: "dangerous_goods",
    title: "Опасные грузы (IATA DGR)",
    subtitle: "Обработка, классы опасности и маркировка",
    accent: "red",
    articles: [
      { title: "Классы опасных грузов", description: "Обзор 9 классов опасности по классификации ООН.", text: "Грузы делятся на 9 классов. Наиболее частые в медлогистике: Класс 6 (Токсичные и инфекционные вещества - UN 3373 Биологические образцы), Класс 9 (Прочие опасные вещества - Сухой лед UN 1845, литиевые батареи термодатчиков). Каждый груз требует паспорта безопасности (MSDS)." },
      { title: "Маркировка и упаковка", description: "Требования к наклейкам и таре.", text: "Упаковка должна строго соответствовать Packing Instructions (PI) актуального руководства IATA DGR. Для сухого льда (PI 954) упаковка должна пропускать газ во избежание разрыва. Маркировка ромбовидная, должна содержать номер UN, Proper Shipping Name и вес нетто опасного вещества." },
      { title: "Оформление DGD (Декларация)", description: "Shipper's Declaration for Dangerous Goods.", text: "Для большинства опасных грузов требуется заполнение DGD грузоотправителем. Для UN 3373 (Категория B) и Сухого льда DGD не требуется, достаточно указания в графе 'Nature and Quantity of Goods' авианакладной всей необходимой информации (UN, класс, кол-во)." },
    ],
  },
  {
    key: "awb_rules",
    title: "Требования к оформлению AWB",
    subtitle: "Выписка накладных и документооборот",
    accent: "gold",
    articles: [
      { title: "Основные графы AWB", description: "Как правильно заполнить лицевую часть.", text: "Авианакладная состоит из 3 оригиналов (для перевозчика, получателя и отправителя) и копий. Графы Shipper и Consignee заполняются строго по документам. Поле 'Nature and Quantity of Goods' должно очень точно описывать груз. Фразы 'Медицинское оборудование' или 'Консолидация' не допускаются у некоторых перевозчиков без детализации." },
      { title: "Нормативная база (ФАП-82)", description: "Российские стандарты авиаперевозок.", text: "Согласно ФАП-82 (Федеральные авиационные правила), грузоотправитель несет полную ответственность за достоверность сведений о грузе. Авиакомпания вправе отказать в приеме груза при малейших расхождениях веса (разница более 1% или 1кг) или при повреждении упаковки. В системе реализован автоматический пре-чекинг отклонений веса." },
      { title: "Жизненный цикл AWB в системе", description: "От драфта до бухгалтерии (1С).", text: "1. Драфт (Draft) — AWB создана, номера присвоены. 2. План (Confirmed) — заявки привязаны, рейс выбран. 3. Сдача (Handed over) — груз принят на терминале. 4. Исполнение (Flown) — фактический вылет рейса. 5. Закрытие — передача данных в 1С для выставления актов." },
    ],
  },
  {
    key: "airports",
    title: "Специфика аэропортов РФ",
    subtitle: "Требования Московского авиаузла и терминалов",
    accent: "purple",
    articles: [
      { title: "Аэропорт Шереметьево (SVO) - Москва Карго", description: "Дедлайны и пропускная система.", text: "Грузовой терминал 'Москва Карго'. Все данные о водителях и машинах должны передаваться через тайм-слотирование. Сдача специального (опасного/температурного) груза не позднее 6 часов до вылета. Приемка по живой очереди через предварительную заявку." },
      { title: "Аэропорт Домодедово (DME) - Домодедово Карго", description: "Правила сдачи DGR и фармы.", text: "Обслуживает рейсы S7 и другие. Жесткий входной контроль опасных грузов выделенными инспекторами. Термо-грузы принимаются с замером температуры стенки коробки. Ожидание приемки может составлять от 1 до 4 часов, что необходимо закладывать в SLA планирования." },
      { title: "Аэропорт Внуково (VKO) - Внуково Карго", description: "Особенности приема грузов UTair / Победа.", text: "Электронное оформление пропусков строго день в день. Терминал имеет строгие ограничения по габаритам мономест для узкофюзеляжных ВС (Boeing 737). Негабарит согласовывается за 48 часов до рейса через систему бронирования авиакомпании." },
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
                    actions={[
                      <Button type="primary" size="small" onClick={() => setSelectedArticle({ title: article.title, text: article.text })}>
                        Читать статью
                      </Button>
                    ]}
                    style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}
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
