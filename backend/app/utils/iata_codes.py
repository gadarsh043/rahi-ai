# app/utils/iata_codes.py
# Lookup of ~200 major cities to IATA airport codes. Covers 95%+ of trips.
# Fallback to city[:3].upper() for obscure ones.

CITY_TO_IATA = {
    # India
    "mumbai": "BOM",
    "delhi": "DEL",
    "new delhi": "DEL",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA",
    "kolkata": "CCU",
    "pune": "PNQ",
    "ahmedabad": "AMD",
    "jaipur": "JAI",
    "goa": "GOI",
    "kochi": "COK",
    "lucknow": "LKO",
    "guwahati": "GAU",
    "thiruvananthapuram": "TRV",
    "varanasi": "VNS",
    "amritsar": "ATQ",
    "chandigarh": "IXC",
    "indore": "IDR",
    "nagpur": "NAG",
    "patna": "PAT",
    "bhubaneswar": "BBI",
    "coimbatore": "CJB",
    "srinagar": "SXR",
    "mangalore": "IXE",
    "visakhapatnam": "VTZ",
    "vizag": "VTZ",
    "udaipur": "UDR",
    # USA
    "new york": "JFK",
    "new york city": "JFK",
    "nyc": "JFK",
    "los angeles": "LAX",
    "la": "LAX",
    "chicago": "ORD",
    "houston": "IAH",
    "dallas": "DFW",
    "san francisco": "SFO",
    "seattle": "SEA",
    "miami": "MIA",
    "boston": "BOS",
    "atlanta": "ATL",
    "denver": "DEN",
    "las vegas": "LAS",
    "phoenix": "PHX",
    "orlando": "MCO",
    "washington": "IAD",
    "washington dc": "IAD",
    "san diego": "SAN",
    "portland": "PDX",
    "austin": "AUS",
    "nashville": "BNA",
    "minneapolis": "MSP",
    "detroit": "DTW",
    "philadelphia": "PHL",
    "salt lake city": "SLC",
    "honolulu": "HNL",
    "san jose": "SJC",
    "charlotte": "CLT",
    "tampa": "TPA",
    "pittsburgh": "PIT",
    "raleigh": "RDU",
    "st louis": "STL",
    "new orleans": "MSY",
    "kansas city": "MCI",
    "indianapolis": "IND",
    "columbus": "CMH",
    "cincinnati": "CVG",
    "cleveland": "CLE",
    "buffalo": "BUF",
    # UK & Ireland
    "london": "LHR",
    "manchester": "MAN",
    "birmingham": "BHX",
    "edinburgh": "EDI",
    "glasgow": "GLA",
    "bristol": "BRS",
    "liverpool": "LPL",
    "belfast": "BFS",
    "dublin": "DUB",
    # Europe
    "paris": "CDG",
    "amsterdam": "AMS",
    "berlin": "BER",
    "frankfurt": "FRA",
    "munich": "MUC",
    "rome": "FCO",
    "milan": "MXP",
    "madrid": "MAD",
    "barcelona": "BCN",
    "lisbon": "LIS",
    "vienna": "VIE",
    "zurich": "ZRH",
    "geneva": "GVA",
    "brussels": "BRU",
    "copenhagen": "CPH",
    "stockholm": "ARN",
    "oslo": "OSL",
    "helsinki": "HEL",
    "prague": "PRG",
    "warsaw": "WAW",
    "budapest": "BUD",
    "athens": "ATH",
    "istanbul": "IST",
    "moscow": "SVO",
    "st petersburg": "LED",
    "nice": "NCE",
    "venice": "VCE",
    "florence": "FLR",
    "naples": "NAP",
    "hamburg": "HAM",
    "dusseldorf": "DUS",
    "malaga": "AGP",
    "seville": "SVQ",
    "porto": "OPO",
    "bucharest": "OTP",
    "dubrovnik": "DBV",
    "reykjavik": "KEF",
    # Middle East
    "dubai": "DXB",
    "abu dhabi": "AUH",
    "doha": "DOH",
    "riyadh": "RUH",
    "jeddah": "JED",
    "muscat": "MCT",
    "bahrain": "BAH",
    "kuwait": "KWI",
    "amman": "AMM",
    "beirut": "BEY",
    "tel aviv": "TLV",
    "cairo": "CAI",
    # Asia
    "tokyo": "NRT",
    "osaka": "KIX",
    "kyoto": "KIX",
    "seoul": "ICN",
    "beijing": "PEK",
    "shanghai": "PVG",
    "hong kong": "HKG",
    "taipei": "TPE",
    "bangkok": "BKK",
    "singapore": "SIN",
    "kuala lumpur": "KUL",
    "kl": "KUL",
    "jakarta": "CGK",
    "bali": "DPS",
    "denpasar": "DPS",
    "manila": "MNL",
    "hanoi": "HAN",
    "ho chi minh city": "SGN",
    "saigon": "SGN",
    "phnom penh": "PNH",
    "colombo": "CMB",
    "kathmandu": "KTM",
    "dhaka": "DAC",
    "yangon": "RGN",
    "phuket": "HKT",
    "chiang mai": "CNX",
    "siem reap": "REP",
    "maldives": "MLE",
    "male": "MLE",
    # Oceania
    "sydney": "SYD",
    "melbourne": "MEL",
    "brisbane": "BNE",
    "perth": "PER",
    "auckland": "AKL",
    "queenstown": "ZQN",
    "christchurch": "CHC",
    "fiji": "NAN",
    # Africa
    "johannesburg": "JNB",
    "cape town": "CPT",
    "nairobi": "NBO",
    "lagos": "LOS",
    "casablanca": "CMN",
    "marrakech": "RAK",
    "addis ababa": "ADD",
    "dar es salaam": "DAR",
    "accra": "ACC",
    "tunis": "TUN",
    "zanzibar": "ZNZ",
    "mauritius": "MRU",
    # South America
    "sao paulo": "GRU",
    "rio de janeiro": "GIG",
    "buenos aires": "EZE",
    "santiago": "SCL",
    "lima": "LIM",
    "bogota": "BOG",
    "medellin": "MDE",
    "mexico city": "MEX",
    "cancun": "CUN",
    "havana": "HAV",
    "cartagena": "CTG",
    "quito": "UIO",
    "montevideo": "MVD",
    # Canada
    "toronto": "YYZ",
    "vancouver": "YVR",
    "montreal": "YUL",
    "calgary": "YYC",
    "ottawa": "YOW",
    "edmonton": "YEG",
    "winnipeg": "YWG",
    "halifax": "YHZ",
}


