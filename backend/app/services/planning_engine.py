from app.models.entities import PlanningWorkbenchRow
from app.models.planning_rules import (AirlineDetails, AwbBlankRange,
                                       SupplyChainRule)
from sqlalchemy.orm import Session


def run_auto_planning(db: Session) -> tuple[dict, list[str]]:
    unplanned_rows = (
        db.query(PlanningWorkbenchRow)
        .filter(
            PlanningWorkbenchRow.awb_number.is_(None),
            PlanningWorkbenchRow.booking_status == "pending",
        )
        .all()
    )

    if not unplanned_rows:
        return {"status": "info", "message": "Нет строк для планирования"}, []

    groups: dict[tuple[str, str | None, str | None], list] = {}
    for row in unplanned_rows:
        key = (row.airport_code, row.temperature_mode, row.cargo_profile)
        if key not in groups:
            groups[key] = []
        groups[key].append(row)

    warnings: list[str] = []
    success_count = 0
    assigned_awbs = 0

    for (airport, temp, cargo), rules_rows in groups.items():
        rule = (
            db.query(SupplyChainRule)
            .filter(
                SupplyChainRule.airport_code == airport,
                SupplyChainRule.temperature_mode == temp,
                SupplyChainRule.cargo_profile == cargo,
            )
            .first()
        )

        if not rule:
            rule = (
                db.query(SupplyChainRule)
                .filter(
                    SupplyChainRule.airport_code == airport,
                    SupplyChainRule.temperature_mode.is_(None),
                    SupplyChainRule.cargo_profile.is_(None),
                )
                .first()
            )

        if not rule:
            warnings.append(
                f"Нет цепи поставок для: {airport} | Темп: {temp} | Тип: {cargo}"
            )
            continue

        carrier = rule.carrier_code

        airline = (
            db.query(AirlineDetails)
            .filter(AirlineDetails.carrier_code == carrier)
            .first()
        )
        if not airline:
            warnings.append(f"Авиакомпания {carrier} не найдена в системе")
            continue

        blank_range = (
            db.query(AwbBlankRange)
            .filter(
                AwbBlankRange.airline_id == airline.id,
                AwbBlankRange.is_active == True,
                AwbBlankRange.current_number <= AwbBlankRange.end_number,
            )
            .first()
        )

        if not blank_range:
            warnings.append(
                f"У авиакомпании {carrier} (маршрут на {airport}) закончились бланки AWB!"
            )
            continue

        base_num = str(blank_range.current_number).zfill(7)
        check_digit = int(base_num) % 7
        awb_full = f"{airline.awb_prefix}-{base_num}{check_digit}"

        blank_range.current_number = int(blank_range.current_number) + 1

        for r in rules_rows:
            r.awb_number = awb_full
            r.is_auto_planned = True
            success_count += 1

        assigned_awbs += 1

    db.commit()

    if not success_count and warnings:
        return {}, warnings

    msg = f"Успешно спланировано {success_count} строк в {assigned_awbs} AWB."
    if warnings:
        msg += " Предупреждения: " + "; ".join(warnings)

    return {"status": "success", "message": msg}, []
