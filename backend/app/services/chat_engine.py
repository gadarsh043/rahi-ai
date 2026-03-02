import re
from typing import Optional

# ============================================
# INTENT CLASSIFIER (regex — zero tokens)
# ============================================

# Patterns that mean "remove"
REMOVE_PATTERNS = [
    r"(?:remove|delete|drop|take out|get rid of|skip|ditch|scratch|cancel|no more)\s+(.+?)(?:\s+from|\s+on|\s+and|\s*[.,!?]?\s*$)",
    r"(?:i\s+don'?t\s+(?:like|want|need))\s+(.+?)(?:\s+anymore|\s+any more|\s*[.,!?]?\s*$)",
    r"(?:not\s+interested\s+in)\s+(.+?)(?:\s*[.,!?]?\s*$)",
]

# Patterns that mean "add"
ADD_PATTERNS = [
    r"(?:add|include|put|throw in)\s+(.+?)(?:\s+to\s+(?:day\s*(\d+)))?(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?",
]

# Patterns that mean "replace/swap"
SWAP_PATTERNS = [
    r"(?:replace|swap|switch|exchange)\s+(.+?)\s+(?:with|for)\s+(.+?)(?:\s*[.,!?]?\s*$)",
]

# Patterns that mean "cancel current action"
CANCEL_PATTERNS = [
    r"(?:never\s*mind|cancel|forget\s*it|skip|nah|nope|no\s+thanks)",
]

# Patterns that mean "yes/confirm"
CONFIRM_PATTERNS = [
    r"^(?:yes|yeah|yep|yup|sure|ok|okay|go\s+ahead|do\s+it|confirm|absolutely|please)(?:\s*[.,!?]?\s*$)",
]


def parse_time(text: str) -> Optional[str]:
    """Parse '5pm', '17:00', '5:30 PM' etc into 'HH:MM' format."""
    text = text.strip().lower()
    m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", text)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    period = m.group(3)
    if period == "pm" and hour < 12:
        hour += 12
    if period == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def parse_day(text: str) -> Optional[int]:
    """Parse 'day 3', 'Day 3', '3', 'third day' into int."""
    m = re.search(r"day\s*(\d+)", text.lower())
    if m:
        return int(m.group(1))
    m = re.match(r"^(\d+)$", text.strip())
    if m:
        return int(m.group(1))
    return None


def find_place_by_name(name: str, places: list) -> Optional[dict]:
    """Fuzzy match a place name against the places list."""
    name_lower = name.lower().strip()
    # Exact match
    for p in places:
        if p["name"].lower() == name_lower:
            return p
    # Partial match (user said "kerry park", place is "Kerry Park - Seattle")
    for p in places:
        if name_lower in p["name"].lower() or p["name"].lower() in name_lower:
            return p
    # Word overlap (at least 2 matching words)
    name_words = set(name_lower.split())
    for p in places:
        place_words = set(p["name"].lower().split())
        if len(name_words & place_words) >= 2:
            return p
    return None


# ============================================
# SCOPE GUARD — Block trip-redefining requests
# ============================================

DESTINATION_CHANGE_PATTERNS = [
    r"(?:change|switch|move)\s+(?:the\s+)?(?:destination|trip|city)\s+to\s+(.+?)(?:\s*[.,!?]?\s*$)",
    r"(?:let\'?s?\s+)?(?:go|fly|travel|head)\s+to\s+(.+?)\s+instead",
    r"(?:change|switch)\s+(?:it\s+)?to\s+(.+?)\s+instead",
    r"(?:i\s+want\s+to\s+go\s+to|how\s+about)\s+(.+?)\s+instead",
    r"(?:make\s+it|change\s+it\s+to)\s+(?:a\s+)?(.+?)\s+trip",
    r"(?:actually|instead)\s+(?:let\'?s?\s+)?(?:go|plan|do)\s+(.+?)(?:\s*[.,!?]?\s*$)",
]

ORIGIN_CHANGE_PATTERNS = [
    r"(?:change|switch)\s+(?:the\s+)?(?:origin|departure|starting)\s+(?:city\s+)?to\s+(.+?)(?:\s*[.,!?]?\s*$)",
    r"(?:flying|departing|leaving)\s+from\s+(.+?)\s+instead",
    r"(?:actually\s+)?(?:i\'?m?\s+)?(?:in|from|starting\s+from)\s+(.+?)(?:\s+now|\s+instead)(?:\s*[.,!?]?\s*$)",
]

