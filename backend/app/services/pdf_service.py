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
from io import BytesIO
import urllib.parse

# Colors
BRAND = colors.HexColor("#F97316")
BRAND_BG = colors.HexColor("#FFF7ED")
DARK = colors.HexColor("#0F172A")
TEXT = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#6B7280")
LIGHT_BG = colors.HexColor("#F9FAFB")
BORDER = colors.HexColor("#E5E7EB")
GREEN = colors.HexColor("#10B981")
BLUE = colors.HexColor("#3B82F6")
RED = colors.HexColor("#EF4444")
WHITE = colors.white

# Hex strings for use in link tags (ReportLab Color has no hexval())
BLUE_HEX = "3B82F6"
MUTED_HEX = "6B7280"
BRAND_HEX = "F97316"


def build_styles():
    s = getSampleStyleSheet()
    s.add(
        ParagraphStyle(
            "Brand",
            parent=s["Normal"],
            fontSize=10,
            textColor=BRAND,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        )
    )
    s.add(
        ParagraphStyle(
            "TripTitle",
            parent=s["Title"],
            fontSize=22,
            textColor=DARK,
            spaceAfter=2,
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
            "BodyText",
            parent=s["Normal"],
            fontSize=9,
            textColor=TEXT,
            spaceAfter=4,
        )
    )
    return s


def maps_link(name, lat=None, lng=None, place_id=None):
    """Generate a tappable Google Maps URL."""
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


