from __future__ import annotations

from app.models.entities import AirWaybill, Flight, PlanningWorkbenchRow, User
from app.schemas.overview import (OverviewAlertRead, OverviewSnapshotRead,
                                  OverviewStageRead, OverviewStatRead,
                                  OverviewSummaryRead)
from sqlalchemy import func
from sqlalchemy.orm import Session


def get_overview_summary(db: Session) -> OverviewSummaryRead:
    total_rows = db.query(PlanningWorkbenchRow.id).count()
    rows_with_awb = (
        db.query(PlanningWorkbenchRow.id)
        .filter(PlanningWorkbenchRow.awb_number.isnot(None))
        .count()
    )
    rows_without_awb = (
        db.query(PlanningWorkbenchRow.id)
        .filter(PlanningWorkbenchRow.awb_number.is_(None))
        .count()
    )
    pending_bookings = (
        db.query(PlanningWorkbenchRow.id)
        .filter(PlanningWorkbenchRow.booking_status.in_(["pending", "draft"]))
        .count()
    )
    partial_execution = (
        db.query(PlanningWorkbenchRow.id)
        .filter(PlanningWorkbenchRow.execution_status == "flown_partial")
        .count()
    )
    outside_manifest = (
        db.query(PlanningWorkbenchRow.id)
        .filter(PlanningWorkbenchRow.is_outside_final_manifest.is_(True))
        .count()
    )
    total_awbs = db.query(AirWaybill.id).count()
    total_flights = db.query(Flight.id).count()
    total_users = db.query(User.id).count()

    hero_stats = [
        OverviewStatRead(
            label="Строк в манифесте",
            value=str(total_rows),
            note="все активные рабочие строки",
        ),
        OverviewStatRead(
            label="AWB привязано",
            value=str(rows_with_awb),
            note="строки с номером авианакладной",
        ),
        OverviewStatRead(
            label="Рейсы в контуре",
            value=str(total_flights),
            note="плановые flight records",
        ),
        OverviewStatRead(
            label="Пользователи", value=str(total_users), note="активные учетные записи"
        ),
    ]

    pipeline = [
        OverviewStageRead(
            label="1С TMS",
            value=str(total_rows + total_awbs),
            subtitle="исходные заказы и манифесты",
            accent="blue",
        ),
        OverviewStageRead(
            label="Планирование",
            value=str(total_rows),
            subtitle="рабочие строки и AWB",
            accent="gold",
        ),
        OverviewStageRead(
            label="Исполнение",
            value=str(partial_execution + pending_bookings),
            subtitle="частичные вылеты и отклонения",
            accent="green",
        ),
        OverviewStageRead(
            label="Доступ",
            value=str(total_users),
            subtitle="роли и активные аккаунты",
            accent="purple",
        ),
    ]

    alerts = []
    if rows_without_awb:
        alerts.append(
            OverviewAlertRead(
                title="Есть строки без AWB",
                description=f"{rows_without_awb} строк(и) еще ждут ручного присвоения авианакладной.",
                severity="warning",
            )
        )
    if pending_bookings:
        alerts.append(
            OverviewAlertRead(
                title="Ожидают ответ по брони",
                description=f"{pending_bookings} строк(и) пока в статусе pending/draft.",
                severity="info",
            )
        )
    if partial_execution:
        alerts.append(
            OverviewAlertRead(
                title="Частичное исполнение",
                description=f"{partial_execution} строк(и) уже ушли частично и требуют контроля остатка.",
                severity="critical",
            )
        )
    if outside_manifest:
        alerts.append(
            OverviewAlertRead(
                title="Строки вне манифеста",
                description=f"{outside_manifest} строк(и) помечены как временно вне финального манифеста.",
                severity="warning",
            )
        )
    if not alerts:
        alerts.append(
            OverviewAlertRead(
                title="Поток стабилен",
                description="Нет критичных отклонений по строкам и статусам.",
                severity="success",
            )
        )

    snapshots = [
        OverviewSnapshotRead(
            direction_code=row.direction_code,
            direction_name=row.direction_name,
            airport_code=row.airport_code,
            temperature_mode=row.temperature_mode,
            booking_status=row.booking_status,
            handover_status=row.handover_status,
            execution_status=row.execution_status,
            awb_number=row.awb_number,
            planned_flight_number=row.planned_flight_number,
            places_count=row.places_count,
            weight_total=row.weight_total,
        )
        for row in (
            db.query(PlanningWorkbenchRow)
            .order_by(
                PlanningWorkbenchRow.custom_sort_order.asc(),
                PlanningWorkbenchRow.id.desc(),
            )
            .limit(4)
            .all()
        )
    ]

    operational_notes = [
        "Логика потока уже опирается на реальные статусы workbench.",
        "Критичные случаи лучше видеть в начале экрана, а не в списке ниже.",
        "Пользователи и доступ теперь живут в системе, а не в текстовой заглушке.",
    ]

    return OverviewSummaryRead(
        hero_stats=hero_stats,
        pipeline=pipeline,
        alerts=alerts,
        snapshots=snapshots,
        operational_notes=operational_notes,
    )