DURATION_CHANGE_PATTERNS = [
    r"(?:make\s+it|change\s+(?:it\s+)?to|do)\s+(\d+)\s+days?",
    r"(\d+)\s+days?\s+(?:instead|trip)",
]

START_OVER_PATTERNS = [
    r"(?:start\s+(?:over|fresh|again|from\s+scratch))",
    r"(?:new|different|completely\s+different)\s+(?:itinerary|trip|plan)",
    r"(?:scrap|redo|redo)\s+(?:this|the|everything)",
    r"(?:plan\s+(?:a\s+)?(?:new|different)\s+trip)",
]


def check_scope_guard(message: str, trip: dict) -> dict | None:
    """
    Returns a friendly redirect message if the request would change the trip's identity.
    Returns None if the request is within scope (allowed).
    """
    msg_lower = message.lower().strip()
    dest_city = (trip.get("destination_city") or "").lower()
    origin_city = (trip.get("origin_city") or "").lower()
    num_days = trip.get("num_days") or 7

    # Destination change
    for pattern in DESTINATION_CHANGE_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            new_dest = m.group(1).strip()

            # Allow day trips / excursions
            day_trip_words = ["day trip", "side trip", "excursion", "detour", "visit"]
            if any(w in msg_lower for w in day_trip_words):
                return None

            # Ignore if they are referencing the current destination
            if new_dest and (new_dest in dest_city or dest_city in new_dest):
                return None

            return {
                "type": "scope_blocked",
                "response": (
                    "That sounds like an amazing trip! 🌍\n\n"
                    f"Switching from **{trip.get('destination_city', 'your destination')}** to "
                    f"**{new_dest.title()}** is a whole new adventure — new places, new flights, new everything.\n\n"
                    f"👉 Hit **New Trip** to plan your {new_dest.title()} trip.\n"
                    f"This {trip.get('destination_city', '')} trip will stay saved in your sidebar.\n\n"
                    "Want to keep tweaking this trip instead?"
                ),
            }

    # Origin change
    for pattern in ORIGIN_CHANGE_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            new_origin = m.group(1).strip()
            if new_origin and (new_origin in origin_city or origin_city in new_origin):
                return None

            return {
                "type": "scope_blocked",
                "response": (
                    f"Noted! Flying from **{new_origin.title()}** instead of "
                    f"**{trip.get('origin_city', 'your city')}** changes the flight options and logistics.\n\n"
                    f"👉 Hit **New Trip** and set your origin to {new_origin.title()}.\n"
                    "This trip stays saved!\n\n"
                    "Anything else for this trip?"
                ),
            }

    # Major duration change (±3+ days)
    for pattern in DURATION_CHANGE_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            new_days = int(m.group(1))
            diff = abs(new_days - num_days)
            if diff <= 2:
                return None

            return {
                "type": "scope_blocked",
                "response": (
                    f"Going from **{num_days} days** to **{new_days} days** is a pretty big shift — "
                    "the whole schedule would need to be replanned from scratch.\n\n"
                    f"👉 Hit **New Trip** to plan a {new_days}-day version.\n"
                    "Or I can **add/remove a day or two** from this trip if you'd like?\n\n"
                    "What works?"
                ),
            }

    # Start over
    for pattern in START_OVER_PATTERNS:
        if re.search(pattern, msg_lower):
            return {
                "type": "scope_blocked",
                "response": (
                    "Want a fresh start? No problem! 🔄\n\n"
                    "👉 Hit **New Trip** to start from scratch.\n"
                    f"This {trip.get('destination_city', '')} trip will stay saved in your sidebar "
                    "in case you want to come back to it.\n\n"
                    "Or if you just want to change a few things, I can help with that right here!"
                ),
            }

    return None


# ============================================
# MAIN CLASSIFIER
# ============================================

