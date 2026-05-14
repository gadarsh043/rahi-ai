from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    PageBreak,
    KeepTogether,
)
from reportlab.platypus.flowables import Flowable
from io import BytesIO
import traceback
import urllib.parse
from html import escape as html_escape

# Colors
BRAND = colors.HexColor("#F97316")
BRAND_LIGHT = colors.HexColor("#FB923C")
BRAND_BG = colors.HexColor("#FFF7ED")
BRAND_BG2 = colors.HexColor("#FFEDD5")
DARK = colors.HexColor("#0F172A")
TEXT = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#6B7280")
LIGHT_BG = colors.HexColor("#F9FAFB")
BORDER = colors.HexColor("#E5E7EB")
GREEN = colors.HexColor("#10B981")
GREEN_BG = colors.HexColor("#F0FDF4")
BLUE = colors.HexColor("#3B82F6")
RED = colors.HexColor("#EF4444")
RED_BG = colors.HexColor("#FEF2F2")
WHITE = colors.white
CREAM = colors.HexColor("#FDF8F4")

# Hex strings for use in link tags
BLUE_HEX = "3B82F6"
MUTED_HEX = "6B7280"
BRAND_HEX = "F97316"
GREEN_HEX = "10B981"
RED_HEX = "EF4444"
DARK_HEX = "0F172A"


def build_styles():
    s = getSampleStyleSheet()
    s.add(
        ParagraphStyle(
            "Brand",
            parent=s["Normal"],
            fontSize=11,
            textColor=BRAND,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
            spaceAfter=2,
        )
    )
    s.add(
        ParagraphStyle(
            "TripTitle",
            parent=s["Title"],
            fontSize=24,
            textColor=DARK,
            spaceAfter=4,
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        )
    )
    s.add(
        ParagraphStyle(
            "Subtitle",
            parent=s["Normal"],
            fontSize=10,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=10,
        )
    )
    s.add(
        ParagraphStyle(
            "Section",
            parent=s["Heading2"],
            fontSize=14,
            textColor=BRAND,
            spaceBefore=18,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        )
    )
    s.add(
        ParagraphStyle(
            "SectionSub",
            parent=s["Normal"],
            fontSize=8.5,
            textColor=MUTED,
            spaceAfter=6,
        )
    )
    s.add(
        ParagraphStyle(
            "DayTitle",
            parent=s["Heading3"],
            fontSize=12,
            textColor=WHITE,
            spaceBefore=14,
            spaceAfter=6,
            fontName="Helvetica-Bold",
        )
    )
    s.add(
        ParagraphStyle(
            "Time",
            parent=s["Normal"],
            fontSize=9,
            textColor=BRAND,
            fontName="Helvetica-Bold",
            spaceAfter=1,
        )
    )
    s.add(
        ParagraphStyle(
            "PlaceName",
            parent=s["Normal"],
            fontSize=10,
            textColor=TEXT,
            fontName="Helvetica-Bold",
            spaceAfter=1,
        )
    )
    s.add(
        ParagraphStyle(
            "PlaceInfo",
            parent=s["Normal"],
            fontSize=8,
            textColor=MUTED,
            spaceAfter=1,
        )
    )
    s.add(
        ParagraphStyle(
            "PlaceDetail",
            parent=s["Normal"],
            fontSize=8.5,
            textColor=TEXT,
            spaceAfter=4,
            leftIndent=0,
        )
    )
    s.add(
        ParagraphStyle(
            "SmallMuted",
            parent=s["Normal"],
            fontSize=7.5,
            textColor=MUTED,
        )
    )
    s.add(
        ParagraphStyle(
            "CenterSmall",
            parent=s["Normal"],
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        )
    )
    s.add(
        ParagraphStyle(
            "CheckItem",
            parent=s["Normal"],
            fontSize=9,
            textColor=TEXT,
            spaceAfter=3,
        )
    )
    s.add(
        ParagraphStyle(
            "RefKey",
            parent=s["Normal"],
            fontSize=9,
            textColor=DARK,
            fontName="Helvetica-Bold",
        )
    )
    s.add(
        ParagraphStyle(
            "RefVal",
            parent=s["Normal"],
            fontSize=9,
            textColor=TEXT,
        )
    )
    s.add(
        ParagraphStyle(
            "TripBody",
            parent=s["Normal"],
            fontSize=9,
            textColor=TEXT,
            spaceAfter=4,
        )
    )
    s.add(
        ParagraphStyle(
            "StatLabel",
            parent=s["Normal"],
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        )
    )
    s.add(
        ParagraphStyle(
            "StatValue",
            parent=s["Normal"],
            fontSize=14,
            textColor=DARK,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        )
    )
    s.add(
        ParagraphStyle(
            "TipText",
            parent=s["Normal"],
            fontSize=8,
            textColor=TEXT,
            spaceAfter=2,
            leftIndent=8,
        )
    )
    s.add(
        ParagraphStyle(
            "NoticeText",
            parent=s["Normal"],
            fontSize=8.5,
            textColor=TEXT,
            spaceAfter=3,
        )
    )
    return s


