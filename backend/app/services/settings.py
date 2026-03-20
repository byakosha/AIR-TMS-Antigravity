from __future__ import annotations

from app.data.airports import AIRPORTS
from app.models.entities import AirWaybill, Flight, PlanningWorkbenchRow, User
from app.schemas.settings import (SettingsHeroStatRead,
                                  SettingsSectionItemRead, SettingsSectionRead,
                                  SettingsSideMetricRead, SettingsSummaryRead)
from sqlalchemy.orm import Session

SETTINGS_SECTIONS = [
    SettingsSectionRead(
        key="directories",
        title="Справочники",
        subtitle="Базовые объекты, которые дают системе единый язык данных",
        accent="blue",
        tags=["Аэропорты", "Авиакомпании", "Агенты", "Направления", "Грузы"],
        items=[
            SettingsSectionItemRead(
                title="Аэропорты",
                description="Коды IATA, статус активности, регионы и поиск по справочнику.",
            ),
            SettingsSectionItemRead(
                title="Авиакомпании",
                description="Тип взаимодействия, активность, связка с перевозчиками и агентами.",
            ),
            SettingsSectionItemRead(
                title="Агенты и соглашения",
                description="Договоры, SLA, правила работы и доступность для маршрутов.",
            ),
        ],
        actions=["Открыть справочники", "Импорт / экспорт"],
    ),
    SettingsSectionRead(
        key="rules",
        title="Правила и статусы",
        subtitle="Логика, которая превращает данные в управляемый рабочий процесс",
        accent="gold",
        tags=["Статусы", "Матрица", "Фиксация", "Причины", "Ограничения"],
        items=[
            SettingsSectionItemRead(
                title="Причины изменений",
                description="Операционные причины, источник ответственности и комментарии для аудита.",
            ),
            SettingsSectionItemRead(
                title="Статусы и матрицы",
                description="Статусы брони, сдачи, вылета и правила смешивания температур и флагов.",
            ),
            SettingsSectionItemRead(
                title="Правила фиксации",
                description="Что блокирует план, что требует подтверждения и какие поля обязательны.",
            ),
        ],
        actions=["Открыть правила", "Проверить конфликт"],
    ),
    SettingsSectionRead(
        key="integrations",
        title="Интеграции",
        subtitle="Связь с 1С TMS, скрейперами и внешними системами бронирования",
        accent="green",
        tags=["1С TMS", "API", "Скрейпер", "Очереди", "Проверка"],
        items=[
            SettingsSectionItemRead(
                title="1С TMS",
                description="Входящие заказы, обратная передача подтвержденного результата и сверка.",
            ),
            SettingsSectionItemRead(
                title="API / scraper",
                description="Рейсы, факты вылета, сырые ответы и частота синхронизации.",
            ),
            SettingsSectionItemRead(
                title="Внешние системы бронирования",
                description="Ручной ввод в MVP и готовность к будущему автоматическому обмену.",
            ),
        ],
        actions=["Проверить соединение", "Настроить polling"],
    ),
    SettingsSectionRead(
        key="access",
        title="Роли и доступ",
        subtitle="Кто и что может менять, утверждать и просматривать",
        accent="purple",
        tags=["Роли", "Права", "Аудит", "Журнал", "Пользователи"],
        items=[
            SettingsSectionItemRead(
                title="Роли пользователей",
                description="Администратор, планировщик, оператор исполнения, руководитель смены.",
            ),
            SettingsSectionItemRead(
                title="Права доступа",
                description="Кто видит, кто редактирует, кто фиксирует и кто утверждает изменения.",
            ),
            SettingsSectionItemRead(
                title="Аудит и журнал",
                description="История изменений, критичные события и прозрачность решений.",
            ),
        ],
        actions=["Управление ролями", "Просмотр аудита"],
    ),
    SettingsSectionRead(
        key="users",
        title="Пользователи",
        subtitle="Учётные записи, демо-аккаунты и активность входа",
        accent="blue",
        tags=["Login", "Password", "RBAC", "Active", "Superuser"],
        items=[
            SettingsSectionItemRead(
                title="Демо-пользователи",
                description="Администратор, планировщик, оператор исполнения и руководитель смены для тестирования UI.",
            ),
            SettingsSectionItemRead(
                title="Авторизация",
                description="JWT вход, хранение токена и проверка доступа к административным разделам.",
            ),
            SettingsSectionItemRead(
                title="Статусы доступа",
                description="Активность, суперпользователь и последнее время входа.",
            ),
        ],
        actions=["Открыть пользователей", "Добавить учетную запись"],
    ),
]

OPERATIONAL_NOTES = [
    "Один экран = одна понятная зона ответственности.",
    "Крупные секции читаются быстрее, чем сетка одинаковых квадратиков.",
    "Частые действия должны быть рядом с контекстом, а не на отдельной панели.",
]


def get_settings_summary(db: Session) -> SettingsSummaryRead:
    airport_count = len(AIRPORTS)
    direction_count = db.query(PlanningWorkbenchRow.direction_code).distinct().count()
    awb_count = db.query(AirWaybill.id).count()
    flight_count = db.query(Flight.id).count()
    user_count = db.query(User.id).count()

    hero_stats = [
        SettingsHeroStatRead(
            label="Справочники",
            value=str(airport_count),
            note="аэропорты и базовые каталоги",
        ),
        SettingsHeroStatRead(
            label="Направления",
            value=str(direction_count),
            note="рабочие маршруты в манифесте",
        ),
        SettingsHeroStatRead(
            label="AWB",
            value=str(awb_count),
            note="актуальные авианакладные",
        ),
        SettingsHeroStatRead(
            label="Рейсы",
            value=str(flight_count),
            note="зафиксированные flight records",
        ),
        SettingsHeroStatRead(
            label="Пользователи",
            value=str(user_count),
            note="учетные записи и роли",
        ),
    ]

    side_metrics = [
        SettingsSideMetricRead(
            label="Справочники", value="аэропорты, направления, статусы"
        ),
        SettingsSideMetricRead(label="Интеграции", value="1С TMS, API, polling"),
        SettingsSideMetricRead(label="Доступ", value="роли, аудит, права"),
        SettingsSideMetricRead(
            label="Пользователи", value="demo accounts, login, RBAC"
        ),
    ]

    return SettingsSummaryRead(
        hero_stats=hero_stats,
        sections=SETTINGS_SECTIONS,
        operational_notes=OPERATIONAL_NOTES,
        side_metrics=side_metrics,
    )
