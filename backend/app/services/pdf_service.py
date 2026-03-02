from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER
from io import BytesIO

# Brand colors
BRAND_ORANGE = colors.HexColor("#F97316")
DARK_BG = colors.HexColor("#0F172A")
DARK_TEXT = colors.HexColor("#1E293B")
MUTED_TEXT = colors.HexColor("#6B7280")
LIGHT_BG = colors.HexColor("#F9FAFB")
BORDER_COLOR = colors.HexColor("#E5E7EB")


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            "TripTitle",
            parent=styles["Title"],
            fontSize=22,
            textColor=DARK_TEXT,
            spaceAfter=6,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=BRAND_ORANGE,
            spaceBefore=20,
            spaceAfter=8,
            borderWidth=0,
            borderPadding=0,
        )
    )
    styles.add(
        ParagraphStyle(
            "DayHeader",
            parent=styles["Heading3"],
            fontSize=12,
            textColor=DARK_TEXT,
            spaceBefore=14,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "ActivityText",
            parent=styles["Normal"],
            fontSize=9,
            textColor=DARK_TEXT,
            spaceAfter=4,
            leftIndent=12,
        )
    )
    styles.add(
        ParagraphStyle(
            "ActivityDetail",
            parent=styles["Normal"],
            fontSize=8,
            textColor=MUTED_TEXT,
            spaceAfter=6,
            leftIndent=12,
        )
    )
    styles.add(
        ParagraphStyle(
            "SmallText",
            parent=styles["Normal"],
            fontSize=8,
            textColor=MUTED_TEXT,
        )
    )
    styles.add(
        ParagraphStyle(
            "CenterText",
            parent=styles["Normal"],
            fontSize=9,
            textColor=DARK_TEXT,
            alignment=TA_CENTER,
        )
    )

    return styles