def _safe_cost(costs, section, key, default=0):
    """Safe int from cost_estimate nested dict."""
    try:
        if section == "root":
            val = costs.get(key, default)
        else:
            val = (costs.get(section) or {}).get(key, default)
        return int(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def generate_trip_pdf(trip: dict, places: list, visa_info: dict, essentials: dict) -> bytes:
    """Generate enhanced trip PDF: quick ref, itinerary with Maps links, costs, visa, packing, phrases."""
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

    origin = trip.get("origin_city", "?")
    dest = trip.get("destination_city", "?")
    days = trip.get("num_days", "?")
    travelers = trip.get("num_travelers", 1)
    dates_str = ""
    if trip.get("start_date") and trip.get("end_date"):
        dates_str = f"{trip['start_date']} to {trip['end_date']}"

    # ═══════════════════════════════════════
    # PAGE 1: COVER + QUICK REFERENCE CARD
    # ═══════════════════════════════════════

    story.append(Spacer(1, 30))
    story.append(Paragraph("Rahi AI", styles["Brand"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{origin} to {dest}", styles["TripTitle"]))
    story.append(
        Paragraph(
            f"{days} Days  |  {travelers} Traveler{'s' if travelers != 1 else ''}  |  {dates_str}",
            styles["Subtitle"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=16))

    # Quick Reference Card
    story.append(
        Paragraph("Quick Reference — Screenshot This Page", styles["Section"])
    )

    essentials = essentials or {}
    ref_data = []
    em_nums = essentials.get("emergency_numbers") or essentials.get(
        "emergencyNumbers"
    )
    if em_nums and isinstance(em_nums, dict):
        emergency = " | ".join(
            f"{k.title()}: {v}" for k, v in em_nums.items() if k != "note"
        )
        if emergency:
            ref_data.append(["Emergency", emergency])

    ref_data.append(
        ["Language", essentials.get("language", "Check before travel")]
    )
    ref_data.append(
        [
            "Currency",
            essentials.get("currency_info") or essentials.get("currencyInfo")
            or "Check exchange rates",
        ]
    )
    ref_data.append(["Tipping", essentials.get("tipping", "Varies")])
    ref_data.append(
        ["Power", essentials.get("power_plug") or essentials.get("powerPlug") or "Bring universal adapter"]
    )
    ref_data.append(
        [
            "Water",
            essentials.get("water_safety") or essentials.get("waterSafety")
            or "When in doubt, bottled",
        ]
    )
    ref_data.append(
        [
            "SIM/Data",
            essentials.get("sim_advice") or essentials.get("simAdvice")
            or "Buy local SIM at airport",
        ]
    )
    ref_data.append(
        ["Timezone", essentials.get("timezone", "Check before travel")]
    )

    dress = essentials.get("dress_code") or essentials.get("dressCode")
    if dress:
        ref_data.append(["Dress Code", dress])

    if ref_data:
        t = Table(ref_data, colWidths=[30 * mm, 140 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (0, -1), DARK),
                    ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                    ("BACKGROUND", (0, 0), (-1, -1), BRAND_BG),
                    (
                        "ROWBACKGROUNDS",
                        (0, 0),
                        (-1, -1),
                        [BRAND_BG, WHITE],
                    ),
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
    story.append(Spacer(1, 12))
    visa_info = visa_info or {}
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

    visa_color = (
        GREEN
        if visa_info.get("visa_required") is False
        else RED
    )
    story.append(
        Table(
            [
                [
                    Paragraph(
                        f"<b>Visa:</b> {visa_text}",
                        styles["BodyText"],
                    )
                ]
            ],
            colWidths=[170 * mm],
            style=TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor("#F0FDF4")
                        if visa_info.get("visa_required") is False
                        else colors.HexColor("#FEF2F2"),
                    ),
                    ("BORDER", (0, 0), (-1, -1), 1, visa_color),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ]
            ),
        )
    )

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # PAGES 2+: DAY-BY-DAY ITINERARY
    # ═══════════════════════════════════════

    story.append(Paragraph("Your Itinerary", styles["Section"]))

    itinerary = trip.get("itinerary", {})
    itinerary_days = (
        itinerary.get("itinerary", [])
        if isinstance(itinerary, dict)
        else []
    )

    place_lookup = {}
    for p in places or []:
        pid = p.get("google_place_id") or p.get("googlePlaceId") or ""
        if pid:
            place_lookup[pid] = p
        name_key = (p.get("name") or "").lower()
        if name_key:
            place_lookup[name_key] = p

    for day in itinerary_days:
        day_num = day.get("day_number", "?")
        title = day.get("title", "")

        day_header = Table(
            [
                [
                    Paragraph(
                        f"Day {day_num} — {title}",
                        styles["DayTitle"],
                    )
                ]
            ],
            colWidths=[170 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), DARK),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ]
            ),
        )
        story.append(day_header)
        story.append(Spacer(1, 6))

        for act in day.get("activities") or []:
            time = act.get("time", "")
            act_title = act.get("title", "Activity")
            detail = act.get("detail", "")
            act_type = act.get("type", "")
            place_id = act.get("place_id") or act.get("placeId", "")

            type_label = {
                "food": "EAT",
                "attraction": "VISIT",
                "hotel": "STAY",
                "free": "FREE",
            }.get(act_type, "")

            matched = place_lookup.get(place_id) or place_lookup.get(
                (act_title or "").lower()
            )
            address = ""
            rating = None
            gmap_url = ""
            if matched:
                address = matched.get("address") or ""
                rating = matched.get("rating")
                gmap_url = maps_link(
                    act_title,
                    matched.get("lat"),
                    matched.get("lng"),
                    matched.get("google_place_id")
                    or matched.get("googlePlaceId"),
                )

            activity_parts = []

            time_line = f"<b>{time}</b>"
            if type_label:
                time_line += f"  <font color='#{BRAND_HEX}'>[{type_label}]</font>"
            activity_parts.append(Paragraph(time_line, styles["Time"]))

            if gmap_url:
                name_text = (
                    f"<b><a href='{gmap_url}' color='#{BLUE_HEX}'>{act_title}</a></b>"
                )
            else:
                name_text = f"<b>{act_title}</b>"

            if rating is not None:
                name_text += f"  <font color='#{MUTED_HEX}'>({rating})</font>"
            activity_parts.append(Paragraph(name_text, styles["PlaceName"]))

            if address:
                activity_parts.append(
                    Paragraph(
                        f"<font color='#{MUTED_HEX}'>{address}</font>",
                        styles["PlaceInfo"],
                    )
                )

            if detail:
                activity_parts.append(Paragraph(detail, styles["PlaceDetail"]))

            activity_parts.append(Spacer(1, 6))
            story.append(KeepTogether(activity_parts))

        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # COST BREAKDOWN
    # ═══════════════════════════════════════

    costs = trip.get("cost_estimate") or {}
    if costs:
        story.append(Paragraph("Cost Estimate", styles["Section"]))

        cost_rows = [
            ["Category", "Total", "Rate"],
            [
                "Accommodation",
                f"${_safe_cost(costs, 'accommodation', 'total'):,}",
                f"${_safe_cost(costs, 'accommodation', 'per_night')}/night",
            ],
            [
                "Food",
                f"${_safe_cost(costs, 'food', 'total'):,}",
                f"${_safe_cost(costs, 'food', 'per_day')}/day",
            ],
            [
                "Activities",
                f"${_safe_cost(costs, 'activities', 'total'):,}",
                f"${_safe_cost(costs, 'activities', 'per_day')}/day",
            ],
            [
                "Local Transport",
                f"${_safe_cost(costs, 'local_transport', 'total'):,}",
                f"${_safe_cost(costs, 'local_transport', 'per_day')}/day",
            ],
            [
                "Flights",
                f"${_safe_cost(costs, 'flights', 'total'):,}",
                f"${_safe_cost(costs, 'flights', 'per_person')}/person",
            ],
        ]
        total_row = [
            "TOTAL",
            f"${_safe_cost(costs, 'root', 'total', costs.get('total', 0)):,}",
            f"${_safe_cost(costs, 'root', 'per_person', costs.get('per_person', 0)):,}/person",
        ]

        t = Table(cost_rows + [total_row], colWidths=[65 * mm, 45 * mm, 60 * mm])
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
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("BACKGROUND", (0, -1), (-1, -1), BRAND_BG),
                    ("TEXTCOLOR", (0, -1), (-1, -1), BRAND),
                    ("LINEABOVE", (0, -1), (-1, -1), 1.5, BRAND),
                ]
            )
        )
        story.append(t)

    # ═══════════════════════════════════════
    # YOUR PLACES — Full list with addresses
    # ═══════════════════════════════════════

    story.append(Paragraph("Your Places", styles["Section"]))
    story.append(
        Paragraph(
            "All places in your itinerary with addresses. Tap place names to open in Google Maps.",
            styles["SmallMuted"],
        )
    )
    story.append(Spacer(1, 6))

    categories = {}
    for p in places or []:
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
        "other": "Other",
    }

    for cat, cat_places in categories.items():
        label = cat_labels.get(cat, cat.title())
        story.append(Paragraph(f"<b>{label}</b>", styles["RefKey"]))
        story.append(Spacer(1, 3))

        for p in cat_places:
            gurl = maps_link(
                p.get("name", ""),
                p.get("lat"),
                p.get("lng"),
                p.get("google_place_id") or p.get("googlePlaceId"),
            )
            line = f"<a href='{gurl}' color='#{BLUE_HEX}'>{p.get('name', '')}</a>"
            if p.get("rating") is not None:
                line += f" ({p['rating']})"
            addr = p.get("address") or ""
            if addr:
                line += f" — <font color='#{MUTED_HEX}'>{addr}</font>"
            story.append(Paragraph(line, styles["PlaceInfo"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 6))

    # ═══════════════════════════════════════
    # VISA & DOCUMENTS CHECKLIST
    # ═══════════════════════════════════════

    if visa_info:
        story.append(Paragraph("Visa and Documents", styles["Section"]))

        if visa_info.get("note"):
            story.append(Paragraph(visa_info["note"], styles["BodyText"]))
        elif visa_info.get("visa_required"):
            story.append(
                Paragraph(
                    f"<b>Visa required:</b> {visa_info.get('type', 'Check embassy')}",
                    styles["BodyText"],
                )
            )
            story.append(
                Paragraph(
                    f"<b>Processing time:</b> {visa_info.get('processing', 'Varies')}",
                    styles["BodyText"],
                )
            )
        else:
            story.append(
                Paragraph(
                    f"<b>No visa required.</b> {visa_info.get('type', '')}",
                    styles["BodyText"],
                )
            )

        checklist = visa_info.get("checklist", [])
        if checklist:
            story.append(Spacer(1, 4))
            for item in checklist:
                text = item.get("text", item) if isinstance(item, dict) else item
                story.append(Paragraph(f"[ ]  {text}", styles["CheckItem"]))

        warnings = visa_info.get("warnings", [])
        if warnings:
            story.append(Spacer(1, 6))
            for w in warnings:
                story.append(Paragraph(f"! {w}", styles["PlaceInfo"]))

    # ═══════════════════════════════════════
    # PACKING CHECKLIST
    # ═══════════════════════════════════════

    story.append(Paragraph("Packing Checklist", styles["Section"]))

    packing_essentials = [
        "Passport (valid 6+ months)",
        "Visa documents (if required)",
        "Flight confirmation (printed + phone)",
        "Hotel/hostel booking confirmation",
        "Travel insurance details",
        "Copies of all documents (email yourself)",
        "Local currency or travel card",
        "Phone charger + power adapter",
        "Medications + prescriptions",
    ]

    plug = (
        essentials.get("power_plug")
        or essentials.get("powerPlug")
        or ""
    )
    if plug and "Type G" in plug:
        packing_essentials.append("UK power adapter (Type G)")
    elif plug and "Type C" in plug:
        packing_essentials.append("European power adapter (Type C/E)")
    elif plug and "Type A" not in plug:
        packing_essentials.append("Universal power adapter")

    water = (
        essentials.get("water_safety") or essentials.get("waterSafety") or ""
    )
    if water and ("NOT" in water.upper() or "bottled" in water.lower()):
        packing_essentials.append(
            "Reusable water bottle (for bottled water)"
        )

    for item in packing_essentials:
        story.append(Paragraph(f"[ ]  {item}", styles["CheckItem"]))

    # ═══════════════════════════════════════
    # USEFUL PHRASES (non-English destinations)
    # ═══════════════════════════════════════

    language = essentials.get("language", "")
    if language and "English" not in (language.split("(")[0].strip() or ""):
        lang_name = (
            language.split("(")[0].strip().split(",")[0].strip() or "Local"
        )

        story.append(
            Paragraph(f"Useful {lang_name} Phrases", styles["Section"])
        )
        story.append(
            Paragraph(
                f"The primary language is {language}. Here are essential phrases:",
                styles["SmallMuted"],
            )
        )
        story.append(Spacer(1, 6))

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
        pt = Table(phrase_data, colWidths=[55 * mm, 115 * mm])
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
    # FOOTER
    # ═══════════════════════════════════════

    story.append(Spacer(1, 30))
    story.append(
        HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8)
    )
    story.append(
        Paragraph("Generated by Rahi AI | rahi.ai", styles["CenterSmall"])
    )
    story.append(
        Paragraph(
            "Prices are estimates. Verify bookings and visa requirements independently.",
            styles["CenterSmall"],
        )
    )

    doc.build(story)
    result = buffer.getvalue()
    buffer.close()
    return result
