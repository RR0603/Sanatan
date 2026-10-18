"""Canonical names for the five limbs of the Panchang."""

TITHIS = (
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya",
)

NAKSHATRAS = (
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
    "Revati",
)

YOGAS = (
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
    "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha",
    "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra",
    "Vaidhriti",
)

#: The seven repeating (chara) karanas, cycling through half-tithis 1..56.
CHARA_KARANAS = ("Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti")
#: The four fixed (sthira) karanas at the ends of the lunar month.
FIXED_KARANAS = ("Kimstughna", "Shakuni", "Chatushpada", "Naga")

RASHIS = (
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
)

RASHI_ENGLISH = (
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
)

#: Vedic weekday names, indexed by ``datetime.isoweekday() % 7`` (Sunday = 0).
VARAS = (
    "Ravivara", "Somavara", "Mangalavara", "Budhavara",
    "Guruvara", "Shukravara", "Shanivara",
)

VARA_ENGLISH = (
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
)

#: Lunar months of the Amanta reckoning, indexed by the solar rashi at new moon.
MASAS = (
    "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashwina",
    "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna", "Chaitra",
)

#: Which eighth of the daylight span Rahu Kaal occupies, by weekday.
#: Index is ``isoweekday() % 7`` (Sunday = 0); value is a 1-based segment.
RAHU_KAAL_SEGMENT = (8, 2, 7, 5, 6, 4, 3)
#: Yama Ganda, same indexing convention.
YAMA_GANDA_SEGMENT = (5, 4, 3, 2, 1, 7, 6)
#: Gulika Kaal, same indexing convention.
GULIKA_SEGMENT = (7, 6, 5, 4, 3, 2, 1)
