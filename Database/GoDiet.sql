-- Membuat Tabel Users
CREATE TABLE users (
    id_user VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'enduser') NOT NULL
);

-- Membuat Tabel Profil EndUser (Inheritance)
CREATE TABLE end_user_profiles (
    id_user VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100),
    berat_badan FLOAT,
    tinggi_badan FLOAT,
    usia INT,
    jenis_kelamin VARCHAR(20),
    tingkat_aktivitas VARCHAR(50),
    target_kalori_harian FLOAT,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- Membuat Tabel Food
CREATE TABLE foods (
    id_makanan VARCHAR(50) PRIMARY KEY,
    nama_makanan VARCHAR(100) NOT NULL,
    kalori FLOAT,
    protein FLOAT,
    lemak FLOAT,
    karbohidrat FLOAT,
    resep TEXT,
    kategori VARCHAR(50)
);

-- Membuat Tabel History
CREATE TABLE histories (
    id_history VARCHAR(50) PRIMARY KEY,
    id_user VARCHAR(50),
    tanggal_akses DATE,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- Tabel Penghubung History dan Food (List<Food>)
CREATE TABLE history_details (
    id_history VARCHAR(50),
    id_makanan VARCHAR(50),
    PRIMARY KEY (id_history, id_makanan),
    FOREIGN KEY (id_history) REFERENCES histories(id_history) ON DELETE CASCADE,
    FOREIGN KEY (id_makanan) REFERENCES foods(id_makanan) ON DELETE CASCADE
);

-- Membuat Tabel Bookmark
CREATE TABLE bookmarks (
    id_bookmark VARCHAR(50) PRIMARY KEY,
    id_user VARCHAR(50),
    tanggal_disimpan DATE,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- Tabel Penghubung Bookmark dan Food (List<Food>)
CREATE TABLE bookmark_details (
    id_bookmark VARCHAR(50),
    id_makanan VARCHAR(50),
    PRIMARY KEY (id_bookmark, id_makanan),
    FOREIGN KEY (id_bookmark) REFERENCES bookmarks(id_bookmark) ON DELETE CASCADE,
    FOREIGN KEY (id_makanan) REFERENCES foods(id_makanan) ON DELETE CASCADE
);

-- Membuat Tabel Reports (Laporan Pengguna)
CREATE TABLE reports (
    id_report VARCHAR(50) PRIMARY KEY,
    id_user VARCHAR(50),
    username VARCHAR(100),
    judul VARCHAR(200),
    isi_laporan TEXT,
    kategori VARCHAR(50) DEFAULT 'Umum',
    status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);