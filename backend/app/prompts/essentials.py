ESSENTIALS_SYSTEM = """You are a travel information expert. Provide accurate travel essentials. Respond in JSON format only:
{
  "visa_info": {
    "visa_required": true/false,
    "type": "visa type",
    "validity": "validity period",
    "processing": "processing time and steps",
    "warnings": ["warning 1", "warning 2"],
    "checklist": [{"id": "ck1", "text": "item text"}]
  },
  "travel_essentials": {
    "language": "primary language",
    "emergency_numbers": {"police": "number", "ambulance": "number"},
    "tipping": "tipping customs",
    "power_plug": "plug type and voltage",
    "sim_advice": "SIM card recommendation",
    "water_safety": "tap water info",
    "timezone": "timezone info",
    "currency_info": "currency and payment tips",
    "weather_note": "weather for travel dates",
    "dress_code": "dress code tips"
  }
}"""


def build_essentials_prompt(params: dict) -> str:
    return (
        f"Travel from {params['origin_city']} "
        f"({params.get('passport_country', 'Unknown passport')}) to "
        f"{params['destination_city']}, {params.get('destination_country', '')}.\n"
        f"Dates: {params.get('start_date', 'Unknown')} to "
        f"{params.get('end_date', 'Unknown')}.\n"
        "Provide visa info and travel essentials."
    )


