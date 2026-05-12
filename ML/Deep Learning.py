import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
import joblib
import os

def buat_data_training_simulasi(df_makanan, jumlah_sampel=5000):
    """
    (Fungsi ini sama persis seperti sebelumnya)
    Membuat data simulasi interaksi User dan Makanan.
    """
    print("Membangun data training simulasi untuk Deep Learning...")
    data_x = []
    data_y = []
    
    makanan_sampel = df_makanan.sample(n=jumlah_sampel, replace=True)
    
    for _, row in makanan_sampel.iterrows():
        target_kalori_user = np.random.randint(1500, 2500)
        butuh_tinggi_protein = np.random.randint(0, 2)
        
        kalori_makanan = row['kalori']
        protein_makanan = row['protein_g']
        
        # Logika kecocokan
        target_per_makan = target_kalori_user * 0.30
        kalori_cocok = (target_per_makan - 150) <= kalori_makanan <= (target_per_makan + 150)
        
        protein_cocok = True
        if butuh_tinggi_protein == 1 and protein_makanan < 15.0:
            protein_cocok = False
            
        label = 1 if (kalori_cocok and protein_cocok) else 0
            
        fitur = [
            target_kalori_user, 
            butuh_tinggi_protein, 
            row['kalori'], 
            row['protein_g'], 
            row['karbohidrat_g'], 
            row['lemak_g']
        ]
        
        data_x.append(fitur)
        data_y.append(label)
        
    return pd.DataFrame(data_x, columns=['target_kalori_user', 'butuh_tinggi_protein', 'kalori_makanan', 'protein_makanan', 'karbohidrat', 'lemak']), pd.Series(data_y)

def latih_dan_simpan_model_dl():
    nama_file_data = 'food_siap_training.csv'
    
    if not os.path.exists(nama_file_data):
        print(f"Error: File {nama_file_data} tidak ditemukan!")
        return

    # 1. Muat Data & Siapkan Fitur
    df_makanan = pd.read_csv(nama_file_data)
    X, y = buat_data_training_simulasi(df_makanan, jumlah_sampel=15000) # Deep Learning butuh data lebih banyak
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 2. PROSES PENTING: Scaling Data (Standarisasi agar ML tidak bingung beda rentang angka)
    print("Melakukan scaling data...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Simpan scaler-nya! Ini wajib dipakai lagi nanti di server (FastAPI)
    joblib.dump(scaler, 'scaler_diet.pkl')
    
    # 3. MEMBANGUN ARSITEKTUR DEEP LEARNING (Neural Network)
    print("Membangun model Deep Learning...")
    model_dl = Sequential([
        # Layer Input: Menerima 6 fitur masukan
        Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)),
        
        # Dropout: Mencegah model menghafal data (overfitting)
        Dropout(0.2),
        
        # Layer Tersembunyi (Hidden Layer)
        Dense(32, activation='relu'),
        
        # Layer Output: Menghasilkan probabilitas (0 sampai 1) -> Sigmoid
        Dense(1, activation='sigmoid')
    ])
    
    # 4. Kompilasi Model
    model_dl.compile(
        optimizer='adam', 
        loss='binary_crossentropy', # Karena target kita 0 atau 1 (Tidak Cocok / Cocok)
        metrics=['accuracy']
    )
    
    # 5. Latih Model (Epoch = berapa kali model belajar dari seluruh data)
    print("Mulai proses training (belajar)...")
    history = model_dl.fit(
        X_train_scaled, 
        y_train, 
        epochs=32,
        batch_size=64,
        validation_split=0.25,
        verbose=1
    )
    
    # 6. Evaluasi Model pada Data Uji (Test Data)
    print("\nMelakukan pengujian akhir...")
    loss, akurasi = model_dl.evaluate(X_test_scaled, y_test, verbose=0)
    print("-" * 40)
    print(f"✅ Akurasi Deep Learning Model: {akurasi * 100:.2f}%")
    print("-" * 40)
    
    # 7. Simpan Model Deep Learning (Format khusus Keras .h5)
    nama_file_model = 'model_diet_dl.h5'
    model_dl.save(nama_file_model)
    print(f"🎉 Model disimpan sebagai: {nama_file_model}")
    print("🎉 Scaler disimpan sebagai: scaler_diet.pkl")
    print("Kedua file ini siap dibawa ke server backend!")

if __name__ == "__main__":
    latih_dan_simpan_model_dl()