def generate_trip_pdf(trip: dict, places: list, visa_info: dict, essentials: dict) -> bytes:
    """Generate a complete trip PDF. Returns bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )
    styles = build_styles()
    story = []

    # HEADER
    origin = trip.get("origin_city", "?")
    dest = trip.get("destination_city", "?")
    days = trip.get("num_days", "?")
    dates = ""
    if trip.get("start_date") and trip.get("end_date"):
        dates = f" · {trip['start_date']} to {trip['end_date']}"

    story.append(Paragraph("✈️ Rahi AI", styles["CenterText"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"{origin} → {dest}", styles["TripTitle"]))
    story.append(
        Paragraph(
            f"{days} Days{dates} · {trip.get('num_travelers', 1)} Traveler(s)",
            styles["CenterText"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        HRFlowable(
            width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=12
        )
    )

    # ITINERARY
    itinerary = trip.get("itinerary", {})
    itinerary_days = (
        itinerary.get("itinerary", []) if isinstance(itinerary, dict) else []
    )

    if itinerary_days:
        story.append(Paragraph("📋 Your Itinerary", styles["SectionHeader"]))

        for day in itinerary_days:
            day_num = day.get("day_number", "?")
            title = day.get("title", "")
            story.append(
                Paragraph(f"Day {day_num} — {title}", styles["DayHeader"])
            )

            for act in day.get("activities", []) or []:
                time = act.get("time", "")
                act_title = act.get("title", "Activity")
                detail = act.get("detail", "")
                act_type = act.get("type", "")

                emoji = {
                    "food": "🍽",
                    "attraction": "📍",
                    "hotel": "🏨",
                    "free": "✨",
                }.get(act_type, "•")
                story.append(
                    Paragraph(
                        f"{emoji} {time} — <b>{act_title}</b>",
                        styles["ActivityText"],
                    )
                )
                if detail:
                    story.append(
                        Paragraph(detail, styles["ActivityDetail"])
                    )

    # COST BREAKDOWN
    costs = trip.get("cost_estimate") or {}
    if costs:
        story.append(Paragraph("💰 Cost Estimate", styles["SectionHeader"]))

        def safe_total(section: str, key: str, default: int = 0) -> int:
            try:
                return int(costs.get(section, {}).get(key, default) or 0)
            except Exception:
                return default

        cost_data = [
            ["Category", "Total", "Daily"],
            [
                "🏨 Accommodation",
                f"${safe_total('accommodation', 'total'):,}",
                f"${safe_total('accommodation', 'per_night')}/night",
            ],
            [
                "🍽 Food",
                f"${safe_total('food', 'total'):,}",
                f"${safe_total('food', 'per_day')}/day",
            ],
            [
                "📍 Activities",
                f"${safe_total('activities', 'total'):,}",
                f"${safe_total('activities', 'per_day')}/day",
            ],
            [
                "🚕 Local Transport",
                f"${safe_total('local_transport', 'total'):,}",
                f"${safe_total('local_transport', 'per_day')}/day",
            ],
            [
                "✈️ Flights",
                f"${safe_total('flights', 'total'):,}",
                f"${safe_total('flights', 'per_person')}/person",
            ],
            ["", "", ""],
            [
                "TOTAL",
                f"${safe_total('root', 'total', costs.get('total', 0)):,}",
                f"${safe_total('root', 'per_person', costs.get('per_person', 0)):,}/person",
            ],
        ]

        t = Table(cost_data, colWidths=[55 * mm, 40 * mm, 45 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("BACKGROUND", (0, 0), (-1, 0), DARK_BG),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    (
                        "BACKGROUND",
                        (0, -1),
                        (-1, -1),
                        colors.HexColor("#FFF7ED"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, -1),
                        (-1, -1),
                        BRAND_ORANGE,
                    ),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -2), 0.5, BORDER_COLOR),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -2),
                        [colors.white, LIGHT_BG],
                    ),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(t)

    # VISA INFO
    if visa_info:
        story.append(Paragraph("🛂 Visa & Entry", styles["SectionHeader"]))

        if visa_info.get("note"):
            story.append(Paragraph(visa_info["note"], styles["ActivityText"]))
        elif visa_info.get("visa_required"):
            story.append(
                Paragraph(
                    f"<b>Visa required:</b> {visa_info.get('type', 'Check embassy')}",
                    styles["ActivityText"],
                )
            )
            story.append(
                Paragraph(
                    f"Processing: {visa_info.get('processing', 'Varies')}",
                    styles["ActivityDetail"],
                )
            )
        else:
            story.append(
                Paragraph(
                    f"<b>No visa required!</b> {visa_info.get('type', '')}",
                    styles["ActivityText"],
                )
            )

        checklist = visa_info.get("checklist", [])
        if checklist:
            story.append(Spacer(1, 4))
            story.append(
                Paragraph("<b>Document Checklist:</b>", styles["ActivityText"])
            )
            for item in checklist:
                text = item.get("text") if isinstance(item, dict) else item
                story.append(
                    Paragraph(f"☐ {text}", styles["ActivityDetail"])
                )

    # TRAVEL ESSENTIALS
    if essentials:
        story.append(Paragraph("🧳 Travel Essentials", styles["SectionHeader"]))

        essentials_items = [
            ("🗣", "Language", essentials.get("language", "")),
            (
                "🚨",
                "Emergency",
                ", ".join(
                    f"{k}: {v}"
                    for k, v in essentials.get("emergency_numbers", {}).items()
                    if k != "note"
                ),
            ),
            ("💡", "Tipping", essentials.get("tipping", "")),
            ("🔌", "Power", essentials.get("power_plug", "")),
            ("📱", "SIM", essentials.get("sim_advice", "")),
            ("💧", "Water", essentials.get("water_safety", "")),
            ("🕐", "Timezone", essentials.get("timezone", "")),
            ("💰", "Currency", essentials.get("currency_info", "")),
        ]

        for emoji, label, value in essentials_items:
            if value:
                story.append(
                    Paragraph(
                        f"{emoji} <b>{label}:</b> {value}",
                        styles["ActivityText"],
                    )
                )

    # FOOTER
    story.append(Spacer(1, 30))
    story.append(
        HRFlowable(
            width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=8
        )
    )
    story.append(
        Paragraph("Generated by Rahi AI · rahi.ai", styles["CenterText"])
    )

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