def classify_message(
    message: str,
    places: list,
    pending_action: Optional[dict] = None,
    trip: dict | None = None,
) -> dict:
    """
    Returns:
    {
        "type": "execute" | "ask" | "need_llm",
        "action": { ... } or None,
        "response": "formatted bot message",
        "pending_action": { ... } or None,  # to store for next turn
    }
    """
    msg = message.strip()
    msg_lower = msg.lower()

    # Step -1: SCOPE GUARD — block trip-redefining requests
    if trip:
        scope_block = check_scope_guard(message, trip)
        if scope_block:
            return {
                "type": "execute",
                "action": None,
                "response": scope_block["response"],
                "pending_action": None,
            }

    # Step 0: If there's a pending action, interpret this as an answer
    if pending_action:
        return handle_pending_response(msg, msg_lower, places, pending_action)

    # Step 1: Check for cancel
    for pattern in CANCEL_PATTERNS:
        if re.match(pattern, msg_lower):
            return {
                "type": "execute",
                "action": None,
                "response": "No worries! What else can I help with?",
                "pending_action": None,
            }

    # Step 2: Check for compound actions ("remove X and add Y")
    compound = detect_compound(msg_lower, places)
    if compound:
        return compound

    # Step 3: Check SWAP patterns
    for pattern in SWAP_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            old_name = m.group(1).strip()
            new_name = m.group(2).strip()
            return handle_swap(old_name, new_name, places)

    # Step 4: Check REMOVE patterns
    for pattern in REMOVE_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            target_name = m.group(1).strip()
            return handle_remove(target_name, places)

    # Step 5: Check ADD patterns
    for pattern in ADD_PATTERNS:
        m = re.search(pattern, msg_lower)
        if m:
            target_name = m.group(1).strip()
            day = int(m.group(2)) if m.group(2) else None
            time_str = m.group(3)
            time = parse_time(time_str) if time_str else None
            return handle_add(target_name, day, time, places)

    # Step 6: Can't parse → need LLM
    return {
        "type": "need_llm",
        "action": None,
        "response": None,
        "pending_action": None,
    }


# ============================================
# ACTION HANDLERS
# ============================================

def handle_remove(target_name: str, places: list) -> dict:
    place = find_place_by_name(target_name, places)
    if not place:
        return {
            "type": "ask",
            "action": None,
            "response": f'I couldn\'t find "{target_name}" in your trip. Could you double-check the name?',
            "pending_action": None,
        }

    if not place.get("is_in_itinerary"):
        return {
            "type": "execute",
            "action": None,
            "response": f"{place['name']} isn't currently in your itinerary, so nothing to remove!",
            "pending_action": None,
        }

    day_info = (
        f" from Day {place['day_number']}" if place.get("day_number") else ""
    )
    time_info = (
        f" ({place.get('time_slot', '')})" if place.get("time_slot") else ""
    )

    return {
        "type": "execute",
        "action": {"action": "remove", "place_id": place["google_place_id"]},
        "response": (
            f"Done! Removed **{place['name']}**{day_info}{time_info}.\n\n"
            "Want me to add something in its place, or is that all?"
        ),
        "pending_action": None,
    }


def handle_add(
    target_name: str, day: Optional[int], time: Optional[str], places: list
) -> dict:
    place = find_place_by_name(target_name, places)
    if not place:
        return {
            "type": "ask",
            "action": None,
            "response": (
                f'I couldn\'t find "{target_name}" in your available places.\n\n'
                "You can add custom places using the **Let's Pick** button!"
            ),
            "pending_action": None,
        }

    # Already in itinerary?
    if place.get("is_in_itinerary"):
        existing_day = place.get("day_number")
        existing_time = place.get("time_slot", "")
        if day and day != existing_day:
            return {
                "type": "ask",
                "action": None,
                "response": (
                    f"**{place['name']}** is already in your itinerary on "
                    f"Day {existing_day} at {existing_time}.\n\n"
                    "Would you like to:\n"
                    f"1. **Move** it to Day {day}\n"
                    f"2. **Keep** it on Day {existing_day}\n"
                    "3. **Visit** it on both days"
                ),
                "pending_action": {
                    "type": "resolve_conflict",
                    "place_id": place["google_place_id"],
                    "place_name": place["name"],
                    "existing_day": existing_day,
                    "existing_time": existing_time,
                    "requested_day": day,
                },
            }
        return {
            "type": "execute",
            "action": None,
            "response": (
                f"**{place['name']}** is already in your itinerary on "
                f"Day {existing_day} at {existing_time}. All good!"
            ),
            "pending_action": None,
        }

    # Have day + time → execute directly
    if day and time:
        return {
            "type": "execute",
            "action": {
                "action": "add",
                "place_id": place["google_place_id"],
                "day_number": day,
                "time_slot": time,
            },
            "response": (
                f"Done! Added **{place['name']}** to Day {day} at {time}."
            ),
            "pending_action": None,
        }

    # Have day but no time → ask for time
    if day and not time:
        return {
            "type": "ask",
            "action": None,
            "response": None,  # Route will fill with schedule context
            "pending_action": {
                "type": "add",
                "place_id": place["google_place_id"],
                "place_name": place["name"],
                "day_number": day,
                "awaiting": "pick_time",
            },
        }

    # No day → ask for day
    return {
        "type": "ask",
        "action": None,
        "response": None,  # Route will fill with day summaries
        "pending_action": {
            "type": "add",
            "place_id": place["google_place_id"],
            "place_name": place["name"],
            "awaiting": "pick_day",
        },
    }


