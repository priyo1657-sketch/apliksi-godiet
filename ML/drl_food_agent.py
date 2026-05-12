"""
drl_food_agent.py
─────────────────────────────────────────────────────────────────────────────
Deep Reinforcement Learning - Agen Rekomendasi Menu Makanan
Algoritma  : PPO (Proximal Policy Optimization)
Framework  : PyTorch
Data input : JSON hasil scraping Cookpad (nutrition_results.json)

Struktur JSON yang dibutuhkan per menu:
    {
      "url"          : "https://cookpad.com/id/resep/...",
      "title"        : "Nama Menu",          ← bisa kosong, akan diganti dari URL
      "total_nutrisi": {
          "kalori"        : 69.24,
          "protein_g"     : 10.64,
          "karbohidrat_g" : 1.14,
          "lemak_g"       : 2.46,
          "serat_g"       : 0.29,
          "gula_g"        : 0.24
      },
      ...
    }

Cara pakai:
    # Latih agen
    python drl_food_agent.py --mode train --json nutrition_results.json

    # Latih lalu langsung prediksi interaktif
    python drl_food_agent.py --mode train --json nutrition_results.json --predict_after

    # Prediksi saja (model sudah ada)
    python drl_food_agent.py --mode predict --json nutrition_results.json

File output:
    ppo_food_agent.pt    → bobot model terlatih
    training_log.json    → histori reward per episode
─────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical

# ─────────────────────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────────────────────

JSON_PATH      = "nutrition_results.json"
MODEL_PATH     = "ppo_food_agent.pt"
LOG_PATH       = "training_log.json"

# Jumlah menu yang ditawarkan ke agen per langkah rekomendasi
N_MENU_CHOICES = 10
# Jumlah rekomendasi dalam 1 hari (sarapan, makan siang, makan malam)
MEALS_PER_DAY  = 3
# Jumlah menu yang disampling dari database per episode
DB_SAMPLE_SIZE = 100

# Hyperparameter PPO
LR              = 3e-4
GAMMA           = 0.99
CLIP_EPS        = 0.2
ENTROPY_COEF    = 0.01
VALUE_COEF      = 0.5
EPOCHS_PER_UPDATE = 4
BATCH_SIZE      = 64
TOTAL_EPISODES  = 3000
UPDATE_INTERVAL = 20
HIDDEN_SIZE     = 256

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

GOALS = ["turun_berat", "tetap_bugar", "lebih_kuat", "massa_otot"]

NUTRISI_COLS = ["kalori", "protein_g", "karbohidrat_g", "lemak_g"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. LOADER DATA JSON
# ─────────────────────────────────────────────────────────────────────────────

def load_menu_db(json_path: str) -> pd.DataFrame:
    """
    Baca JSON hasil scraping dan ubah jadi DataFrame menu.
    Setiap baris = 1 menu dengan total_nutrisi sebagai fitur utama.
    Menu yang total nutrisinya semua 0 dibuang (data kosong).
    """
    with open(json_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    records = []
    for item in raw:
        tn = item.get("total_nutrisi", {})

        # Buang menu dengan kalori 0 (bahan tidak teridentifikasi)
        if tn.get("kalori", 0) <= 0:
            continue

        # Ambil nama menu: dari title, atau parse dari URL
        title = item.get("title", "").strip()
        if not title:
            url   = item.get("url", "")
            slug  = url.rstrip("/").split("/")[-1]          # ambil segment terakhir URL
            # hapus ID angka di awal slug jika ada
            parts = slug.split("-")
            if parts and parts[0].isdigit():
                parts = parts[1:]
            title = " ".join(parts).title() if parts else slug

        records.append({
            "nama_menu"    : title,
            "url"          : item.get("url", ""),
            "kalori"       : float(tn.get("kalori",        0.0)),
            "protein_g"    : float(tn.get("protein_g",     0.0)),
            "karbohidrat_g": float(tn.get("karbohidrat_g", 0.0)),
            "lemak_g"      : float(tn.get("lemak_g",       0.0)),
            "serat_g"      : float(tn.get("serat_g",       0.0)),
            "gula_g"       : float(tn.get("gula_g",        0.0)),
            # Simpan bahan untuk ditampilkan di output prediksi
            "bahan"        : "|".join(
                b.get("bahan_asli", "") for b in item.get("detail_bahan", [])
            ),
            "langkah"      : item.get("steps", []),
        })

    df = pd.DataFrame(records).reset_index(drop=True)
    print(f"[INFO] {len(df)} menu valid dimuat dari {len(raw)} total entri JSON.")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 2. TARGET NUTRISI HARIAN BERDASARKAN PROFIL
# ─────────────────────────────────────────────────────────────────────────────

def hitung_bmr(jk: str, umur: int, tb: float, bb: float) -> float:
    """Harris-Benedict BMR."""
    if jk.lower() in ("l", "laki", "pria", "male", "m"):
        return 88.362 + (13.397 * bb) + (4.799 * tb) - (5.677 * umur)
    return 447.593 + (9.247 * bb) + (3.098 * tb) - (4.330 * umur)


def hitung_target(profil: dict) -> dict:
    """
    Hitung target nutrisi harian (kalori, protein, karbo, lemak)
    berdasarkan profil dan tujuan pengguna.
    """
    bmr  = hitung_bmr(profil["jk"], profil["umur"], profil["tb"], profil["bb"])
    tdee = bmr * 1.375    # faktor aktivitas sedang

    goal = profil["tujuan"]

    if goal == "turun_berat":
        # Defisit 20% kalori, protein tinggi untuk jaga massa otot
        kal   = tdee * 0.80
        prot  = profil["bb"] * 1.8
        lemak = kal * 0.25 / 9
        karbo = (kal - prot * 4 - lemak * 9) / 4

    elif goal == "tetap_bugar":
        # Kalori maintenance, nutrisi seimbang
        kal   = tdee
        prot  = profil["bb"] * 1.4
        lemak = kal * 0.28 / 9
        karbo = (kal - prot * 4 - lemak * 9) / 4

    elif goal == "lebih_kuat":
        # Sedikit surplus, protein dan karbo maksimal
        kal   = tdee * 1.05
        prot  = profil["bb"] * 2.0
        lemak = kal * 0.25 / 9
        karbo = (kal - prot * 4 - lemak * 9) / 4

    elif goal == "massa_otot":
        # Surplus 15%, protein + lemak tinggi
        kal   = tdee * 1.15
        prot  = profil["bb"] * 1.8
        lemak = kal * 0.30 / 9
        karbo = (kal - prot * 4 - lemak * 9) / 4

    else:
        raise ValueError(f"Tujuan tidak dikenal: {goal}")

    return {
        "kalori"       : max(kal,   800.0),
        "protein_g"    : max(prot,   40.0),
        "karbohidrat_g": max(karbo,  50.0),
        "lemak_g"      : max(lemak,  20.0),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. CUSTOM ENVIRONMENT
# ─────────────────────────────────────────────────────────────────────────────

class MenuEnv:
    """
    State per langkah:
        [profil_norm (5)  +  target_norm (4)  +
         akumulasi_norm (4)  +  meal_step (1)  +
         fitur_menu_kandidat (N_MENU_CHOICES × 4)]

    Action: pilih 1 dari N_MENU_CHOICES menu yang ditawarkan.
    Episode: MEALS_PER_DAY langkah = 1 hari rekomendasi.
    """

    N_PROFIL = 5
    N_TARGET = 4
    N_ACCUM  = 4
    N_STEP   = 1
    N_MENU_F = N_MENU_CHOICES * 4
    STATE_SIZE = N_PROFIL + N_TARGET + N_ACCUM + N_STEP + N_MENU_F

    def __init__(self, db: pd.DataFrame):
        self.db           = db
        self.profil       = None
        self.target       = None
        self.menu_pool    = None
        self.current_menus= None
        self.accum        = None
        self.step         = 0
        self.chosen       = []

    # ── encode profil ─────────────────────────────────────────────────────
    def _encode_profil(self) -> np.ndarray:
        jk_enc   = 1.0 if self.profil["jk"].lower() in ("l","laki","pria","male","m") else 0.0
        goal_enc = GOALS.index(self.profil["tujuan"]) / max(len(GOALS) - 1, 1)
        return np.array([
            self.profil["umur"] / 80.0,
            self.profil["tb"]   / 220.0,
            self.profil["bb"]   / 150.0,
            jk_enc,
            goal_enc,
        ], dtype=np.float32)

    def _norm(self, arr: np.ndarray) -> np.ndarray:
        """Normalisasi terhadap target harian."""
        t = np.array([
            self.target["kalori"],
            self.target["protein_g"],
            self.target["karbohidrat_g"],
            self.target["lemak_g"],
        ], dtype=np.float32)
        return np.clip(arr / (t + 1e-8), 0.0, 2.0)

    def _menu_features(self, rows: pd.DataFrame) -> np.ndarray:
        """Fitur 4 nutrisi tiap menu, dinormalisasi terhadap target."""
        feats = rows[NUTRISI_COLS].values.astype(np.float32)
        t     = np.array([
            self.target["kalori"],
            self.target["protein_g"],
            self.target["karbohidrat_g"],
            self.target["lemak_g"],
        ], dtype=np.float32)
        return np.clip(feats / (t / MEALS_PER_DAY + 1e-8), 0.0, 3.0).flatten()

    # ── reset ─────────────────────────────────────────────────────────────
    def reset(self, profil: dict) -> np.ndarray:
        self.profil = profil
        self.target = hitung_target(profil)
        self.accum  = np.zeros(4, dtype=np.float32)
        self.step   = 0
        self.chosen = []

        # Sampel subset menu dari DB untuk 1 episode
        n = min(DB_SAMPLE_SIZE, len(self.db))
        self.menu_pool = self.db.sample(n, replace=False).reset_index(drop=True)

        return self._build_state()

    def _sample_candidates(self) -> pd.DataFrame:
        n = min(N_MENU_CHOICES, len(self.menu_pool))
        return self.menu_pool.sample(n, replace=False).reset_index(drop=True)

    def _build_state(self) -> np.ndarray:
        self.current_menus = self._sample_candidates()
        profil_f = self._encode_profil()
        target_f = self._norm(np.array([
            self.target["kalori"], self.target["protein_g"],
            self.target["karbohidrat_g"], self.target["lemak_g"],
        ], dtype=np.float32))
        accum_f  = self._norm(self.accum)
        step_f   = np.array([self.step / MEALS_PER_DAY], dtype=np.float32)
        menu_f   = self._menu_features(self.current_menus)
        return np.concatenate([profil_f, target_f, accum_f, step_f, menu_f])

    # ── step ──────────────────────────────────────────────────────────────
    def step_env(self, action: int):
        chosen = self.current_menus.iloc[action]
        nutrisi = chosen[NUTRISI_COLS].values.astype(np.float32)

        self.accum  += nutrisi
        self.chosen.append(chosen)
        self.step   += 1

        done   = (self.step >= MEALS_PER_DAY)
        reward = self._compute_reward(done)

        if done:
            return None, reward, True
        return self._build_state(), reward, False

    # ── reward ────────────────────────────────────────────────────────────
    def _compute_reward(self, done: bool) -> float:
        """
        Reward berbasis proximity ke target nutrisi.
        Setiap tujuan punya bobot prioritas berbeda.
        Bonus +2.0 di akhir episode jika semua nutrisi dalam toleransi.
        """
        t = self.target
        goal = self.profil["tujuan"]

        # Rasio akumulasi vs target (ideal = 1.0 di akhir hari)
        progress = self.step / MEALS_PER_DAY
        r_kal  = (self.accum[0] / (t["kalori"]        + 1e-8)) / progress
        r_prot = (self.accum[1] / (t["protein_g"]     + 1e-8)) / progress
        r_karb = (self.accum[2] / (t["karbohidrat_g"] + 1e-8)) / progress
        r_lemak= (self.accum[3] / (t["lemak_g"]       + 1e-8)) / progress

        def prox(ratio: float, ideal: float = 1.0, tol: float = 0.20) -> float:
            return max(0.0, 1.0 - abs(ratio - ideal) / tol)

        if goal == "turun_berat":
            # Kalori rendah (target sudah defisit), protein tinggi
            r = (prox(r_kal)  * 1.0 +
                 prox(r_prot) * 1.5 +
                 prox(r_karb) * 0.5 +
                 prox(r_lemak)* 0.5) / 3.5

        elif goal == "tetap_bugar":
            # Semua nutrisi seimbang, bobot merata
            r = (prox(r_kal)  * 1.0 +
                 prox(r_prot) * 1.0 +
                 prox(r_karb) * 1.0 +
                 prox(r_lemak)* 1.0) / 4.0

        elif goal == "lebih_kuat":
            # Protein dan karbo diprioritaskan
            r = (prox(r_kal)  * 1.0 +
                 prox(r_prot) * 2.0 +
                 prox(r_karb) * 1.5 +
                 prox(r_lemak)* 0.5) / 5.0

        elif goal == "massa_otot":
            # Surplus kalori, protein + lemak tinggi
            r = (prox(r_kal,  ideal=1.05) * 1.0 +
                 prox(r_prot)              * 1.5 +
                 prox(r_karb)              * 0.5 +
                 prox(r_lemak)             * 1.5) / 4.5
        else:
            r = 0.0

        # Bonus akhir episode
        if done:
            ok = all([
                0.80 <= self.accum[0] / (t["kalori"]        + 1e-8) <= 1.20,
                0.75 <= self.accum[1] / (t["protein_g"]     + 1e-8) <= 1.25,
                0.75 <= self.accum[2] / (t["karbohidrat_g"] + 1e-8) <= 1.25,
                0.75 <= self.accum[3] / (t["lemak_g"]       + 1e-8) <= 1.25,
            ])
            r += 2.0 if ok else 0.0

        return float(r)


# ─────────────────────────────────────────────────────────────────────────────
# 4. ARSITEKTUR AKTOR-KRITIK
# ─────────────────────────────────────────────────────────────────────────────

class ActorCritic(nn.Module):
    def __init__(self, state_size: int, action_size: int, hidden: int = HIDDEN_SIZE):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(state_size, hidden),
            nn.LayerNorm(hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.LayerNorm(hidden),
            nn.ReLU(),
        )
        self.actor = nn.Sequential(
            nn.Linear(hidden, hidden // 2),
            nn.ReLU(),
            nn.Linear(hidden // 2, action_size),
        )
        self.critic = nn.Sequential(
            nn.Linear(hidden, hidden // 2),
            nn.ReLU(),
            nn.Linear(hidden // 2, 1),
        )

    def forward(self, x: torch.Tensor):
        h      = self.shared(x)
        logits = self.actor(h)
        value  = self.critic(h).squeeze(-1)
        return logits, value

    def get_action(self, state: np.ndarray):
        s = torch.FloatTensor(state).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits, value = self(s)
        dist   = Categorical(logits=logits)
        action = dist.sample()
        return action.item(), dist.log_prob(action).item(), value.item()

    def evaluate(self, states, actions):
        logits, values = self(states)
        dist      = Categorical(logits=logits)
        log_probs = dist.log_prob(actions)
        entropy   = dist.entropy()
        return log_probs, values, entropy


# ─────────────────────────────────────────────────────────────────────────────
# 5. PPO BUFFER
# ─────────────────────────────────────────────────────────────────────────────

class PPOBuffer:
    def __init__(self):
        self.clear()

    def store(self, s, a, lp, r, v, d):
        self.states.append(s);     self.actions.append(a)
        self.log_probs.append(lp); self.rewards.append(r)
        self.values.append(v);     self.dones.append(d)

    def clear(self):
        self.states, self.actions, self.log_probs = [], [], []
        self.rewards, self.values, self.dones     = [], [], []

    def compute_returns(self, last_val: float = 0.0) -> torch.Tensor:
        """GAE-Lambda (λ=0.95)."""
        lam, returns, gae = 0.95, [], 0.0
        vals = self.values + [last_val]
        for t in reversed(range(len(self.rewards))):
            delta = (self.rewards[t]
                     + GAMMA * vals[t+1] * (1 - self.dones[t])
                     - vals[t])
            gae   = delta + GAMMA * lam * (1 - self.dones[t]) * gae
            returns.insert(0, gae + vals[t])
        return torch.FloatTensor(returns).to(DEVICE)


# ─────────────────────────────────────────────────────────────────────────────
# 6. TRAINING
# ─────────────────────────────────────────────────────────────────────────────

def random_profil() -> dict:
    return {
        "jk"    : random.choice(["l", "p"]),
        "umur"  : random.randint(18, 60),
        "tb"    : random.uniform(150, 190),
        "bb"    : random.uniform(45,  110),
        "tujuan": random.choice(GOALS),
    }


def train(json_path: str = JSON_PATH) -> tuple:
    print(f"[INFO] Memuat database menu: {json_path}")
    db = load_menu_db(json_path)
    if len(db) < N_MENU_CHOICES:
        raise ValueError(
            f"Database hanya punya {len(db)} menu, minimal butuh {N_MENU_CHOICES}."
        )
    print(f"[INFO] Device: {DEVICE}")

    env   = MenuEnv(db)
    model = ActorCritic(MenuEnv.STATE_SIZE, N_MENU_CHOICES, HIDDEN_SIZE).to(DEVICE)
    opt   = optim.Adam(model.parameters(), lr=LR, eps=1e-5)
    buf   = PPOBuffer()

    ep_rewards  = []
    log_rewards = []

    print(f"\n[TRAIN] Mulai training {TOTAL_EPISODES} episode...\n")

    for episode in range(1, TOTAL_EPISODES + 1):
        profil  = random_profil()
        state   = env.reset(profil)
        ep_r    = 0.0

        for _ in range(MEALS_PER_DAY):
            action, log_prob, value = model.get_action(state)
            next_state, reward, done = env.step_env(action)
            buf.store(state, action, log_prob, reward, value, float(done))
            ep_r  += reward
            state  = next_state if not done else state

        ep_rewards.append(ep_r)

        if episode % UPDATE_INTERVAL == 0:
            returns    = buf.compute_returns()
            states_t   = torch.FloatTensor(np.array(buf.states)).to(DEVICE)
            actions_t  = torch.LongTensor(buf.actions).to(DEVICE)
            old_lp_t   = torch.FloatTensor(buf.log_probs).to(DEVICE)
            values_t   = torch.FloatTensor(buf.values).to(DEVICE)

            advantages = returns - values_t
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

            for _ in range(EPOCHS_PER_UPDATE):
                perm = torch.randperm(len(buf.states))
                for i in range(0, len(buf.states), BATCH_SIZE):
                    idx = perm[i:i + BATCH_SIZE]
                    lp, v, ent = model.evaluate(states_t[idx], actions_t[idx])
                    ratio = torch.exp(lp - old_lp_t[idx])
                    surr1 = ratio * advantages[idx]
                    surr2 = torch.clamp(ratio, 1-CLIP_EPS, 1+CLIP_EPS) * advantages[idx]
                    loss  = (
                        -torch.min(surr1, surr2).mean()
                        + VALUE_COEF  * nn.MSELoss()(v, returns[idx])
                        - ENTROPY_COEF* ent.mean()
                    )
                    opt.zero_grad()
                    loss.backward()
                    nn.utils.clip_grad_norm_(model.parameters(), 0.5)
                    opt.step()

            buf.clear()
            avg = sum(ep_rewards[-UPDATE_INTERVAL:]) / UPDATE_INTERVAL
            log_rewards.append({"episode": episode, "avg_reward": round(avg, 4)})
            print(f"  Episode {episode:>5}/{TOTAL_EPISODES}  |  Avg Reward: {avg:+.4f}")

    # Simpan model
    torch.save({
        "model_state": model.state_dict(),
        "state_size" : MenuEnv.STATE_SIZE,
        "action_size": N_MENU_CHOICES,
        "hidden_size": HIDDEN_SIZE,
    }, MODEL_PATH)
    print(f"\n[SAVE] Model  → {MODEL_PATH}")

    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(log_rewards, f, indent=2)
    print(f"[SAVE] Log    → {LOG_PATH}")

    return model, db


# ─────────────────────────────────────────────────────────────────────────────
# 7. PREDIKSI
# ─────────────────────────────────────────────────────────────────────────────

def predict(
    profil     : dict,
    db         : pd.DataFrame,
    model      : ActorCritic = None,
    top_k      : int = 5,
    n_rollout  : int = 200,
) -> tuple[list[dict], dict]:
    """
    Jalankan n_rollout episode dengan agen terlatih.
    Ranking menu berdasarkan skor rata-rata yang dikontribusikan.

    Return:
        (list of top_k menu dict, target nutrisi dict)
    """
    if model is None:
        ckpt  = torch.load(MODEL_PATH, map_location=DEVICE)
        model = ActorCritic(
            ckpt["state_size"], ckpt["action_size"], ckpt["hidden_size"]
        ).to(DEVICE)
        model.load_state_dict(ckpt["model_state"])
    model.eval()

    env    = MenuEnv(db)
    target = hitung_target(profil)
    scores: dict[str, dict] = {}

    for _ in range(n_rollout):
        state   = env.reset(profil)
        total_r = 0.0

        for _ in range(MEALS_PER_DAY):
            action, _, _ = model.get_action(state)
            menu_row     = env.current_menus.iloc[action]
            nama         = menu_row["nama_menu"]

            next_state, reward, done = env.step_env(action)
            total_r += reward

            if nama not in scores:
                scores[nama] = {
                    "total_reward": 0.0,
                    "count"       : 0,
                    "row"         : menu_row,
                }
            scores[nama]["total_reward"] += total_r
            scores[nama]["count"]        += 1

            state = next_state if not done else state

    ranked = sorted(
        scores.items(),
        key=lambda x: x[1]["total_reward"] / max(x[1]["count"], 1),
        reverse=True,
    )

    recs = []
    for nama, data in ranked[:top_k]:
        row = data["row"]
        recs.append({
            "nama_menu"    : nama,
            "url"          : str(row.get("url", "")),
            "kalori"       : round(float(row["kalori"]),        1),
            "protein_g"    : round(float(row["protein_g"]),     1),
            "karbohidrat_g": round(float(row["karbohidrat_g"]), 1),
            "lemak_g"      : round(float(row["lemak_g"]),       1),
            "serat_g"      : round(float(row.get("serat_g", 0)),1),
            "bahan"        : str(row.get("bahan", "")),
            "skor_agen"    : round(data["total_reward"] / data["count"], 4),
            "dipilih_kali" : data["count"],
        })

    return recs, target


# ─────────────────────────────────────────────────────────────────────────────
# 8. ANTARMUKA INTERAKTIF
# ─────────────────────────────────────────────────────────────────────────────

def input_profil_interaktif() -> dict:
    GOAL_LABELS = {
        "turun_berat": "Menurunkan berat badan",
        "tetap_bugar": "Tetap bugar",
        "lebih_kuat" : "Menjadi lebih kuat",
        "massa_otot" : "Meningkatkan massa otot",
    }
    print("\n" + "═"*55)
    print("  INPUT PROFIL PENGGUNA")
    print("═"*55)
    jk   = input("Jenis kelamin [l/p]  : ").strip().lower()
    umur = int(input("Umur (tahun)         : ").strip())
    tb   = float(input("Tinggi badan (cm)    : ").strip())
    bb   = float(input("Berat badan (kg)     : ").strip())
    print("\nTujuan utama:")
    for i, (key, label) in enumerate(GOAL_LABELS.items(), 1):
        print(f"  {i}. {label}")
    idx    = int(input("Pilih [1-4]          : ").strip()) - 1
    tujuan = GOALS[idx]
    return {"jk": jk, "umur": umur, "tb": tb, "bb": bb, "tujuan": tujuan}


def tampilkan_rekomendasi(recs: list[dict], target: dict, profil: dict):
    GOAL_LABELS = {
        "turun_berat": "Menurunkan Berat Badan",
        "tetap_bugar": "Tetap Bugar",
        "lebih_kuat" : "Menjadi Lebih Kuat",
        "massa_otot" : "Meningkatkan Massa Otot",
    }
    print("\n" + "═"*70)
    print(f"  REKOMENDASI MENU  |  Tujuan: {GOAL_LABELS[profil['tujuan']]}")
    print("═"*70)
    print(f"  Target harian  →  "
          f"Kalori: {target['kalori']:.0f} kcal  |  "
          f"Protein: {target['protein_g']:.0f} g  |  "
          f"Karbo: {target['karbohidrat_g']:.0f} g  |  "
          f"Lemak: {target['lemak_g']:.0f} g")
    print("─"*70)

    for i, r in enumerate(recs, 1):
        print(f"\n  {i}. {r['nama_menu']}")
        print(f"     Kalori   : {r['kalori']} kcal  |  "
              f"Protein: {r['protein_g']} g  |  "
              f"Karbo: {r['karbohidrat_g']} g  |  "
              f"Lemak: {r['lemak_g']} g")
        if r["bahan"]:
            bahan_list = r["bahan"].split("|")[:5]   # tampilkan max 5 bahan
            print(f"     Bahan    : {', '.join(b.strip() for b in bahan_list if b.strip())}")
        if r["url"]:
            print(f"     URL      : {r['url']}")
        print(f"     Skor Agen: {r['skor_agen']}  "
              f"(dipilih {r['dipilih_kali']}x dalam simulasi)")

    print("\n" + "═"*70)

    # Estimasi nutrisi gabungan top-3
    if len(recs) >= 3:
        gabung = {
            k: round(sum(r[k] for r in recs[:3]), 1)
            for k in ["kalori","protein_g","karbohidrat_g","lemak_g"]
        }
        print("\n  Estimasi nutrisi jika memilih menu 1+2+3 dalam sehari:")
        print(f"    Kalori total  : {gabung['kalori']} kcal"
              f"  (target: {target['kalori']:.0f})")
        print(f"    Protein total : {gabung['protein_g']} g"
              f"  (target: {target['protein_g']:.0f})")
        print(f"    Karbo total   : {gabung['karbohidrat_g']} g"
              f"  (target: {target['karbohidrat_g']:.0f})")
        print(f"    Lemak total   : {gabung['lemak_g']} g"
              f"  (target: {target['lemak_g']:.0f})")
        print("═"*70)


# ─────────────────────────────────────────────────────────────────────────────
# 9. MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="DRL Food Menu Recommendation Agent"
    )
    parser.add_argument("--mode",
        choices=["train", "predict"], default="train",
        help="train: latih agen  |  predict: prediksi menu")
    parser.add_argument("--json",
        default=JSON_PATH,
        help="Path ke file JSON hasil scraping (nutrition_results.json)")
    parser.add_argument("--model",
        default=MODEL_PATH,
        help="Path untuk simpan/baca bobot model")
    parser.add_argument("--episodes",
        type=int, default=TOTAL_EPISODES,
        help="Jumlah episode training (default: 3000)")
    parser.add_argument("--predict_after",
        action="store_true",
        help="Langsung jalankan prediksi setelah training selesai")
    args = parser.parse_args()

    JSON_PATH      = args.json
    MODEL_PATH     = args.model
    TOTAL_EPISODES = args.episodes

    if args.mode == "train":
        model, db = train(JSON_PATH)
        if args.predict_after:
            profil = input_profil_interaktif()
            print("\n[INFO] Menjalankan simulasi agen (200 rollout)...")
            recs, target = predict(profil, db=db, model=model)
            tampilkan_rekomendasi(recs, target, profil)

    elif args.mode == "predict":
        if not Path(MODEL_PATH).exists():
            print(f"[ERROR] Model tidak ditemukan: {MODEL_PATH}")
            print("        Jalankan dulu: python drl_food_agent.py --mode train")
        else:
            db     = load_menu_db(JSON_PATH)
            profil = input_profil_interaktif()
            print("\n[INFO] Menjalankan simulasi agen (200 rollout)...")
            recs, target = predict(profil, db=db)
            tampilkan_rekomendasi(recs, target, profil)