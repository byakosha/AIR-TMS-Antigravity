from enum import Enum


class RowBookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    partial = "partial"


class HandoverStatus(str, Enum):
    not_handed_over = "not_handed_over"
    handed_over_full = "handed_over_full"
    handed_over_partial = "handed_over_partial"
    packing_delay = "packing_delay"
    repacked = "repacked"


class ExecutionStatus(str, Enum):
    pending = "pending"
    flown_full = "flown_full"
    flown_partial = "flown_partial"
    not_flown = "not_flown"
    postponed = "postponed"