def resolve_iata(city_name: str, fallback_code: str | None = None) -> str:
    """
    Resolve city name to IATA airport code.
    Tries exact match, then lowercase, then common variations.
    Falls back to first 3 chars uppercased if nothing found.
    """
    if not city_name:
        return (fallback_code or "XXX")[:3].upper() if fallback_code else "XXX"

    clean = city_name.strip().lower()

    # Strip country/region segments after a comma (e.g. "Mumbai, India")
    if "," in clean:
        clean = clean.split(",", 1)[0].strip()

    # Strip trailing parenthetical info (e.g. "London (UK)")
    if "(" in clean:
        clean = clean.split("(", 1)[0].strip()

    # Direct lookup
    if clean in CITY_TO_IATA:
        return CITY_TO_IATA[clean]

    # Try without common suffixes
    for suffix in [" city", " town", " metro", " area"]:
        if clean.endswith(suffix):
            trimmed = clean[: -len(suffix)].strip()
            if trimmed in CITY_TO_IATA:
                return CITY_TO_IATA[trimmed]

    # Try first word(s) only (e.g. "New York City" → "new york city" already in map)
    words = clean.split()
    if len(words) > 1:
        for i in range(len(words), 0, -1):
            partial = " ".join(words[:i])
            if partial in CITY_TO_IATA:
                return CITY_TO_IATA[partial]

    # Fallback: provided code or first 3 chars
    if fallback_code and len(fallback_code) == 3:
        return fallback_code.upper()
    return clean[:3].upper() if len(clean) >= 3 else clean.upper().ljust(3, "X")
