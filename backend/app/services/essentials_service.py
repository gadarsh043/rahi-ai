import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

_visa_rules = None
_country_essentials = None


def _load_visa_rules():
    global _visa_rules
    if _visa_rules is None:
        with open(DATA_DIR / "visa_rules.json", encoding="utf-8") as f:
            _visa_rules = json.load(f)
    return _visa_rules


def _load_country_essentials():
    global _country_essentials
    if _country_essentials is None:
        with open(DATA_DIR / "country_essentials.json", encoding="utf-8") as f:
            _country_essentials = json.load(f)
    return _country_essentials


_NAME_TO_CODE = {
    "united states": "US",
    "united states of america": "US",
    "usa": "US",
    "u.s.": "US",
    "u.s.a.": "US",
    "us": "US",
    "united kingdom": "UK",
    "uk": "UK",
    "great britain": "UK",
    "england": "UK",
    "india": "IN",
    "in": "IN",
    "japan": "JP",
    "jp": "JP",
    "thailand": "TH",
    "th": "TH",
    "uae": "AE",
    "united arab emirates": "AE",
    "ae": "AE",
    "singapore": "SG",
    "sg": "SG",
    "france": "FR",
    "fr": "FR",
    "germany": "DE",
    "de": "DE",
    "australia": "AU",
    "au": "AU",
    "switzerland": "CH",
    "ch": "CH",
    "norway": "NO",
    "no": "NO",
    "vietnam": "VN",
    "vn": "VN",
    "indonesia": "ID",
    "id": "ID",
    "philippines": "PH",
    "ph": "PH",
    "mexico": "MX",
    "mx": "MX",
    "south korea": "KR",
    "korea": "KR",
    "kr": "KR",
    "taiwan": "TW",
    "tw": "TW",
    "malaysia": "MY",
    "my": "MY",
    "new zealand": "NZ",
    "nz": "NZ",
}


def normalize_country_code(value: str | None) -> str:
    if not value:
        return ""
    v = value.strip()
    if len(v) == 2 and v.isalpha():
        return v.upper()
    key = v.lower()
    return _NAME_TO_CODE.get(key, v.upper()[:2])


def get_visa_info(
    passport_country: str, destination_country: str, visa_status: str = None
) -> dict:
    """
    Get visa info from static rules. Zero tokens.
    visa_status: optional override like "F-1", "H-1B", "green_card"
    """
    rules = _load_visa_rules()

    passport = normalize_country_code(passport_country)
    dest = normalize_country_code(destination_country)

    passport_rules = rules.get(passport, {})
    dest_rules = passport_rules.get(dest, {})

    if not dest_rules:
        return rules.get("_default", {"visa_required": None, "type": "Check with embassy"})

    if visa_status and visa_status.lower() == "citizen":
        return {
            "visa_required": False,
            "type": "Citizen / Resident",
            "note": "If you're a citizen or permanent resident of the destination country, you typically don't need a tourist visa.",
            "checklist": ["Valid passport / residency document"],
            "warnings": ["Ensure your documents are valid for the full trip duration"],
        }

    if visa_status and visa_status in dest_rules:
        info = dest_rules[visa_status]
        info["visa_required"] = info.get("visa_required", False)
        return info

    return dest_rules.get("default", rules.get("_default", {}))


def get_travel_essentials(destination_country: str) -> dict:
    essentials = _load_country_essentials()
    dest = normalize_country_code(destination_country)
    return essentials.get(dest, essentials.get("_default", {}))


def detect_visa_status(instructions: str) -> str | None:
    if not instructions:
        return None
    text = instructions.lower()

    visa_keywords = {
        "f-1": "F-1",
        "f1 visa": "F-1",
        "student visa": "F-1",
        "h-1b": "H-1B",
        "h1b": "H-1B",
        "work visa": "H-1B",
        "green card": "green_card",
        "permanent resident": "green_card",
        "pr holder": "green_card",
        "l-1": "L-1",
        "l1 visa": "L-1",
        "opt": "F-1",
        "cpt": "F-1",
    }

    for keyword, status in visa_keywords.items():
        if keyword in text:
            return status

    return None


def is_domestic_travel(origin_country: str, destination_country: str) -> bool:
    """
    Check if this is domestic travel between origin and destination.

    Handles:
    - Country codes (US/US)
    - Full names (United States/United States)
    - Common variations and aliases (US/USA/United States of America, UK/GB/England, etc.)
    """
    if not origin_country or not destination_country:
        return False

    # Normalize to uppercase strings
    o = origin_country.strip().upper()
    d = destination_country.strip().upper()

    if o == d:
        return True

    # Handle code vs name mismatches via simple alias mapping
    COUNTRY_ALIASES = {
        "US": ["UNITED STATES", "USA", "AMERICA", "UNITED STATES OF AMERICA", "U.S.", "U.S.A."],
        "UK": ["UNITED KINGDOM", "GREAT BRITAIN", "ENGLAND", "GB", "BRITAIN"],
        "IN": ["INDIA", "IND"],
        "AE": ["UAE", "UNITED ARAB EMIRATES"],
    }

    def get_canonical(code: str) -> str:
        for key, aliases in COUNTRY_ALIASES.items():
            if code == key or code in aliases:
                return key
        return code

    return get_canonical(o) == get_canonical(d)