def handle_swap(old_name: str, new_name: str, places: list) -> dict:
    old_place = find_place_by_name(old_name, places)
    new_place = find_place_by_name(new_name, places)

    if not old_place:
        return {
            "type": "ask",
            "action": None,
            "response": (
                f'Couldn\'t find "{old_name}" in your trip. '
                "Could you check the name?"
            ),
            "pending_action": None,
        }
    if not new_place:
        return {
            "type": "ask",
            "action": None,
            "response": (
                f'Couldn\'t find "{new_name}" in your available places. '
                "You can add custom places via **Let's Pick**!"
            ),
            "pending_action": None,
        }

    day = old_place.get("day_number")
    time = old_place.get("time_slot")
    day_str = f"Day {day}" if day else "your itinerary"
    time_str = f" at {time}" if time else ""

    return {
        "type": "execute",
        "action": [
            {"action": "remove", "place_id": old_place["google_place_id"]},
            {
                "action": "add",
                "place_id": new_place["google_place_id"],
                "day_number": day,
                "time_slot": time,
            },
        ],
        "response": (
            f"Done! Swapped out **{old_place['name']}** for "
            f"**{new_place['name']}** on {day_str}{time_str}.\n\nAnything else?"
        ),
        "pending_action": None,
    }


def detect_compound(msg_lower: str, places: list) -> Optional[dict]:
    """Detect 'remove X and add Y' patterns."""
    m = re.search(
        r"remove\s+(.+?)\s+and\s+(?:add|replace\s+(?:it\s+)?with)\s+(.+?)(?:\s*[.,!?]?\s*$)",
        msg_lower,
    )
    if m:
        return handle_swap(m.group(1).strip(), m.group(2).strip(), places)
    return None


# ============================================
# PENDING ACTION HANDLER
# ============================================