def maps_link(name, lat=None, lng=None, place_id=None):
    """Generate a tappable Google Maps URL."""
    name = "" if name is None else str(name)
    if place_id:
        return (
            "https://www.google.com/maps/search/?api=1&query="
            f"{urllib.parse.quote(name)}&query_place_id={place_id}"
        )
    if lat is not None and lng is not None:
        return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
    return (
        "https://www.google.com/maps/search/?api=1&query="
        f"{urllib.parse.quote(name)}"
    )


def _esc(s) -> str:
    """Escape plain text for ReportLab Paragraph markup (&, <, >)."""
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html_escape(s, quote=False)


def _esc_attr(s) -> str:
    """Escape for double-quoted XML/HTML attributes (e.g. href)."""
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html_escape(s, quote=True)


def _as_dict(val) -> dict:
    return val if isinstance(val, dict) else {}


def _table_cell(val) -> str:
    """
    ReportLab Table cells must be str/number/Flowable — never dict/list.
    Coerce structured JSON fields to a readable string.
    """
    if val is None:
        return ""
    if isinstance(val, bool):
        return "Yes" if val else "No"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        return val
    if isinstance(val, (dict, list)):
        import json

        try:
            s = json.dumps(val, ensure_ascii=False, separators=(",", ": "))
        except (TypeError, ValueError):
            s = str(val)
        if len(s) > 900:
            return s[:897] + "..."
        return s
    return str(val)


def _normalize_table_rows(rows):
    """Ensure every Table cell is a Flowable or plain string — never dict/list."""
    out = []
    for row in rows:
        out.append([c if isinstance(c, Flowable) else _table_cell(c) for c in row])
    return out


def _safe_int(val, default=0, *, min_v=None, max_v=None) -> int:
    try:
        n = int(round(float(val)))
        if min_v is not None:
            n = max(n, min_v)
        if max_v is not None:
            n = min(n, max_v)
        return n
    except (TypeError, ValueError):
        return default


def _safe_cost(costs, section, key, default=0, *, num_days=1, num_travelers=1):
    """
    Safe int from trip cost_estimate.

    V1 (formula helper): each category is a dict with total / per_night / per_day / etc.
    V2 (estimate_trip_cost): each category is often a plain int total; transport uses key
    ``transport`` instead of ``local_transport``.
    """
    try:
        nd = max(int(num_days or 1), 1)
        nt = max(int(num_travelers or 1), 1)
        nights = max(nd - 1, 1)

        if section == "root":
            val = costs.get(key, default)
            if val is None:
                return default
            if isinstance(val, dict):
                return default
            try:
                return int(round(float(val)))
            except (TypeError, ValueError):
                return default

        raw = costs.get(section)
        if section == "local_transport" and raw is None and "transport" in costs:
            raw = costs.get("transport")

        if isinstance(raw, str) and str(raw).strip():
            try:
                raw = float(str(raw).strip())
            except ValueError:
                raw = None

        # V2: category stored as a single number (total only)
        if isinstance(raw, (int, float)) and not isinstance(raw, bool):
            total = int(round(raw))
            if key == "total":
                return total
            if section == "accommodation" and key == "per_night":
                return int(round(total / nights)) if nights else default
            if section in ("food", "activities", "local_transport") and key == "per_day":
                return int(round(total / nd)) if nd else default
            if section == "flights" and key == "per_person":
                return int(round(total / nt)) if nt else default
            return default

        subsection = raw if isinstance(raw, dict) else {}
        val = subsection.get(key, default)
        if val is None:
            return default
        try:
            return int(round(float(val)))
        except (TypeError, ValueError):
            return default
    except (TypeError, ValueError, ZeroDivisionError):
        return default


def _build_stat_cell(value, label, styles):
    """Build a stat cell for the header stats row."""
    return [
        Paragraph(_esc(str(value)), styles["StatValue"]),
        Paragraph(_esc(str(label)), styles["StatLabel"]),
    ]


