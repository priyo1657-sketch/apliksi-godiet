"""
nutrition_calc.py
-----------------
Hitung total kandungan nutrisi dari bahan-bahan resep Cookpad
menggunakan database food_siap_training.csv.

Cara pakai:
    python nutrition_calc.py
    
Input  : scraping_results.json (output cookpad_scraper.py) atau contoh manual
Output : nutrition_results.json
"""

import json
import re
import pandas as pd
from rapidfuzz import process, fuzz

# ─────────────────────────────────────────────────────────────────────────────
# 1. KAMUS KONVERSI NAMA BAHAN (Indonesia → nama di database)
# ─────────────────────────────────────────────────────────────────────────────
INGREDIENT_ALIAS = {
    # Sayuran
    "terong": "eggplant, raw",
    "terong ungu": "eggplant, raw",
    "cabe merah": "pepper, hot chili, raw",
    "cabe merah besar": "pepper, hot chili, raw",
    "cabe besar": "pepper, hot chili, raw",
    "cabe kecil": "pepper, hot chili, raw",
    "cabe rawit": "pepper, serrano, raw",
    "cabai merah": "pepper, hot chili, raw",
    "cabai rawit": "pepper, serrano, raw",
    "bawang merah": "onions, raw",
    "bawang putih": "garlic, raw",
    "bawang bombay": "onions, raw",
    "tomat": "tomatoes, raw",
    "pisang": "bananas",
    "wortel": "carrots, raw",
    "kubis": "cabbage, green, raw",
    "kol": "cabbage, green, raw",
    "bayam": "spinach, raw",
    "kangkung": "spinach, raw",
    "brokoli": "broccoli, raw",
    "ketimun": "cucumber, raw",
    "timun": "cucumber, raw",
    "kentang": "potato, raw",
    "jagung": "corn, raw",
    "jamur": "mushrooms, raw",
    "daun jeruk": "lime, raw",
    "serai": "cilantro, raw",
    "jahe": "ginger, raw",
    "lengkuas": "ginger, raw",
    "kunyit": "ginger, raw",

    # Protein
    "ikan salmon": "salmon, raw",
    "salmon": "salmon, raw",
    "ayam": "chicken breast, baked, broiled, or roasted, skin not eaten, from raw",
    "dada ayam": "chicken breast, baked, broiled, or roasted, skin not eaten, from raw",
    "telur": "egg, whole, raw",
    "udang": "shrimp, cooked, ns as to cooking method",
    "terasi": "shrimp, cooked, ns as to cooking method",
    "terasi udang": "shrimp, cooked, ns as to cooking method",
    "ikan": "fish, ns as to type, raw",
    "tahu": "tofu",
    "tempe": "tempeh",
    "daging sapi": "ground beef, raw",

    # Bumbu & kondimen
    "gula": "sugar, white, granulated or lump",
    "gula pasir": "sugar, white, granulated or lump",
    "gula merah": "sugar, white, granulated or lump",
    "garam": "soy sauce",          # pakai soy sauce sebagai proxy (sodium tinggi, kalori minimal)
    "minyak goreng": "vegetable oil, nfs",
    "minyak": "vegetable oil, nfs",
    "kecap manis": "soy sauce",
    "kecap": "soy sauce",
    "santan": "coconut milk",
    "susu": "milk, whole",

    # Karbohidrat
    "nasi": "rice, white, cooked",
    "beras": "rice, white, cooked",
    "tepung": "wheat flour",
    "oat": "oats, raw",
    "oatmeal": "oats, raw",
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. KONVERSI SATUAN → GRAM
#    Semua nilai di bawah adalah rata-rata / estimasi umum
# ─────────────────────────────────────────────────────────────────────────────
UNIT_TO_GRAM = {
    # Volume dapur
    "sdm": 15,          # sendok makan (15 ml ≈ 15 g untuk cairan/bumbu)
    "sdt": 5,           # sendok teh
    "ml": 1,
    "liter": 1000,
    "l": 1000,
    "cc": 1,

    # Berat langsung
    "g": 1,
    "gr": 1,
    "gram": 1,
    "kg": 1000,

    # Satuan buah/sayur (estimasi berat rata-rata)
    "buah": None,       # tergantung jenis → lihat PIECE_WEIGHT
    "bh": None,
    "biji": None,
    "butir": None,
    "lembar": 2,        # daun (daun jeruk, salam, dll) ≈ 2 g
    "ikat": 100,        # satu ikat sayuran ≈ 100 g
    "genggam": 30,
    "sejumput": 1,      # sejumput garam ≈ 1 g
    "secukupnya": 5,    # estimasi konservatif
    "siung": 5,         # siung bawang ≈ 5 g
    "bks": 7,           # 1/2 bungkus kecil terasi ≈ 3.5 g (dikalikan fractionnya)
    "bungkus": 14,      # 1 bungkus terasi ABC ≈ 14 g
    "porsi": 200,
    "mangkok": 250,
    "gelas": 240,
    "cangkir": 240,
}

# Berat rata-rata per 1 buah/biji (gram)
PIECE_WEIGHT = {
    "terong": 200,
    "terong ungu": 200,
    "cabe merah besar": 25,
    "cabe merah": 15,
    "cabe besar": 25,
    "cabe kecil": 5,
    "cabe rawit": 3,
    "cabai rawit": 3,
    "tomat": 100,
    "wortel": 80,
    "kentang": 150,
    "bawang bombay": 120,
    "telur": 60,
    "apel": 150,
    "pisang": 120,
    "jeruk": 130,
    "mangga": 300,
    "jagung": 150,
    "tahu": 80,
    "tempe": 100,
    "default": 50,      # fallback jika tidak ada di daftar
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. PARSER BAHAN
# ─────────────────────────────────────────────────────────────────────────────

FRACTION_MAP = {
    "1/2": 0.5, "1/3": 0.333, "2/3": 0.667,
    "1/4": 0.25, "3/4": 0.75,
    "1/8": 0.125,
}

def parse_quantity(text: str) -> float:
    """Ubah teks angka (termasuk pecahan & range) jadi float."""
    text = text.strip()
    # Range: "1-2" → ambil rata-rata
    range_match = re.match(r"(\d+)\s*[-–]\s*(\d+)", text)
    if range_match:
        return (float(range_match.group(1)) + float(range_match.group(2))) / 2
    # Pecahan teks: "1/2"
    for frac_str, frac_val in FRACTION_MAP.items():
        if text.startswith(frac_str):
            rest = text[len(frac_str):].strip()
            if rest:
                try:
                    return float(rest) + frac_val
                except ValueError:
                    pass
            return frac_val
    # Angka biasa
    try:
        return float(text)
    except ValueError:
        return 1.0


def parse_ingredient_line(line: str):
    """
    Urai satu baris bahan menjadi (qty_gram, ingredient_name_id).
    Contoh: "1 bh terong ungu (bisa disesuaikan...)"
            → qty=200, name="terong ungu"
    """
    # Buang teks dalam kurung
    line = re.sub(r"\(.*?\)", "", line).strip()
    line = line.lower().strip()

    # Coba temu jumlah di awal
    qty_match = re.match(
        r"^([\d/,\.\-–]+)\s+", line
    )
    qty = 1.0
    rest = line
    if qty_match:
        qty = parse_quantity(qty_match.group(1).replace(",", "."))
        rest = line[qty_match.end():].strip()

    # Identifikasi satuan
    unit = None
    unit_gram = None
    for u in sorted(UNIT_TO_GRAM.keys(), key=len, reverse=True):
        if rest.startswith(u + " ") or rest == u:
            unit = u
            unit_gram = UNIT_TO_GRAM[u]
            rest = rest[len(u):].strip()
            break

    # Sisa teks = nama bahan (ambil 3 kata pertama agar tidak terlalu panjang)
    ingredient_name = " ".join(rest.split()[:4])

    # Hitung gram
    if unit_gram is not None:
        gram = qty * unit_gram
    elif unit in ("buah", "bh", "biji", "butir", None):
        # Cari berat per buah
        piece_w = PIECE_WEIGHT.get(ingredient_name)
        if piece_w is None:
            # Coba match parsial di PIECE_WEIGHT
            for key in PIECE_WEIGHT:
                if key in ingredient_name or ingredient_name in key:
                    piece_w = PIECE_WEIGHT[key]
                    break
        gram = qty * (piece_w or PIECE_WEIGHT["default"])
    else:
        gram = qty * UNIT_TO_GRAM.get(unit, 10)

    return gram, ingredient_name


# ─────────────────────────────────────────────────────────────────────────────
# 4. MATCHING KE DATABASE
# ─────────────────────────────────────────────────────────────────────────────

def load_food_db(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df["nama_lower"] = df["nama_makanan"].str.lower()
    return df


def find_food(ingredient_name: str, db: pd.DataFrame, score_cutoff: int = 55):
    """
    Cari entri database terbaik untuk nama bahan.
    Prioritas: alias exact → alias fuzzy → db fuzzy.
    Kembalikan baris DataFrame atau None.
    """
    name = ingredient_name.lower().strip()

    # 1. Cek alias exact
    alias_target = INGREDIENT_ALIAS.get(name)
    if alias_target:
        exact = db[db["nama_lower"] == alias_target.lower()]
        if not exact.empty:
            return exact.iloc[0], alias_target, 100

    # 2. Cek alias parsial
    for alias_key, alias_target in INGREDIENT_ALIAS.items():
        if alias_key in name or name in alias_key:
            rows = db[db["nama_lower"] == alias_target.lower()]
            if not rows.empty:
                return rows.iloc[0], alias_target, 90

    # 3. Fuzzy match langsung ke db
    candidates = db["nama_lower"].tolist()
    result = process.extractOne(
        name, candidates,
        scorer=fuzz.token_set_ratio,
        score_cutoff=score_cutoff
    )
    if result:
        matched_name, score, idx = result
        return db.iloc[idx], matched_name, score

    return None, name, 0


# ─────────────────────────────────────────────────────────────────────────────
# 5. HITUNG NUTRISI SATU RESEP
# ─────────────────────────────────────────────────────────────────────────────

NUTRISI_COLS = ["kalori", "protein_g", "karbohidrat_g", "lemak_g", "serat_g", "gula_g"]

def calc_recipe_nutrition(ingredients: list[str], db: pd.DataFrame) -> dict:
    """
    Hitung total nutrisi dari list bahan (teks mentah).
    Nilai database adalah per 100 g, jadi kita scale dengan gram_used/100.
    """
    detail = []
    total = {col: 0.0 for col in NUTRISI_COLS}

    for line in ingredients:
        if not line.strip():
            continue

        gram, ing_name = parse_ingredient_line(line)
        row, matched, score = find_food(ing_name, db)

        item = {
            "bahan_asli": line.strip(),
            "nama_parsed": ing_name,
            "matched_db": matched,
            "match_score": score,
            "gram_used": round(gram, 1),
            "nutrisi": {},
            "catatan": ""
        }

        if row is not None:
            scale = gram / 100.0
            for col in NUTRISI_COLS:
                val = round(float(row[col]) * scale, 2)
                item["nutrisi"][col] = val
                total[col] += val
        else:
            item["catatan"] = "Tidak ditemukan di database"
            for col in NUTRISI_COLS:
                item["nutrisi"][col] = 0.0

        if score < 70 and row is not None:
            item["catatan"] = f"Match rendah ({int(score)}%), perlu verifikasi"

        detail.append(item)

    return {
        "detail_bahan": detail,
        "total_nutrisi": {col: round(total[col], 2) for col in NUTRISI_COLS}
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. MAIN - proses semua resep dari JSON scraping
# ─────────────────────────────────────────────────────────────────────────────

# Contoh data manual untuk test (bisa diganti path ke cookpad_diet_results.json)
SAMPLE_RECIPES = [
    {
        "url": "https://cookpad.com/id/resep/contoh-terong-balado",
        "title": "Terong Balado Simple Enak",
        "ingredients": [
            "1 bh terong ungu (bisa disesuaikan kalau mau bikin lebih banyak porsi)",
            "8 bh cabe merah besar (bisa disesuaikan juga kalau mau pedas bisa ditambah)",
            "4 bh cabe kecil (bisa disesuaikan juga kalau mau pedas bisa ditambah)",
            "1/2 bks terasi udang ABC",
            "2 siung bawang merah",
            "1 siung bawang putih",
            "1 sdm gula",
            "1 sdm minyak goreng",
            "1-2 lembar daun jeruk",
            "Sejumput garam",
        ],
        "steps": ["Goreng terong...", "Tumis bumbu..."]
    }
]


def main():
    DB_PATH = r"C:\Users\alama\Downloads\Makanan\kalori training\food_siap_training.csv"
    SCRAPE_INPUT = "cookpad_diet_results.json"
    OUTPUT_PATH = "nutrition_results.json"

    print("[INFO] Memuat database nutrisi...")
    db = load_food_db(DB_PATH)
    print(f"[INFO] {len(db)} item dimuat dari database.")

    # Coba baca hasil scraping; kalau tidak ada, pakai sample
    try:
        with open(SCRAPE_INPUT, "r", encoding="utf-8") as f:
            recipes = json.load(f)
        print(f"[INFO] {len(recipes)} resep dibaca dari {SCRAPE_INPUT}")
    except FileNotFoundError:
        print(f"[WARN] {SCRAPE_INPUT} tidak ditemukan. Menggunakan data contoh.")
        recipes = SAMPLE_RECIPES

    results = []
    for i, recipe in enumerate(recipes, 1):
        print(f"[{i}/{len(recipes)}] Menghitung: {recipe.get('url', recipe.get('title', ''))}")

        nutrition = calc_recipe_nutrition(recipe.get("ingredients", []), db)

        results.append({
            "url": recipe.get("url", ""),
            "title": recipe.get("title", ""),
            "steps": recipe.get("steps", []),
            **nutrition
        })

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] Hasil disimpan ke {OUTPUT_PATH}")

    # Preview hasil pertama
    if results:
        r = results[0]
        print(f"\n=== Preview: {r.get('title') or r['url']} ===")
        print(f"{'Bahan':<30} {'Gram':>6}  {'Matched DB':<35} {'Score':>5}  {'Kalori':>7}")
        print("-" * 100)
        for d in r["detail_bahan"]:
            print(
                f"{d['nama_parsed']:<30} {d['gram_used']:>6.0f}g  "
                f"{d['matched_db']:<35} {int(d['match_score']):>5}  "
                f"{d['nutrisi'].get('kalori', 0):>7.1f} kcal"
                + (f"  ⚠ {d['catatan']}" if d['catatan'] else "")
            )
        print("-" * 100)
        t = r["total_nutrisi"]
        print(f"{'TOTAL':<30} {'':>6}   {'':35} {'':5}  {t['kalori']:>7.1f} kcal")
        print(f"  Protein  : {t['protein_g']:.1f} g")
        print(f"  Karbo    : {t['karbohidrat_g']:.1f} g")
        print(f"  Lemak    : {t['lemak_g']:.1f} g")
        print(f"  Serat    : {t['serat_g']:.1f} g")
        print(f"  Gula     : {t['gula_g']:.1f} g")


if __name__ == "__main__":
    main()