def handle_pending_response(
    msg: str, msg_lower: str, places: list, pending: dict
) -> dict:
    """Interpret user's message as an answer to the pending question."""

    # Check for cancel first
    for pattern in CANCEL_PATTERNS:
        if re.match(pattern, msg_lower):
            return {
                "type": "execute",
                "action": None,
                "response": "No problem, cancelled! What else can I help with?",
                "pending_action": None,
            }

    # Awaiting: pick_day
    if pending.get("awaiting") == "pick_day":
        day = parse_day(msg)
        if not day:
            return {
                "type": "ask",
                "action": None,
                "response": (
                    "I didn't catch the day number. Which day would you like? "
                    '(e.g. "Day 3" or just "3")'
                ),
                "pending_action": pending,
            }
        pending["day_number"] = day
        pending["awaiting"] = "pick_time"
        return {
            "type": "ask",
            "action": None,
            "response": None,  # Route fills schedule
            "pending_action": pending,
        }

    # Awaiting: pick_time
    if pending.get("awaiting") == "pick_time":
        time = parse_time(msg)
        if not time:
            return {
                "type": "ask",
                "action": None,
                "response": 'What time works? (e.g. "10am", "2:30 PM", "17:00")',
                "pending_action": pending,
            }
        return {
            "type": "execute",
            "action": {
                "action": "add",
                "place_id": pending["place_id"],
                "day_number": pending["day_number"],
                "time_slot": time,
            },
            "response": (
                f"Done! Added **{pending['place_name']}** to "
                f"Day {pending['day_number']} at {time}.\n\nAnything else?"
            ),
            "pending_action": None,
        }

    # Awaiting: pick_alternative
    if pending.get("awaiting") == "pick_alternative":
        chosen = find_place_by_name(msg, places)
        if chosen:
            day = pending.get("inherited_day")
            time = pending.get("inherited_time")
            day_str = f"Day {day}" if day else "your itinerary"
            time_str = f" at {time}" if time else ""
            return {
                "type": "execute",
                "action": [
                    {"action": "remove", "place_id": pending["target_place_id"]},
                    {
                        "action": "add",
                        "place_id": chosen["google_place_id"],
                        "day_number": day,
                        "time_slot": time,
                    },
                ],
                "response": (
                    f"Done! Swapped **{pending['target_name']}** for "
                    f"**{chosen['name']}** on {day_str}{time_str}.\n\nAnything else?"
                ),
                "pending_action": None,
            }
        return {
            "type": "ask",
            "action": None,
            "response": (
                "I didn't catch which one you'd like. Could you pick from the list above, "
                'or say "cancel" to skip?'
            ),
            "pending_action": pending,
        }

    # Awaiting: resolve_conflict
    if pending.get("awaiting") == "resolve_conflict" or pending.get("type") == "resolve_conflict":
        if "move" in msg_lower or msg.strip() == "1":
            return {
                "type": "execute",
                "action": {
                    "action": "add",
                    "place_id": pending["place_id"],
                    "day_number": pending["requested_day"],
                    "time_slot": pending.get("existing_time"),
                },
                "response": (
                    f"Moved **{pending['place_name']}** from "
                    f"Day {pending['existing_day']} to Day {pending['requested_day']}."
                ),
                "pending_action": None,
            }
        if "keep" in msg_lower or msg.strip() == "2":
            return {
                "type": "execute",
                "action": None,
                "response": (
                    f"Keeping **{pending['place_name']}** on Day {pending['existing_day']}. "
                    "No changes made!"
                ),
                "pending_action": None,
            }
        if "both" in msg_lower or msg.strip() == "3":
            return {
                "type": "execute",
                "action": {
                    "action": "add",
                    "place_id": pending["place_id"],
                    "day_number": pending["requested_day"],
                    "time_slot": None,
                },
                "response": (
                    f"Added **{pending['place_name']}** to Day {pending['requested_day']} as well! "
                    "It's now on both days."
                ),
                "pending_action": None,
            }
        return {
            "type": "ask",
            "action": None,
            "response": (
                "Please pick:\n1. **Move** it\n2. **Keep** it where it is\n3. Visit on **both** days"
            ),
            "pending_action": pending,
        }

    # Fallback
    return {
        "type": "need_llm",
        "action": None,
        "response": None,
        "pending_action": None,
    }


# ============================================
# RESPONSE FORMATTERS (for schedule display)
# ============================================

def format_day_summaries(itinerary: list, num_days: int) -> str:
    """Format all days as a compact summary for 'which day?' question."""
    lines = []
    for day in itinerary:
        day_num = day.get("day_number", "?")
        title = day.get("title", "")
        acts = day.get("activities", [])
        act_count = len(acts)
        summary_items = [
            a.get("title", "").split(" at ")[0].split(" - ")[0][:30]
            for a in acts[:3]
        ]
        summary = " → ".join(summary_items)
        if act_count > 3:
            summary += f" + {act_count - 3} more"
        lines.append(f"**Day {day_num}** — {title}\n   {summary}")
    return "\n".join(lines)


def format_day_schedule(itinerary: list, day_number: int) -> str:
    """Format a single day's schedule showing open slots."""
    for day in itinerary:
        if day.get("day_number") == day_number:
            lines = [f"**Day {day_number} — {day.get('title', '')}**\n"]
            for act in day.get("activities", []):
                time = act.get("time", "??:??")
                title = act.get("title", "Activity")
                lines.append(f"  {time} — {title}")

            used_hours = set()
            for act in day.get("activities", []):
                try:
                    h = int(act.get("time", "0").split(":")[0])
                    used_hours.add(h)
                    used_hours.add(h + 1)
                except Exception:
                    continue

            open_slots = []
            for h in [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]:
                if h not in used_hours:
                    open_slots.append(f"{h:02d}:00")

            if open_slots:
                lines.append(
                    f"\n🕐 **Open slots:** {', '.join(open_slots[:4])}"
                )

            return "\n".join(lines)

    return f"Day {day_number} doesn't exist in your itinerary yet."