def _generate_trip_pdf_impl(trip: dict, places: list, visa_info: dict, essentials: dict) -> bytes:
    """Generate Rahify trip PDF with header stats, day-by-day itinerary, costs, places, visa, packing, phrases."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    styles = build_styles()
    story = []

    places = places if isinstance(places, list) else []
    trip = trip if isinstance(trip, dict) else {}

    origin = str(trip.get("origin_city") or "?")
    dest = str(trip.get("destination_city") or "?")
    dest_country = str(trip.get("destination_country") or "")
    days = trip.get("num_days", "?")
    travelers = trip.get("num_travelers", 1)
    pace = trip.get("pace") or "moderate"
    budget = trip.get("budget_vibe") or "$$"
    dates_str = ""
    if trip.get("start_date") and trip.get("end_date"):
        dates_str = f"{trip['start_date']} to {trip['end_date']}"

    essentials = _as_dict(essentials)
    visa_info = _as_dict(visa_info)
    costs = _as_dict(trip.get("cost_estimate"))

    PAGE_W = 170 * mm  # usable width

    # ═══════════════════════════════════════
    # PAGE 1: COVER WITH TRIP STATS
    # ═══════════════════════════════════════

    # Brand accent bar at top
    story.append(
        HRFlowable(width="100%", thickness=3, color=BRAND, spaceAfter=20)
    )
    story.append(Spacer(1, 10))

    # Brand header
    story.append(Paragraph("RAHIFY", styles["Brand"]))
    story.append(Spacer(1, 4))
    story.append(
        HRFlowable(width="30%", thickness=2, color=BRAND, spaceAfter=8)
    )
    story.append(Paragraph(f"{_esc(origin)} to {_esc(dest)}", styles["TripTitle"]))
    if dest_country:
        story.append(Paragraph(_esc(dest_country), styles["Subtitle"]))
    if dates_str:
        story.append(Paragraph(_esc(dates_str), styles["Subtitle"]))
    story.append(Spacer(1, 4))

    # Trip stats row (like reference PDF header)
    stat_cells = []
    stat_cells.append(_build_stat_cell(travelers, f"Traveler{'s' if travelers != 1 else ''}", styles))
    stat_cells.append(_build_stat_cell(days, "Days", styles))
    stat_cells.append(_build_stat_cell(str(pace).replace("_", " ").title(), "Pace", styles))
    stat_cells.append(_build_stat_cell(budget, "Budget", styles))

    total_cost = _safe_cost(costs, "root", "total", costs.get("total", 0))
    if total_cost > 0:
        stat_cells.append(_build_stat_cell(f"${total_cost:,}", "Est. Budget", styles))

    # Build stats table
    num_stats = len(stat_cells)
    col_w = PAGE_W / num_stats
    stat_row_top = [c[0] for c in stat_cells]
    stat_row_bot = [c[1] for c in stat_cells]

    stats_table = Table(
        [stat_row_top, stat_row_bot],
        colWidths=[col_w] * num_stats,
    )
    stats_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_BG),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
                ("TOPPADDING", (0, -1), (-1, -1), 2),
                ("BOX", (0, 0), (-1, -1), 1, BORDER),
            ]
        )
    )
    story.append(stats_table)
    story.append(Spacer(1, 16))

    # Route overview
    story.append(
        Paragraph(
            f"<b>Route:</b> {_esc(origin)} <font color='#{BRAND_HEX}'>\u2708</font> {_esc(dest)}",
            styles["TripBody"],
        )
    )

    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))

    # ═══════════════════════════════════════
    # QUICK REFERENCE CARD
    # ═══════════════════════════════════════

    story.append(Paragraph("Quick Reference", styles["Section"]))
    story.append(
        Paragraph(
            "Save or screenshot this section for easy access during your trip.",
            styles["SectionSub"],
        )
    )

    ref_data = []
    em_nums = essentials.get("emergency_numbers") or essentials.get("emergencyNumbers")
    if em_nums and isinstance(em_nums, dict):
        emergency = " | ".join(
            f"{str(k).title()}: {_table_cell(v)}" for k, v in em_nums.items() if k != "note"
        )
        if emergency:
            ref_data.append(["Emergency", emergency])

    ref_data.append(
        ["Language", _table_cell(essentials.get("language", "Check before travel"))]
    )
    ref_data.append(
        [
            "Currency",
            _table_cell(
                essentials.get("currency_info")
                or essentials.get("currencyInfo")
                or "Check exchange rates"
            ),
        ]
    )
    ref_data.append(["Tipping", _table_cell(essentials.get("tipping", "Varies"))])
    ref_data.append(
        [
            "Power",
            _table_cell(
                essentials.get("power_plug")
                or essentials.get("powerPlug")
                or "Bring universal adapter"
            ),
        ]
    )
    ref_data.append(
        [
            "Water",
            _table_cell(
                essentials.get("water_safety")
                or essentials.get("waterSafety")
                or "When in doubt, bottled"
            ),
        ]
    )
    ref_data.append(
        [
            "SIM/Data",
            _table_cell(
                essentials.get("sim_advice")
                or essentials.get("simAdvice")
                or "Buy local SIM at airport"
            ),
        ]
    )
    ref_data.append(
        ["Timezone", _table_cell(essentials.get("timezone", "Check before travel"))]
    )

    dress = essentials.get("dress_code") or essentials.get("dressCode")
    if dress:
        ref_data.append(["Dress Code", _table_cell(dress)])

    if ref_data:
        t = Table(_normalize_table_rows(ref_data), colWidths=[30 * mm, 140 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (0, -1), DARK),
                    ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_BG, WHITE]),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(t)

    # Visa Quick Status
    story.append(Spacer(1, 10))
    if visa_info.get("note"):
        visa_text = visa_info["note"]
    elif visa_info.get("visa_required") is False:
        visa_text = f"No visa needed. {visa_info.get('type', '')}"
    elif visa_info.get("visa_required"):
        visa_text = (
            f"Visa REQUIRED: {visa_info.get('type', 'Check embassy')} | "
            f"Processing: {visa_info.get('processing', 'varies')}"
        )
    else:
        visa_text = "Check visa requirements with embassy"

    visa_is_ok = visa_info.get("visa_required") is False
    story.append(
        Table(
            [[Paragraph(f"<b>Visa:</b> {_esc(visa_text)}", styles["TripBody"])]],
            colWidths=[PAGE_W],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), GREEN_BG if visa_is_ok else RED_BG),
                    ("BOX", (0, 0), (-1, -1), 1, GREEN if visa_is_ok else RED),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ]
            ),
        )
    )

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # DAY-BY-DAY ITINERARY
    # ═══════════════════════════════════════

    story.append(Paragraph("Your Itinerary", styles["Section"]))
    story.append(
        Paragraph(
            "Tap place names to open in Google Maps. Times are suggested — adjust to your pace.",
            styles["SectionSub"],
        )
    )

    itinerary = trip.get("itinerary") or {}
    itinerary_days = []
    if isinstance(itinerary, dict):
        raw_days = itinerary.get("itinerary")
        if isinstance(raw_days, list):
            itinerary_days = raw_days

    place_lookup = {}
    for p in places or []:
        if not isinstance(p, dict):
            continue
        pid = p.get("google_place_id") or p.get("googlePlaceId") or ""
        if pid:
            place_lookup[pid] = p
        name_key = (p.get("name") or "").lower()
        if name_key:
            place_lookup[name_key] = p

    for day in itinerary_days:
        if not isinstance(day, dict):
            continue
        day_num = day.get("day_number", "?")
        title = day.get("title", "")

        # Day header with brand accent
        day_header = Table(
            [
                [
                    Paragraph(
                        f"Day {_esc(str(day_num))} \u2014 {_esc(str(title))}",
                        styles["DayTitle"],
                    )
                ]
            ],
            colWidths=[PAGE_W],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), BRAND),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ]
            ),
        )
        story.append(day_header)
        story.append(Spacer(1, 6))

        for act in day.get("activities") or []:
            if not isinstance(act, dict):
                continue
            time = act.get("time", "")
            act_title = act.get("title", "Activity")
            detail = act.get("detail", "")
            act_type = act.get("type", "")
            place_id = act.get("place_id") or act.get("placeId", "")

            type_colors = {
                "food": (BRAND_HEX, "EAT"),
                "attraction": (BLUE_HEX, "VISIT"),
                "hotel": (GREEN_HEX, "STAY"),
                "free": (MUTED_HEX, "FREE"),
            }
            type_color, type_label = type_colors.get(act_type, (MUTED_HEX, ""))

            matched = place_lookup.get(place_id) or place_lookup.get(
                (act_title or "").lower()
            )
            address = ""
            rating = None
            price_level = None
            gmap_url = ""
            if matched:
                address = matched.get("address") or ""
                rating = matched.get("rating")
                price_level = matched.get("price_level")
                gmap_url = maps_link(
                    act_title,
                    matched.get("lat"),
                    matched.get("lng"),
                    matched.get("google_place_id") or matched.get("googlePlaceId"),
                )

            activity_parts = []

            # Time + type badge
            time_line = f"<b>{_esc(str(time))}</b>"
            if type_label:
                time_line += f"  <font color='#{type_color}'>[{type_label}]</font>"
            activity_parts.append(Paragraph(time_line, styles["Time"]))

            # Place name (linked if possible)
            title_safe = _esc(str(act_title))
            if gmap_url:
                name_text = f'<b><a href="{_esc_attr(gmap_url)}" color="#{BLUE_HEX}">{title_safe}</a></b>'
            else:
                name_text = f"<b>{title_safe}</b>"

            # Rating + price level
            meta_parts = []
            if rating is not None:
                meta_parts.append(f"\u2605 {_esc(str(rating))}")
            pw = _safe_int(price_level, 0, min_v=0, max_v=4)
            if price_level is not None and pw > 0:
                meta_parts.append("$" * pw)
            if meta_parts:
                name_text += f"  <font color='#{MUTED_HEX}'>({' | '.join(meta_parts)})</font>"
            activity_parts.append(Paragraph(name_text, styles["PlaceName"]))

            # Address
            if address:
                activity_parts.append(
                    Paragraph(
                        f"<font color='#{MUTED_HEX}'>{_esc(str(address))}</font>",
                        styles["PlaceInfo"],
                    )
                )

            # Detail / description
            if detail:
                activity_parts.append(Paragraph(_esc(str(detail)), styles["PlaceDetail"]))

            activity_parts.append(Spacer(1, 6))
            story.append(KeepTogether(activity_parts))

        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # COST BREAKDOWN
    # ═══════════════════════════════════════

    if costs:
        try:
            _pdf_cost_days = max(int(trip.get("num_days") or 1), 1)
        except (TypeError, ValueError):
            _pdf_cost_days = 1
        try:
            _pdf_cost_travelers = max(int(trip.get("num_travelers") or 1), 1)
        except (TypeError, ValueError):
            _pdf_cost_travelers = 1

        story.append(Paragraph("Cost Estimate", styles["Section"]))
        story.append(
            Paragraph(
                "All costs are estimates in USD. Actual prices may vary by season and availability.",
                styles["SectionSub"],
            )
        )

        cost_rows = [
            ["Category", "Total", "Rate"],
            [
                "Accommodation",
                f"${_safe_cost(costs, 'accommodation', 'total', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers):,}",
                f"${_safe_cost(costs, 'accommodation', 'per_night', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers)}/night",
            ],
            [
                "Food & Drinks",
                f"${_safe_cost(costs, 'food', 'total', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers):,}",
                f"${_safe_cost(costs, 'food', 'per_day', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers)}/day",
            ],
            [
                "Activities & Tickets",
                f"${_safe_cost(costs, 'activities', 'total', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers):,}",
                f"${_safe_cost(costs, 'activities', 'per_day', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers)}/day",
            ],
            [
                "Local Transport",
                f"${_safe_cost(costs, 'local_transport', 'total', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers):,}",
                f"${_safe_cost(costs, 'local_transport', 'per_day', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers)}/day",
            ],
            [
                "Flights",
                f"${_safe_cost(costs, 'flights', 'total', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers):,}",
                f"${_safe_cost(costs, 'flights', 'per_person', 0, num_days=_pdf_cost_days, num_travelers=_pdf_cost_travelers)}/person",
            ],
        ]

        total_val = _safe_cost(costs, "root", "total", costs.get("total", 0))
        per_person = _safe_cost(costs, "root", "per_person", costs.get("per_person", 0))
        total_row = [
            "TOTAL",
            f"${total_val:,}",
            f"${per_person:,}/person",
        ]

        t = Table(_normalize_table_rows(cost_rows + [total_row]), colWidths=[65 * mm, 45 * mm, 60 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("BACKGROUND", (0, 0), (-1, 0), DARK),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -2), 0.5, BORDER),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, LIGHT_BG]),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("BACKGROUND", (0, -1), (-1, -1), BRAND_BG),
                    ("TEXTCOLOR", (0, -1), (-1, -1), BRAND),
                    ("LINEABOVE", (0, -1), (-1, -1), 1.5, BRAND),
                ]
            )
        )
        story.append(t)

        # Daily average note
        daily_avg = _safe_cost(costs, "root", "daily_avg", costs.get("daily_avg", 0))
        if daily_avg > 0:
            story.append(Spacer(1, 6))
            story.append(
                Paragraph(
                    f"<b>Daily average:</b> ${daily_avg:,}/day (excluding flights)",
                    styles["SmallMuted"],
                )
            )

    # ═══════════════════════════════════════
    # YOUR PLACES — Full list with addresses
    # ═══════════════════════════════════════

    story.append(Paragraph("Your Places", styles["Section"]))
    story.append(
        Paragraph(
            "All places in your itinerary. Tap names to open in Google Maps.",
            styles["SectionSub"],
        )
    )

    categories = {}
    for p in places or []:
        if not isinstance(p, dict):
            continue
        in_itinerary = p.get("is_in_itinerary") or p.get("isInItinerary")
        if in_itinerary:
            cat = p.get("category", "other")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(p)

    cat_labels = {
        "restaurant": "Where to Eat",
        "cafe": "Cafes",
        "lodging": "Where to Stay",
        "hotel": "Where to Stay",
        "tourist_attraction": "Places to Visit",
        "museum": "Museums",
        "park": "Parks & Outdoors",
        "bar": "Bars & Nightlife",
        "other": "Other",
    }

    for cat, cat_places in categories.items():
        label = cat_labels.get(cat, str(cat).replace("_", " ").title())
        story.append(Paragraph(f"<b>{_esc(str(label))}</b>", styles["RefKey"]))
        story.append(Spacer(1, 3))

        for p in cat_places:
            if not isinstance(p, dict):
                continue
            gurl = maps_link(
                p.get("name", ""),
                p.get("lat"),
                p.get("lng"),
                p.get("google_place_id") or p.get("googlePlaceId"),
            )
            nm = _esc(str(p.get("name", "")))
            line = f'<a href="{_esc_attr(gurl)}" color="#{BLUE_HEX}">{nm}</a>'
            r = p.get("rating")
            if r is not None:
                line += f" (\u2605 {_esc(str(r))})"
            addr = p.get("address") or ""
            if addr:
                line += f" \u2014 <font color='#{MUTED_HEX}'>{_esc(str(addr))}</font>"
            story.append(Paragraph(line, styles["PlaceInfo"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 6))

    # ═══════════════════════════════════════
    # VISA & DOCUMENTS
    # ═══════════════════════════════════════

    if visa_info:
        story.append(Paragraph("Visa & Documents", styles["Section"]))

        if visa_info.get("note"):
            story.append(Paragraph(_esc(str(visa_info["note"])), styles["TripBody"]))
        elif visa_info.get("visa_required"):
            story.append(
                Paragraph(
                    f"<b>Visa required:</b> {_esc(str(visa_info.get('type', 'Check embassy')))}",
                    styles["TripBody"],
                )
            )
            story.append(
                Paragraph(
                    f"<b>Processing time:</b> {_esc(str(visa_info.get('processing', 'Varies')))}",
                    styles["TripBody"],
                )
            )
        else:
            story.append(
                Paragraph(
                    f"<b>No visa required.</b> {_esc(str(visa_info.get('type', '')))}",
                    styles["TripBody"],
                )
            )

        checklist = visa_info.get("checklist", [])
        if checklist and isinstance(checklist, list):
            story.append(Spacer(1, 4))
            for item in checklist:
                text = item.get("text", item) if isinstance(item, dict) else item
                story.append(Paragraph(f"\u25a1  {_esc(str(text))}", styles["CheckItem"]))

        warnings = visa_info.get("warnings", [])
        if warnings and isinstance(warnings, list):
            story.append(Spacer(1, 6))
            for w in warnings:
                story.append(
                    Paragraph(
                        f"<font color='#{RED_HEX}'>\u26a0 {_esc(str(w))}</font>",
                        styles["PlaceInfo"],
                    )
                )

    # ═══════════════════════════════════════
    # PRE-TRIP CHECKLIST
    # ═══════════════════════════════════════

    story.append(Paragraph("Pre-Trip Checklist", styles["Section"]))

    pre_trip_items = [
        "Confirm all bookings (flights, hotels, activities)",
        "Check passport validity (6+ months from travel date)",
        "Arrange visa if required",
        "Get travel insurance",
        "Notify bank of travel dates",
        "Download offline maps for destination",
        "Share itinerary with emergency contact",
        "Check weather forecast and pack accordingly",
    ]

    for item in pre_trip_items:
        story.append(Paragraph(f"\u25a1  {item}", styles["CheckItem"]))

    # ═══════════════════════════════════════
    # PACKING CHECKLIST
    # ═══════════════════════════════════════

    story.append(Paragraph("Packing Checklist", styles["Section"]))

    # Documents
    story.append(Paragraph("<b>Documents & Money</b>", styles["RefKey"]))
    story.append(Spacer(1, 3))
    doc_items = [
        "Passport (valid 6+ months)",
        "Visa documents (if required)",
        "Flight confirmation (printed + phone)",
        "Hotel/hostel booking confirmation",
        "Travel insurance details",
        "Copies of all documents (email yourself)",
        "Local currency or travel card",
        "Credit/debit cards (notify bank)",
    ]
    for item in doc_items:
        story.append(Paragraph(f"\u25a1  {item}", styles["CheckItem"]))

    story.append(Spacer(1, 6))

    # Electronics
    story.append(Paragraph("<b>Electronics</b>", styles["RefKey"]))
    story.append(Spacer(1, 3))
    electronics = [
        "Phone + charger",
        "Portable battery pack",
    ]

    plug = str(essentials.get("power_plug") or essentials.get("powerPlug") or "")
    if plug and "Type G" in plug:
        electronics.append("UK power adapter (Type G)")
    elif plug and "Type C" in plug:
        electronics.append("European power adapter (Type C/E)")
    elif plug and "Type A" not in plug:
        electronics.append("Universal power adapter")
    else:
        electronics.append("Power adapter (check plug type)")

    electronics.append("Headphones")
    for item in electronics:
        story.append(Paragraph(f"\u25a1  {item}", styles["CheckItem"]))

    story.append(Spacer(1, 6))

    # Health & Comfort
    story.append(Paragraph("<b>Health & Comfort</b>", styles["RefKey"]))
    story.append(Spacer(1, 3))
    health_items = [
        "Medications + prescriptions",
        "First aid basics (band-aids, painkillers)",
        "Sunscreen + sunglasses",
        "Hand sanitizer",
    ]

    water = str(essentials.get("water_safety") or essentials.get("waterSafety") or "")
    if water and ("NOT" in water.upper() or "bottled" in water.lower()):
        health_items.append("Reusable water bottle (for bottled water)")
    else:
        health_items.append("Reusable water bottle")

    for item in health_items:
        story.append(Paragraph(f"\u25a1  {item}", styles["CheckItem"]))

    # ═══════════════════════════════════════
    # USEFUL PHRASES (non-English destinations)
    # ═══════════════════════════════════════

    language = essentials.get("language", "")
    lang_str = str(language).strip() if language not in (None, "") else ""
    if lang_str and "English" not in (lang_str.split("(")[0].strip() or ""):
        lang_name = (
            lang_str.split("(")[0].strip().split(",")[0].strip() or "Local"
        )

        story.append(Paragraph(f"Useful {_esc(lang_name)} Phrases", styles["Section"]))
        story.append(
            Paragraph(
                f"The primary language is {_esc(lang_str)}. Here are essential phrases:",
                styles["SectionSub"],
            )
        )

        PHRASES = {
            "Japanese": [
                ("Hello", "Konnichiwa"),
                ("Thank you", "Arigatou gozaimasu"),
                ("Excuse me", "Sumimasen"),
                ("Yes / No", "Hai / Iie"),
                ("How much?", "Ikura desu ka?"),
                ("Where is...?", "...wa doko desu ka?"),
                ("Delicious!", "Oishii!"),
                ("Check please", "Okaikei onegaishimasu"),
                ("I don't understand", "Wakarimasen"),
                ("Help!", "Tasukete!"),
            ],
            "French": [
                ("Hello", "Bonjour"),
                ("Thank you", "Merci"),
                ("Please", "S'il vous plait"),
                ("Yes / No", "Oui / Non"),
                ("How much?", "Combien?"),
                ("Where is...?", "Ou est...?"),
                ("The check please", "L'addition s'il vous plait"),
                ("I don't understand", "Je ne comprends pas"),
                ("Do you speak English?", "Parlez-vous anglais?"),
                ("Help!", "Au secours!"),
            ],
            "Thai": [
                ("Hello", "Sawadee (krap/ka)"),
                ("Thank you", "Khop khun (krap/ka)"),
                ("Yes / No", "Chai / Mai chai"),
                ("How much?", "Tao rai?"),
                ("Too expensive", "Paeng pai"),
                ("Delicious!", "Aroi!"),
                ("Where is...?", "...yoo tee nai?"),
                ("No spicy", "Mai pet"),
                ("The bill please", "Check bin"),
                ("Help!", "Chuay duay!"),
            ],
            "Hindi": [
                ("Hello", "Namaste"),
                ("Thank you", "Dhanyavaad / Shukriya"),
                ("Yes / No", "Haan / Nahi"),
                ("How much?", "Kitna hai?"),
                ("Too expensive", "Bahut mehenga hai"),
                ("Where is...?", "...kahan hai?"),
                ("Delicious!", "Bahut accha!"),
                ("I don't understand", "Mujhe samajh nahi aaya"),
                ("Water please", "Paani dijiye"),
                ("Help!", "Madad karo!"),
            ],
            "Arabic": [
                ("Hello", "Marhaba / Salam"),
                ("Thank you", "Shukran"),
                ("Yes / No", "Na'am / La"),
                ("How much?", "Bikam?"),
                ("Where is...?", "Wayn...?"),
                ("The check please", "Al hisab min fadlak"),
                ("I don't understand", "Ma afham"),
                ("Do you speak English?", "Tatakallam inglizi?"),
                ("God willing", "Inshallah"),
                ("Help!", "Musaada!"),
            ],
            "Spanish": [
                ("Hello", "Hola"),
                ("Thank you", "Gracias"),
                ("Please", "Por favor"),
                ("Yes / No", "Si / No"),
                ("How much?", "Cuanto cuesta?"),
                ("Where is...?", "Donde esta...?"),
                ("The check please", "La cuenta por favor"),
                ("I don't understand", "No entiendo"),
                ("Do you speak English?", "Habla ingles?"),
                ("Help!", "Ayuda!"),
            ],
            "Italian": [
                ("Hello", "Ciao / Buongiorno"),
                ("Thank you", "Grazie"),
                ("Please", "Per favore"),
                ("Yes / No", "Si / No"),
                ("How much?", "Quanto costa?"),
                ("Where is...?", "Dove...?"),
                ("The check please", "Il conto per favore"),
                ("I don't understand", "Non capisco"),
                ("Do you speak English?", "Parla inglese?"),
                ("Help!", "Aiuto!"),
            ],
            "Portuguese": [
                ("Hello", "Ola"),
                ("Thank you", "Obrigado/Obrigada"),
                ("Please", "Por favor"),
                ("Yes / No", "Sim / Nao"),
                ("How much?", "Quanto custa?"),
                ("Where is...?", "Onde fica...?"),
                ("The check please", "A conta por favor"),
                ("I don't understand", "Nao entendo"),
                ("Do you speak English?", "Fala ingles?"),
                ("Help!", "Socorro!"),
            ],
            "German": [
                ("Hello", "Hallo / Guten Tag"),
                ("Thank you", "Danke"),
                ("Please", "Bitte"),
                ("Yes / No", "Ja / Nein"),
                ("How much?", "Wie viel kostet das?"),
                ("Where is...?", "Wo ist...?"),
                ("The check please", "Die Rechnung bitte"),
                ("I don't understand", "Ich verstehe nicht"),
                ("Do you speak English?", "Sprechen Sie Englisch?"),
                ("Help!", "Hilfe!"),
            ],
            "Korean": [
                ("Hello", "Annyeonghaseyo"),
                ("Thank you", "Gamsahamnida"),
                ("Yes / No", "Ne / Aniyo"),
                ("How much?", "Eolma-eyo?"),
                ("Where is...?", "...eodi-eyo?"),
                ("Delicious!", "Mashisseoyo!"),
                ("The check please", "Gyesanseo juseyo"),
                ("I don't understand", "Moreugeseoyo"),
                ("Do you speak English?", "Yeongeo hashimnikka?"),
                ("Help!", "Dowajuseyo!"),
            ],
            "Turkish": [
                ("Hello", "Merhaba"),
                ("Thank you", "Tesekkur ederim"),
                ("Yes / No", "Evet / Hayir"),
                ("How much?", "Ne kadar?"),
                ("Where is...?", "...nerede?"),
                ("Delicious!", "Cok guzel!"),
                ("The check please", "Hesap lutfen"),
                ("I don't understand", "Anlamiyorum"),
                ("Do you speak English?", "Ingilizce biliyor musunuz?"),
                ("Help!", "Imdat!"),
            ],
        }

        lang_phrases = PHRASES.get(
            lang_name,
            [
                ("Hello / Thank you", "Look up before your trip"),
                ("Where is...?", "Point-and-show works too"),
                ("How much?", "Calculator app is universal"),
            ],
        )

        phrase_data = [["English", lang_name]] + lang_phrases
        pt = Table(_normalize_table_rows(phrase_data), colWidths=[55 * mm, 115 * mm])
        pt.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("BACKGROUND", (0, 0), (-1, 0), DARK),
                    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        story.append(pt)

    # ═══════════════════════════════════════
    # EMERGENCY CONTACTS
    # ═══════════════════════════════════════

    story.append(Paragraph("Emergency Contacts", styles["Section"]))

    em_data = []
    if em_nums and isinstance(em_nums, dict):
        for k, v in em_nums.items():
            if k != "note":
                em_data.append([str(k).title(), _table_cell(v)])

    # Always include general emergency entries
    em_data.append(["Your Embassy", f"Look up {dest_country or dest} embassy before traveling"])
    em_data.append(["Travel Insurance", "Save your policy number and hotline"])
    em_data.append(["Emergency Contact", "Share this PDF with someone at home"])

    if em_data:
        et = Table(_normalize_table_rows(em_data), colWidths=[45 * mm, 125 * mm])
        et.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (0, -1), DARK),
                    ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [RED_BG, WHITE]),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(et)

    # ═══════════════════════════════════════
    # FOOTER
    # ═══════════════════════════════════════

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND, spaceAfter=8))
    story.append(
        Paragraph(
            f"<font color='#{BRAND_HEX}'><b>RAHIFY</b></font> | Your trip, planned.",
            styles["CenterSmall"],
        )
    )
    story.append(
        Paragraph(
            "rahify.com | Prices are estimates. Verify bookings and visa requirements independently.",
            styles["CenterSmall"],
        )
    )

    doc.build(story)
    result = buffer.getvalue()
    buffer.close()
    return result


def _minimal_fallback_pdf(trip: dict) -> bytes:
    """Single-page PDF if the full renderer fails — user still gets a download."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    styles = getSampleStyleSheet()
    tid = str(trip.get("id") or trip.get("trip_id") or "")
    dest = str(
        trip.get("destination_city") or trip.get("destinationCity") or "your trip"
    )
    body = (
        "We could not render the full PDF for this trip (unexpected data or layout). "
        "Your itinerary is still available in the app at rahify.com."
    )
    if tid:
        body = f"{body} Reference: {tid}."
    story = [
        Paragraph("<b>Rahify</b> — trip PDF", styles["Title"]),
        Spacer(1, 16),
        Paragraph(_esc(dest), styles["Heading2"]),
        Spacer(1, 12),
        Paragraph(_esc(body), styles["Normal"]),
    ]
    doc.build(story)
    data = buf.getvalue()
    buf.close()
    return data


def generate_trip_pdf(trip: dict, places: list, visa_info: dict, essentials: dict) -> bytes:
    try:
        return _generate_trip_pdf_impl(trip, places, visa_info, essentials)
    except Exception:
        traceback.print_exc()
        return _minimal_fallback_pdf(trip if isinstance(trip, dict) else {})
