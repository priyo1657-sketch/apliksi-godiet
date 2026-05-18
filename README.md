# 🍎 Aplikasi GoDiet

Aplikasi mobile multi-platform untuk membantu pengguna menjalani gaya hidup sehat dan mencapai target diet mereka. Dibangun dengan teknologi modern menggunakan React Native dan Expo untuk memberikan pengalaman pengguna yang seamless di iOS, Android, dan Web.

## ✨ Fitur Utama

- 📱 **Cross-Platform**: Berjalan di iOS, Android, dan Web dengan satu codebase
- 🚀 **Pengalaman Cepat**: Built dengan React Native 0.81 dan React 19
- 🎯 **Navigasi Intuitif**: Bottom tab navigation untuk akses fitur dengan mudah
- 🎨 **UI Modern**: Menggunakan Expo Vector Icons dan React Navigation
- 📷 **Integrasi Kamera**: Fitur kamera built-in via Expo Camera
- 🔤 **Font Custom**: Support untuk font custom dengan Expo Font
- ✅ **Code Quality**: Linting dengan ESLint dan Expo config

## 🛠️ Teknologi

- **Framework**: React 19.1.0 & React Native 0.81.5
- **Platform**: Expo 54.0.33
- **Bahasa**: TypeScript 5.9.2
- **Navigation**: React Navigation 7.x
- **Build Tool**: Expo Router 6.0.23
- **UI Components**: Expo Vector Icons 15.0.3

## 📋 Prerequisites

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Expo CLI (opsional, bisa gunakan `npx expo`)
- Android Studio (untuk emulator Android)
- Xcode (untuk iOS simulator di macOS)

## 🚀 Getting Started

### 1. Instalasi Dependencies

```bash
npm install
```

### 2. Menjalankan Aplikasi

**Development mode:**
```bash
npm start
```

**Untuk platform spesifik:**
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### 3. Akses Aplikasi

Setelah menjalankan `npm start`, Anda akan melihat QR code. Anda bisa:
- Scan dengan [Expo Go](https://expo.dev/go) untuk development build
- Buka di Android Emulator
- Buka di iOS Simulator
- Akses di browser untuk versi web

## 📁 Struktur Project

```
apliksi-godiet/
├── app/                    # Main app directory (file-based routing)
├── app-example/           # Starter code contoh
├── node_modules/          # Dependencies
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Documentation ini
```

Project ini menggunakan **file-based routing** dengan Expo Router. Setiap file di folder `app/` akan menjadi route otomatis.

## 📝 Available Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm start` | Start development server |
| `npm run android` | Jalankan di Android emulator |
| `npm run ios` | Jalankan di iOS simulator |
| `npm run web` | Jalankan di browser web |
| `npm run lint` | Check code quality dengan ESLint |
| `npm run reset-project` | Reset ke blank project (move starter code) |

## 🔧 Konfigurasi

### Mengubah Splash Screen
Edit konfigurasi di `app.json` untuk customize splash screen dan app icon.

### Menambah Dependencies
```bash
npm install <package-name>
```

Atau untuk dependencies yang specific ke native:
```bash
expo install <package-name>
```

## 📚 Dokumentasi

- [Expo Documentation](https://docs.expo.dev/) - Panduan lengkap Expo
- [React Navigation Docs](https://reactnavigation.org/) - Dokumentasi Navigation
- [Expo Router Guide](https://docs.expo.dev/router/introduction/) - File-based routing
- [React Native Docs](https://reactnative.dev/) - React Native fundamentals

## 🤝 Kontribusi

Kontribusi sangat diterima! Untuk kontribusi:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit changes Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 🐛 Reporting Issues

Jika menemukan bug atau ada saran, silakan buat issue di [Issues](https://github.com/priyo1657-sketch/apliksi-godiet/issues).

## 📜 License

Project ini belum memiliki lisensi yang ditentukan. Lihat [LICENSE](LICENSE) untuk detail lebih lanjut.

## 👨‍💻 Author

**priyo1657-sketch**

- GitHub: [@priyo1657-sketch](https://github.com/priyo1657-sketch)
- Repository: [apliksi-godiet](https://github.com/priyo1657-sketch/apliksi-godiet)

## 🎯 Roadmap

- [ ] Implementasi fitur diet tracking
- [ ] Integrasi dengan nutrition database
- [ ] Push notifications
- [ ] User authentication
- [ ] Cloud sync untuk cross-device
- [ ] Progress tracking & analytics

---

**Happy Coding! 🚀** Semoga aplikasi GoDiet membantu Anda mencapai target kesehatan!
