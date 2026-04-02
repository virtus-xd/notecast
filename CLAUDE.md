# CLAUDE.md — NotCast: Öğrenci Not → Podcast Platformu

## 🎯 Proje Özeti

**NotCast**, öğrencilerin ders notlarını (dijital veya el yazısı fotoğrafı) yükleyerek yapay zeka ile metne dönüştürüp, düzenleyip, gerçekçi Türkçe sesle podcast formatında dinleyebildiği bir web platformudur.

---

## 📐 Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS        │
│  shadcn/ui · Zustand (state) · React Query (data fetching)  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST + WebSocket (progress)
┌────────────────────────▼────────────────────────────────────┐
│                        BACKEND                              │
│  Node.js + Express.js + TypeScript                          │
│  Bull (job queue) · Socket.IO (realtime) · Multer (upload)  │
└────┬──────────┬──────────┬──────────┬───────────────────────┘
     │          │          │          │
┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼──────────┐
│PostgreSQL│ │ Redis  │ │  S3    │ │ External APIs│
│(Prisma) │ │(Queue/ │ │(MinIO) │ │ - ElevenLabs │
│         │ │ Cache) │ │        │ │ - Claude API │
└─────────┘ └────────┘ └────────┘ │ - Google OCR │
                                   └──────────────┘
```

---

## 🔧 Teknoloji Stack'i

### Frontend
- **Framework:** Next.js 14 (App Router, Server Components)
- **Dil:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3 + shadcn/ui component library
- **State:** Zustand (global) + React Query v5 (server state)
- **Form:** React Hook Form + Zod validation
- **Audio Player:** Custom player (wavesurfer.js entegrasyonu)
- **Upload:** react-dropzone (drag & drop, kamera desteği)
- **Animasyon:** Framer Motion
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js + TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Auth:** Passport.js + JWT (access + refresh token)
- **Job Queue:** Bull + Redis (arka plan işleri için)
- **Realtime:** Socket.IO (işlem durumu bildirimi)
- **Upload:** Multer + Sharp (görsel ön işleme)
- **Validation:** Zod (shared schemas frontend ile)
- **Logger:** Pino
- **Test:** Vitest + Supertest

### Veritabanı & Depolama
- **DB:** PostgreSQL 16
- **Cache/Queue:** Redis 7
- **Object Storage:** MinIO (S3-uyumlu, self-hosted) veya AWS S3
- **CDN:** CloudFront veya Nginx reverse proxy

### Harici Servisler
| Servis | Kullanım | Model/Plan |
|--------|----------|------------|
| **ElevenLabs API** | Türkçe TTS (podcast seslendirme) | Multilingual v2 (Türkçe destekli), Flash v2.5 (düşük gecikme) |
| **Claude API (Anthropic)** | Metin analizi, başlık çıkarma, düzenleme, podcast script yazımı | claude-sonnet-4-20250514 |
| **Google Cloud Vision API** | El yazısı/fotoğraf OCR (birincil) | Document AI / Vision OCR |
| **Tesseract.js** | Fallback OCR (basit basılı metinler) | v5 + tur.traineddata |

---

## 📁 Proje Yapısı

```
notcast/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/        # Ana panel
│   │   │   │   ├── notes/            # Not listesi & detay
│   │   │   │   ├── podcasts/         # Podcast listesi & player
│   │   │   │   ├── upload/           # Not yükleme sayfası
│   │   │   │   └── settings/         # Kullanıcı ayarları
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── pricing/
│   │   │   │   └── about/
│   │   │   ├── api/                  # Next.js API routes (BFF)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui bileşenleri
│   │   │   ├── layout/               # Header, Sidebar, Footer
│   │   │   ├── notes/                # Not ile ilgili bileşenler
│   │   │   ├── podcasts/             # Podcast player, liste
│   │   │   ├── upload/               # Upload wizard bileşenleri
│   │   │   └── shared/               # Ortak bileşenler
│   │   ├── lib/
│   │   │   ├── api.ts                # API client (axios instance)
│   │   │   ├── auth.ts               # Auth helpers
│   │   │   ├── utils.ts
│   │   │   └── validations.ts        # Zod schemas
│   │   ├── hooks/                    # Custom hooks
│   │   ├── stores/                   # Zustand stores
│   │   ├── types/                    # TypeScript tipleri
│   │   └── public/
│   │       ├── fonts/
│   │       └── images/
│   │
│   └── server/                       # Express.js Backend
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   ├── storage.ts        # S3/MinIO config
│       │   │   └── env.ts            # Environment validation
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   └── strategies/    # Passport strategies
│       │   │   ├── users/
│       │   │   │   ├── user.controller.ts
│       │   │   │   ├── user.service.ts
│       │   │   │   └── user.routes.ts
│       │   │   ├── notes/
│       │   │   │   ├── note.controller.ts
│       │   │   │   ├── note.service.ts
│       │   │   │   ├── note.routes.ts
│       │   │   │   └── processors/
│       │   │   │       ├── ocr.processor.ts
│       │   │   │       ├── text-analyzer.processor.ts
│       │   │   │       └── image-preprocessor.ts
│       │   │   ├── podcasts/
│       │   │   │   ├── podcast.controller.ts
│       │   │   │   ├── podcast.service.ts
│       │   │   │   ├── podcast.routes.ts
│       │   │   │   └── processors/
│       │   │   │       ├── script-generator.processor.ts
│       │   │   │       └── tts.processor.ts
│       │   │   └── voices/
│       │   │       ├── voice.controller.ts
│       │   │       ├── voice.service.ts
│       │   │       └── voice.routes.ts
│       │   ├── jobs/
│       │   │   ├── queue.ts           # Bull queue tanımları
│       │   │   ├── note-processing.job.ts
│       │   │   └── podcast-generation.job.ts
│       │   ├── shared/
│       │   │   ├── middleware/
│       │   │   │   ├── error-handler.ts
│       │   │   │   ├── rate-limiter.ts
│       │   │   │   ├── upload.ts
│       │   │   │   └── validate.ts
│       │   │   ├── services/
│       │   │   │   ├── elevenlabs.service.ts
│       │   │   │   ├── claude.service.ts
│       │   │   │   ├── google-vision.service.ts
│       │   │   │   └── storage.service.ts
│       │   │   └── utils/
│       │   │       ├── logger.ts
│       │   │       └── errors.ts
│       │   ├── prisma/
│       │   │   ├── schema.prisma
│       │   │   ├── migrations/
│       │   │   └── seed.ts
│       │   └── app.ts                # Express app setup
│       ├── tests/
│       └── tsconfig.json
│
├── packages/
│   └── shared/                       # Paylaşılan tipler & şemalar
│       ├── types/
│       ├── schemas/                  # Zod schemas (ortak)
│       └── constants/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── turbo.json                        # Turborepo config
├── package.json
├── pnpm-workspace.yaml
└── CLAUDE.md                         # Bu dosya
```

---

## 🗄️ Veritabanı Şeması (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  FREE
  PREMIUM
  ADMIN
}

enum NoteStatus {
  UPLOADED        // Dosya yüklendi
  PREPROCESSING   // Görsel ön işleme
  OCR_PROCESSING  // OCR çalışıyor
  TEXT_EXTRACTED   // Metin çıkarıldı
  ANALYZING       // Claude ile analiz ediliyor
  READY           // Metin hazır
  ERROR           // Hata oluştu
}

enum PodcastStatus {
  PENDING         // Sırada bekliyor
  SCRIPT_WRITING  // Script yazılıyor
  GENERATING_AUDIO // Ses üretiliyor
  MERGING         // Ses dosyaları birleştiriliyor
  READY           // Dinlemeye hazır
  ERROR           // Hata oluştu
}

enum UploadType {
  IMAGE           // Kağıt fotoğrafı
  PDF             // PDF dosyası
  TEXT            // Dijital metin
  DOCUMENT        // Word/Google Docs
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  avatarUrl       String?
  role            UserRole  @default(FREE)
  emailVerified   Boolean   @default(false)
  verifyToken     String?
  resetToken      String?
  resetTokenExp   DateTime?
  
  preferredVoiceId String?  // Varsayılan ses tercihi
  
  notes           Note[]
  podcasts        Podcast[]
  sessions        Session[]
  
  monthlyCredits  Int       @default(3)    // Aylık ücretsiz podcast hakkı
  creditsUsed     Int       @default(0)
  creditsResetAt  DateTime  @default(now())
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token       String   @unique
  expiresAt   DateTime
  userAgent   String?
  ipAddress   String?
  createdAt   DateTime @default(now())
}

model Note {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String      // Otomatik veya kullanıcı tarafından
  description     String?
  
  // Yükleme bilgileri
  uploadType      UploadType
  originalFileUrl String      // S3/MinIO path
  originalFileName String
  fileSizeBytes   Int
  mimeType        String
  
  // OCR & İşleme
  status          NoteStatus  @default(UPLOADED)
  rawExtractedText String?    @db.Text  // OCR çıktısı (ham)
  processedText   String?     @db.Text  // Claude ile düzenlenmiş
  
  // Yapılandırılmış içerik (JSON)
  sections        Json?       // [{title, content, order}]
  tags            String[]    // Otomatik etiketler
  subject         String?     // Ders/konu adı
  
  errorMessage    String?
  processingStartedAt DateTime?
  processingCompletedAt DateTime?
  
  podcasts        Podcast[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
}

model Podcast {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteId          String
  note            Note          @relation(fields: [noteId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  
  // Ses bilgileri
  voiceId         String        // ElevenLabs voice ID
  voiceName       String        // Ses adı (gösterim için)
  
  status          PodcastStatus @default(PENDING)
  
  // Script
  scriptText      String?       @db.Text  // Podcast script metni
  
  // Audio
  audioUrl        String?       // S3/MinIO path
  audioDuration   Int?          // Saniye cinsinden süre
  audioSizeBytes  Int?
  
  // Podcast ayarları
  speed           Float         @default(1.0) // Konuşma hızı
  style           String        @default("educational") // Stil: educational, conversational, summary
  
  errorMessage    String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
}

model Voice {
  id              String   @id @default(cuid())
  elevenLabsId    String   @unique  // ElevenLabs voice ID
  name            String
  description     String?
  gender          String   // male, female
  accent          String   @default("turkish") // Aksan
  previewUrl      String?  // Önizleme ses dosyası
  category        String   @default("general") // general, academic, storytelling
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text
}
```

---

## 🔄 İş Akışı (Pipeline)

### Not Yükleme → Podcast Oluşturma Akışı

```
[1] UPLOAD
  Kullanıcı dosya yükler (görsel/PDF/metin)
      │
      ▼
[2] ÖN İŞLEME (IMAGE PREPROCESSING)
  - Sharp ile görsel düzenleme (contrast, deskew, denoise)
  - PDF ise sayfa sayfa ayrıştırma
  - Dosya boyutu & format kontrolü
      │
      ▼
[3] OCR (METİN ÇIKARMA)
  ┌─ Görsel/PDF → Google Cloud Vision API (birincil)
  │                Tesseract.js (fallback, basit metinler)
  └─ Dijital metin → Doğrudan alınır
      │
      ▼
[4] METİN ANALİZİ & DÜZENLEME (Claude API)
  - Ham metin temizleme (OCR hataları düzeltme)
  - Başlıklara ayırma (zaten ayrılmışsa koruma)
  - Konu/ders tespiti
  - Otomatik etiketleme
  - Düzenli, okunabilir formata dönüştürme
      │
      ▼
[5] PODCAST SCRİPT OLUŞTURMA (Claude API)
  - Düzenlenmiş metinden podcast script'i yazma
  - Stil seçimine göre ton ayarlama:
    • educational: Ders anlatır gibi, açıklayıcı
    • conversational: Sohbet havasında, samimi
    • summary: Kısa ve öz, tekrar odaklı
  - Geçiş cümleleri, giriş/kapanış ekleme
      │
      ▼
[6] SES ÜRETİMİ (ElevenLabs API)
  - Script'i bölümlere ayırma (API karakter limiti)
  - Seçilen ses ile seslendirme
  - Bölümleri birleştirme (ffmpeg)
  - MP3 formatında kaydetme
      │
      ▼
[7] TESLİMAT
  - Audio dosyası S3'e yüklenir
  - Kullanıcıya bildirim (WebSocket)
  - Dashboard'da dinlemeye hazır
```

---

## 🔌 API Endpoint'leri

### Auth
```
POST   /api/auth/register          Kayıt ol
POST   /api/auth/login             Giriş yap
POST   /api/auth/logout            Çıkış yap
POST   /api/auth/refresh           Token yenile
POST   /api/auth/forgot-password   Şifre sıfırlama e-postası
POST   /api/auth/reset-password    Şifre sıfırla
GET    /api/auth/verify/:token     E-posta doğrula
GET    /api/auth/me                Mevcut kullanıcı bilgisi
```

### Notes
```
GET    /api/notes                  Kullanıcının notları (paginated)
GET    /api/notes/:id              Tek not detayı
POST   /api/notes/upload           Not yükle (multipart/form-data)
PATCH  /api/notes/:id              Not güncelle (başlık, tag vs.)
DELETE /api/notes/:id              Not sil
POST   /api/notes/:id/reprocess    Tekrar işle (OCR + analiz)
GET    /api/notes/:id/status       İşlem durumu (polling alternatifi)
```

### Podcasts
```
GET    /api/podcasts               Kullanıcının podcast'leri
GET    /api/podcasts/:id           Tek podcast detayı
POST   /api/podcasts/generate      Podcast oluştur (noteId, voiceId, style)
DELETE /api/podcasts/:id           Podcast sil
GET    /api/podcasts/:id/stream    Audio stream
GET    /api/podcasts/:id/download  Audio indir
POST   /api/podcasts/:id/regenerate Tekrar oluştur
```

### Voices
```
GET    /api/voices                 Mevcut ses listesi
GET    /api/voices/:id/preview     Ses önizleme
```

### User
```
PATCH  /api/users/profile          Profil güncelle
PATCH  /api/users/password         Şifre değiştir
GET    /api/users/usage            Kullanım istatistikleri
PATCH  /api/users/preferences      Tercihler (varsayılan ses vs.)
```

---

## 🎙️ ElevenLabs Entegrasyonu — Detaylı

### Kullanılacak Model
- **Multilingual v2**: En yüksek kalite, Türkçe dahil 32 dil desteği. Podcast gibi uzun form içerik için ideal.
- **Flash v2.5**: Düşük gecikme, önizleme için kullanılabilir.

### Ses Seçenekleri (Türkçe)
ElevenLabs Voice Library'den Türkçe uyumlu sesler seçilecek. Ayrıca kullanıcı kendi API key'i ile özel ses de ekleyebilir.

### API Kullanım Stratejisi
```typescript
// elevenlabs.service.ts yapısı

class ElevenLabsService {
  // Uzun metinleri 5000 karakterlik parçalara böl
  // Her parça için ayrı API çağrısı yap
  // Parçaları sıralı birleştir (ffmpeg concat)
  
  async generateSpeech(text: string, voiceId: string, options: TTSOptions): Promise<Buffer> {
    const chunks = this.splitText(text, 5000);
    const audioBuffers: Buffer[] = [];
    
    for (const chunk of chunks) {
      const audio = await this.callTTSApi(chunk, voiceId, {
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,        // Doğal varyasyon
          similarity_boost: 0.8, // Ses tutarlılığı
          style: 0.3,            // Stil yoğunluğu
          use_speaker_boost: true
        },
        output_format: "mp3_44100_128"
      });
      audioBuffers.push(audio);
    }
    
    return this.mergeAudioBuffers(audioBuffers); // ffmpeg ile
  }
  
  // Metin bölme: Cümle sonlarından böl, kelime ortasından bölme
  private splitText(text: string, maxLength: number): string[] { ... }
}
```

### Maliyet Optimizasyonu
- **Caching:** Aynı metin + ses kombinasyonu için önbellek
- **Chunk Reuse:** Giriş/kapanış metinleri cache'le
- **Kredi Sistemi:** Ücretsiz üyelik: 3 podcast/ay, Premium: sınırsız

---

## 🤖 Claude API Entegrasyonu — Prompt Şablonları

### 1. Metin Düzenleme Prompt'u
```
Sen bir akademik metin düzenleme uzmanısın. Sana bir öğrencinin ders notlarından
çıkarılmış ham OCR metni verilecek.

Görevin:
1. OCR hatalarını düzelt (yanlış karakter tanıma, eksik harfler vs.)
2. Metni anlamlı başlıklar altında düzenle
3. Zaten başlıklara ayrılmışsa, mevcut yapıyı koru ve iyileştir
4. Kısaltmaları açıkla (gerekirse parantez içinde)
5. Madde işaretlerini ve numaralı listeleri düzenle
6. Yazım ve dilbilgisi hatalarını düzelt

KURAL: İçerikten bilgi çıkarma veya ekleme. Sadece düzenle ve yapılandır.
Yanıtını JSON formatında ver:

{
  "title": "Otomatik tespit edilen konu başlığı",
  "subject": "Ders adı (tespit edilebilirse)",
  "sections": [
    { "title": "Bölüm Başlığı", "content": "Düzenlenmiş metin...", "order": 1 }
  ],
  "tags": ["etiket1", "etiket2"]
}
```

### 2. Podcast Script Prompt'u
```
Sen deneyimli bir Türkçe podcast sunucususun. Sana bir öğrencinin ders notları
verilecek. Bu notları dinleyiciye anlatır gibi bir podcast script'ine dönüştür.

Stil: {{style}} 
- educational: Ders anlatır gibi, örneklerle zenginleştir, "Şimdi şuna bakalım..." gibi geçiş cümleleri kullan
- conversational: Arkadaşıyla konuşur gibi, "Biliyor musun..." gibi samimi ifadeler
- summary: Kısa ve öz, "Özetle...", "Dikkat edilmesi gereken..." gibi ifadeler

Kurallar:
1. Doğal konuşma dili kullan, yazı dili değil
2. Giriş bölümü ekle: "Merhaba! Bugün [konu] hakkında konuşacağız..."
3. Bölümler arası geçiş cümleleri ekle
4. Kapanış bölümü ekle: "Bu bölümde [özet]... Bir sonraki bölümde görüşmek üzere!"
5. Anlaşılması zor kavramları basit örneklerle açıkla
6. Uzun cümleleri kısa, konuşmaya uygun cümlelere dönüştür
7. SSML etiketleri KULLANMA, düz metin olarak yaz
8. Noktalama işaretlerini doğal duraklamalar için kullan

Not içeriği:
{{content}}
```

---

## 🛡️ Güvenlik Gereksinimleri

- **Şifreleme:** bcrypt (şifre hash), JWT (token)
- **Rate Limiting:** express-rate-limit (API), özel limitler (upload, TTS)
- **CORS:** Sadece izin verilen origin'ler
- **Helmet:** HTTP güvenlik header'ları
- **File Validation:** Dosya tipi (magic bytes), boyut limiti (10MB görsel, 20MB PDF)
- **SQL Injection:** Prisma ORM (parametrize sorgu)
- **XSS:** Metin çıktılarında sanitize (DOMPurify)
- **CSRF:** SameSite cookie + CSRF token
- **Upload Security:** Dosya adı sanitize, ayrı dizinde saklama

---

## 📦 PART SİSTEMİ — Geliştirme Aşamaları

Her part, bağımsız olarak test edilebilir ve bir öncekinin üzerine inşa edilir.

---

### PART 1: Proje Altyapısı & Geliştirme Ortamı
**Tahmini Süre: 1–2 saat**

**Yapılacaklar:**
- [ ] Monorepo yapısı kur (pnpm workspace + Turborepo)
- [ ] `apps/web`: Next.js 14 projesi oluştur (TypeScript, Tailwind, shadcn/ui)
- [ ] `apps/server`: Express.js + TypeScript projesi oluştur
- [ ] `packages/shared`: Paylaşılan tipler ve şemalar
- [ ] Docker Compose dosyası (PostgreSQL, Redis, MinIO)
- [ ] `.env.example` dosyası (tüm ortam değişkenleri)
- [ ] ESLint + Prettier konfigürasyonu (monorepo seviyesinde)
- [ ] Temel klasör yapısı (yukarıdaki yapıya göre)
- [ ] `turbo.json` script tanımları (dev, build, lint, test)

**Tamamlanma Kriteri:**
`pnpm dev` komutu ile hem frontend hem backend aynı anda çalışmalı. Docker servisleri ayağa kalkmalı.

**Test:**
```bash
pnpm dev           # Her iki uygulama çalışır
docker compose up  # DB, Redis, MinIO çalışır
curl http://localhost:3001/api/health  # { status: "ok" }
```

---

### PART 2: Veritabanı & Prisma Setup
**Tahmini Süre: 1 saat**

**Yapılacaklar:**
- [ ] Prisma schema dosyasını yaz (yukarıdaki şema)
- [ ] Migration oluştur ve çalıştır
- [ ] Seed dosyası yaz (test verileri, varsayılan sesler)
- [ ] Prisma Client singleton instance oluştur
- [ ] Database bağlantı havuzu (connection pool) ayarla
- [ ] Temel CRUD helper'ları yaz

**Tamamlanma Kriteri:**
`npx prisma studio` ile veritabanı görüntülenebilir, seed verileri yüklü.

**Test:**
```bash
npx prisma migrate dev
npx prisma db seed
npx prisma studio  # Tarayıcıda tabloları gör
```

---

### PART 3: Authentication Sistemi
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **Backend:**
  - Passport.js local strategy (email/password)
  - JWT token üretimi (access: 15dk, refresh: 7 gün)
  - Register endpoint (email, password, name)
  - Login endpoint
  - Refresh token endpoint
  - Logout endpoint (token blacklist — Redis)
  - Auth middleware (protect routes)
  - Password hash (bcrypt, salt rounds: 12)
  - Email doğrulama token sistemi
  - Şifre sıfırlama akışı
  - Rate limiting: login 5 deneme/15dk
- [ ] **Frontend:**
  - Login sayfası
  - Register sayfası
  - Forgot password sayfası
  - Auth context/store (Zustand)
  - Protected route wrapper
  - Token otomatik yenileme (axios interceptor)
  - Form validasyonları (Zod + React Hook Form)

**Tamamlanma Kriteri:**
Kullanıcı kayıt olabilir, giriş yapabilir, korunan sayfalara erişebilir.

**Test:**
```bash
# Kayıt
curl -X POST localhost:3001/api/auth/register -d '{"email":"test@test.com","password":"Test1234!","name":"Test User"}'
# Giriş
curl -X POST localhost:3001/api/auth/login -d '{"email":"test@test.com","password":"Test1234!"}'
# Korunan endpoint
curl -H "Authorization: Bearer <token>" localhost:3001/api/auth/me
```

---

### PART 4: Dosya Yükleme Sistemi
**Tahmini Süre: 2 saat**

**Yapılacaklar:**
- [ ] **Backend:**
  - Multer konfigürasyonu (memory storage → S3)
  - MinIO/S3 bağlantısı ve bucket oluşturma
  - Storage service (upload, download, delete, presigned URL)
  - Upload endpoint: `/api/notes/upload`
  - Dosya tipi validasyonu (magic bytes: JPEG, PNG, PDF, TXT, DOCX)
  - Boyut limiti: 10MB (görsel), 20MB (PDF), 1MB (metin)
  - Sharp ile görsel ön işleme (resize, contrast artır, grayscale)
  - Upload progress tracking (tus protokolü veya chunked)
- [ ] **Frontend:**
  - Upload sayfası (react-dropzone)
  - Drag & drop alanı
  - Kamera ile fotoğraf çekme (mobil cihazlar)
  - Upload progress bar
  - Dosya önizleme (görsel thumbnail)
  - Upload tipi seçimi (fotoğraf, PDF, metin yapıştır)
  - Metin doğrudan yapıştırma textarea'sı

**Tamamlanma Kriteri:**
Kullanıcı görsel, PDF veya metin yükleyebilir. Dosyalar S3'te saklanır, veritabanında kayıt oluşur.

**Test:**
- Farklı formatlarda dosya yükle (JPG, PNG, PDF, TXT)
- 10MB üzeri dosya reddedilmeli
- Geçersiz format (exe, zip) reddedilmeli
- Yüklenen dosya S3'ten erişilebilir olmalı

---

### PART 5: OCR Pipeline (Metin Çıkarma)
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **Google Cloud Vision API entegrasyonu:**
  - Service account kurulumu
  - Document text detection (handwriting desteği)
  - Türkçe dil ipucu (language hints: "tr")
  - Sayfa bazlı OCR (PDF çok sayfalı)
  - Confidence score kontrolü
- [ ] **Tesseract.js fallback:**
  - Worker pool (performans)
  - Türkçe eğitilmiş model (tur.traineddata)
  - Basılı metin için kullanım
- [ ] **Görsel ön işleme (Sharp):**
  - Otomatik yönlendirme (EXIF rotation)
  - Kontrast artırma
  - Gürültü azaltma
  - Deskew (eğiklik düzeltme)
  - Grayscale dönüşüm
- [ ] **Bull Queue entegrasyonu:**
  - `note-processing` queue tanımla
  - Job: upload → preprocess → OCR → status update
  - Retry mantığı (3 deneme, exponential backoff)
  - Job progress event'leri
- [ ] **WebSocket (Socket.IO):**
  - İşlem durumu realtime bildirim
  - Progress yüzdesi

**Tamamlanma Kriteri:**
Yüklenen görsel/PDF otomatik olarak kuyruğa girer, OCR işlenir, metin çıkarılır, status güncellenir.

**Test:**
- El yazısı fotoğrafı yükle → metin çıktısı doğru mu?
- Basılı metin PDF → metin çıktısı doğru mu?
- Düşük kalite görsel → ön işleme sonrası iyileşme var mı?
- Çoklu sayfa PDF → tüm sayfalar işleniyor mu?

---

### PART 6: Metin Analizi & Düzenleme (Claude API)
**Tahmini Süre: 2 saat**

**Yapılacaklar:**
- [ ] **Claude API service:**
  - Anthropic SDK entegrasyonu
  - Rate limiting (dakikada max istek)
  - Token sayacı (maliyet takibi)
  - Retry with exponential backoff
  - Timeout handling (60 saniye)
- [ ] **Text Analyzer Processor:**
  - Ham OCR metnini Claude'a gönder (düzenleme prompt'u)
  - JSON yanıtı parse et
  - Sections, tags, subject bilgilerini DB'ye kaydet
  - Hata durumunda fallback (basit regex tabanlı bölme)
- [ ] **Bull Queue genişletme:**
  - OCR sonrası otomatik analiz job'ı tetikle
  - Chain: OCR complete → text analysis → status: READY
- [ ] **Frontend güncellemesi:**
  - Not detay sayfasında düzenlenmiş metin gösterimi
  - Bölümler accordion ile gösterim
  - Manuel düzenleme imkanı (kullanıcı metni düzeltebilir)
  - Etiket gösterimi

**Tamamlanma Kriteri:**
OCR sonrası metin otomatik olarak düzenlenir, başlıklara ayrılır, etiketlenir.

**Test:**
- Dağınık OCR metni → düzenli başlıklı çıktı
- Zaten düzenli metin → yapı korunuyor mu?
- Çok uzun metin (5000+ kelime) → token limiti aşılmıyor mu?
- Claude API hatası → fallback çalışıyor mu?

---

### PART 7: Podcast Script Oluşturma
**Tahmini Süre: 1–2 saat**

**Yapılacaklar:**
- [ ] **Script Generator Processor:**
  - Düzenlenmiş metinden podcast script'i oluştur
  - 3 stil desteği: educational, conversational, summary
  - Script uzunluğu kontrolü (çok kısa ise genişlet, çok uzun ise özetle)
  - Giriş ve kapanış şablonları
  - Bölüm geçiş cümleleri
- [ ] **Script önizleme:**
  - Kullanıcı oluşturulan script'i okuyabilir
  - İsterse düzenleyebilir (textarea)
  - Onayladıktan sonra ses üretimi başlar
- [ ] **Frontend:**
  - Podcast oluşturma formu (not seç, ses seç, stil seç)
  - Script önizleme modal/sayfası
  - Düzenleme modu

**Tamamlanma Kriteri:**
Bir nottan podcast script'i oluşturulabilir, önizlenebilir, düzenlenebilir.

**Test:**
- 3 farklı stilde script oluştur → ton farkı belirgin mi?
- Çok kısa not (100 kelime) → yeterli uzunlukta script mi?
- Çok uzun not (5000+ kelime) → makul uzunlukta script mi?

---

### PART 8: ElevenLabs TTS Entegrasyonu (Ses Üretimi)
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **ElevenLabs Service:**
  - API client (REST, axios)
  - Text-to-Speech endpoint entegrasyonu
  - Multilingual v2 model kullanımı
  - Voice settings: stability, similarity_boost, style
  - Uzun metin bölme stratejisi (cümle sonlarından, max 5000 karakter)
  - Audio chunk'ları sıralı üret
- [ ] **Audio Processing (ffmpeg):**
  - Chunk'ları birleştirme (concat demuxer)
  - Ses normalizasyonu (loudnorm filtresi)
  - Giriş/çıkış jingle ekleme (opsiyonel)
  - Çıktı formatı: MP3 128kbps 44.1kHz
  - Süre hesaplama
- [ ] **Voice Management:**
  - ElevenLabs Voice Library'den Türkçe sesler çekme
  - Ses önizleme dosyaları kaydetme
  - Ses seçim UI'ı (ses kartları, önizleme butonu)
- [ ] **Bull Queue:**
  - `podcast-generation` queue
  - Job chain: script → TTS chunks → merge → upload S3 → status: READY
  - Progress tracking (chunk bazlı)
- [ ] **Maliyet Kontrolü:**
  - Karakter sayacı (kullanıcı bazlı)
  - Kredi sistemi kontrolü (ücretsiz limit)
  - Cache: Aynı script + ses → önceki audio'yu kullan

**Tamamlanma Kriteri:**
Onaylanan script ElevenLabs ile seslendirilir, MP3 olarak kaydedilir, dinlemeye hazırdır.

**Test:**
- Kısa metin (500 karakter) → ses dosyası oluşuyor mu?
- Uzun metin (20000 karakter) → chunk'lama + birleştirme düzgün mü?
- Farklı seslerle üretim → ses değişiyor mu?
- API hatası → retry çalışıyor mu?

---

### PART 9: Audio Player & Podcast Dashboard
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **Custom Audio Player bileşeni:**
  - Wavesurfer.js entegrasyonu (dalga formu gösterimi)
  - Play/Pause/Stop kontrolleri
  - İlerleme çubuğu (seek)
  - Ses seviyesi kontrolü
  - Hız ayarı (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
  - İndirme butonu
  - Mini player (sayfa altında sabit, diğer sayfalarda da aktif)
- [ ] **Podcast Dashboard:**
  - Podcast listesi (kart görünümü)
  - Filtreleme (tarih, ders, durum)
  - Sıralama
  - Arama
  - Durum göstergesi (işleniyor, hazır, hata)
- [ ] **Not Detay Sayfası güncelleme:**
  - Not'a ait podcast listesi
  - "Podcast Oluştur" butonu
- [ ] **Responsive tasarım:**
  - Mobil uyumlu player
  - Mobil dashboard

**Tamamlanma Kriteri:**
Kullanıcı podcast'lerini listeleyebilir, profesyonel bir player ile dinleyebilir, indirebilir.

**Test:**
- Audio dosyası yüklenir ve oynatılır
- Hız değiştirme çalışır
- İndirme çalışır
- Mobilde player düzgün görünür
- Mini player sayfa geçişlerinde çalışmaya devam eder

---

### PART 10: Dashboard, Profil & Polish
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **Ana Dashboard:**
  - Özet kartlar (toplam not, toplam podcast, kalan kredi)
  - Son notlar (timeline)
  - Son podcast'ler
  - Hızlı yükleme butonu
  - Kullanım grafiği (aylık)
- [ ] **Profil & Ayarlar sayfası:**
  - Profil düzenleme (isim, avatar)
  - Şifre değiştirme
  - Varsayılan ses seçimi
  - Varsayılan podcast stili
  - E-posta bildirimleri toggle
- [ ] **Landing Page (Marketing):**
  - Hero section (özellik tanıtımı)
  - Nasıl çalışır (3 adım görseli)
  - Pricing kartları (Free vs Premium)
  - Testimonials
  - CTA butonları
- [ ] **Genel UI İyileştirmeleri:**
  - Loading skeleton'lar
  - Empty state görselleri
  - Toast bildirimleri (sonner)
  - Error boundary'ler
  - 404 sayfası
  - Dark mode desteği
- [ ] **SEO & Performance:**
  - Meta tag'ler
  - Open Graph
  - Lighthouse optimizasyonu
  - Image lazy loading

**Tamamlanma Kriteri:**
Uygulama profesyonel görünüme sahip, tüm sayfalar responsive, UX pürüzsüz.

---

### PART 11: Test, Hata Yönetimi & Deployment Hazırlığı
**Tahmini Süre: 2–3 saat**

**Yapılacaklar:**
- [ ] **Backend testleri (Vitest + Supertest):**
  - Auth endpoint testleri
  - Upload endpoint testleri
  - Not CRUD testleri
  - Podcast CRUD testleri
  - OCR processor unit testleri
  - TTS service mock testleri
- [ ] **Frontend testleri:**
  - Component testleri (Testing Library)
  - Form validation testleri
  - Auth flow testleri
- [ ] **Error Handling iyileştirmeleri:**
  - Global error handler (backend)
  - API error response standardizasyonu
  - Frontend error boundary'ler
  - Sentry entegrasyonu (opsiyonel)
- [ ] **Deployment dosyaları:**
  - Dockerfile (multi-stage build) — frontend & backend
  - docker-compose.production.yml
  - Nginx konfigürasyonu (reverse proxy + SSL)
  - CI/CD pipeline (GitHub Actions)
  - Environment değişkenleri dökümantasyonu
- [ ] **README.md:**
  - Kurulum rehberi
  - Geliştirici dökümantasyonu
  - API dökümantasyonu

**Tamamlanma Kriteri:**
Testler geçiyor, Docker ile production build çalışıyor, deploy edilebilir durumda.

---

## ⚠️ Geliştirme Kuralları (Claude Code İçin)

### Kod Kalitesi
1. **Her zaman TypeScript strict mode** kullan. `any` tipi YASAK.
2. **Her dosya tek bir sorumluluk** taşımalı (SRP).
3. **Fonksiyonlar max 50 satır.** Uzarsa parçala.
4. **Değişken isimleri açıklayıcı** olmalı: `usr` değil `currentUser`.
5. **Yorum satırları Türkçe** yazılabilir ama değişken/fonksiyon isimleri İngilizce.
6. **Her public fonksiyona JSDoc** yaz.
7. **Magic number YASAK.** Constant olarak tanımla.
8. **console.log YASAK.** Pino logger kullan.
9. **Error handling her async fonksiyonda** olmalı. Unhandled promise rejection YASAK.
10. **Import sırası:** built-in → external → internal → relative

### Git & Versiyon
1. **Her PART bir branch:** `part/01-infrastructure`, `part/02-database` ...
2. **Commit mesajları:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:` prefix'leri
3. **Her part sonunda main'e merge** (squash merge)

### API Tasarımı
1. **RESTful** prensipler
2. **Tutarlı response formatı:**
   ```json
   { "success": true, "data": {...}, "meta": { "page": 1, "total": 50 } }
   { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
   ```
3. **HTTP status code'ları doğru kullan** (201, 400, 401, 403, 404, 422, 500)
4. **Pagination:** cursor-based veya offset-based (tercih: cursor)
5. **Rate limiting bilgisi** header'larda dönsün

### Frontend
1. **Server Components** varsayılan, client component sadece interaktivite gerektiğinde
2. **Form state → React Hook Form**, global state → Zustand, server state → React Query
3. **Reusable component** yaz, tekrar YASAK
4. **shadcn/ui bileşenlerini** önce kontrol et, varsa onu kullan
5. **Accessibility** (a11y): aria label'lar, keyboard navigation, focus management
6. **Responsive:** Mobile-first yaklaşım

### Güvenlik
1. **Kullanıcı girdisi ASLA güvenilmez.** Her girdiyi validate et (Zod)
2. **SQL injection:** Prisma ORM kullan, raw query YASAK (zorunlu değilse)
3. **File upload:** Magic bytes kontrolü, boyut limiti, izin verilen tipler
4. **API key'ler .env'de**, kesinlikle koda yazma
5. **CORS whitelist** kullan
6. **Rate limit** her endpoint'e

---

## 🔑 Ortam Değişkenleri (.env)

```env
# ──────── Database ────────
DATABASE_URL=postgresql://notcast:password@localhost:5432/notcast
REDIS_URL=redis://localhost:6379

# ──────── Auth ────────
JWT_SECRET=<rastgele-64-karakter>
JWT_REFRESH_SECRET=<rastgele-64-karakter>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ──────── Storage (MinIO/S3) ────────
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=notcast-uploads
S3_REGION=us-east-1

# ──────── ElevenLabs ────────
ELEVENLABS_API_KEY=<api-key>
ELEVENLABS_DEFAULT_MODEL=eleven_multilingual_v2
ELEVENLABS_MAX_CHUNK_SIZE=5000

# ──────── Claude (Anthropic) ────────
ANTHROPIC_API_KEY=<api-key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=4096

# ──────── Google Cloud Vision ────────
GOOGLE_CLOUD_PROJECT_ID=<project-id>
GOOGLE_APPLICATION_CREDENTIALS=./keys/google-service-account.json

# ──────── App ────────
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# ──────── Email (Opsiyonel) ────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
```

---

## 📊 Üyelik & Kredi Sistemi

| Özellik | Free | Premium (₺99/ay) |
|---------|------|-------------------|
| Not yükleme | Sınırsız | Sınırsız |
| OCR & Metin analizi | Sınırsız | Sınırsız |
| Podcast oluşturma | 3/ay | Sınırsız |
| Ses seçenekleri | 2 ses | Tüm sesler |
| Podcast stili | Sadece educational | 3 stil |
| Hız ayarı | Varsayılan | Tam kontrol |
| Max dosya boyutu | 5MB | 20MB |
| Öncelikli işleme | Hayır | Evet (kuyruk önceliği) |
| Podcast indirme | Hayır | Evet |

---

## 📝 İlerleme Takibi

Her part tamamlandığında aşağıdaki checklist'i güncelle:

- [ ] **PART 1:** Proje Altyapısı & Geliştirme Ortamı
- [ ] **PART 2:** Veritabanı & Prisma Setup
- [ ] **PART 3:** Authentication Sistemi
- [ ] **PART 4:** Dosya Yükleme Sistemi
- [ ] **PART 5:** OCR Pipeline (Metin Çıkarma)
- [ ] **PART 6:** Metin Analizi & Düzenleme (Claude API)
- [ ] **PART 7:** Podcast Script Oluşturma
- [ ] **PART 8:** ElevenLabs TTS Entegrasyonu
- [ ] **PART 9:** Audio Player & Podcast Dashboard
- [ ] **PART 10:** Dashboard, Profil & Polish
- [ ] **PART 11:** Test, Hata Yönetimi & Deployment

---

## 📚 Skills (Yetenekler) Entegrasyonu

Proje kökünde `.claude/skills/` dizini bulunuyorsa, Claude Code bu skill dosyalarını
aktif olarak kullanmalıdır. Skills dizini proje genelinde geçerli olan en iyi
uygulamaları, kod standartlarını ve tekrar kullanılabilir pattern'leri içerir.

### Kurallar:
1. **Her PART'a başlamadan önce** ilgili skill dosyalarını oku ve uygula
2. **Skill'lerde tanımlı pattern'ler** bu dosyadaki talimatlarla çelişirse, **CLAUDE.md önceliklidir**
3. **Yeni skill oluşturma:** Projede tekrar eden bir pattern fark edersen, `.claude/skills/` altına yeni skill dosyası oluşturmayı öner
4. **Skill dizini yoksa** bu bölümü atla ve doğrudan CLAUDE.md talimatlarını uygula

### Yaygın Skill Kullanım Alanları:
- **Frontend skill:** Bileşen yazım standartları, naming convention, test pattern'leri
- **Backend skill:** API endpoint yapısı, error handling, middleware pattern'leri
- **Database skill:** Migration kuralları, seed stratejisi, query optimizasyonu
- **Testing skill:** Test yazım standartları, mock stratejileri, coverage hedefleri
- **DevOps skill:** Docker best practices, CI/CD pipeline kuralları

---

## 🚀 Nasıl Kullanılır (Claude Code ile)

Claude Code'u açtıktan sonra şu adımları izle:

1. `CLAUDE.md` dosyasını proje kök dizinine koy
2. Claude Code'a şu komutu ver:

```
CLAUDE.md dosyasını oku. Proje kökündeki .claude/skills/ dizinindeki 
tüm skill dosyalarını da oku ve geliştirme boyunca bunlara uy. 
PART 1'den başla. Her part'ı tamamladığında dur ve bana bildir. 
Bir sonraki part'a geçmeden önce onayımı bekle.
```

3. Her part sonunda test et
4. Sorun yoksa bir sonraki part'a geç:

```
PART 1 tamam. PART 2'ye geç.
```

5. Sorun varsa:
```
[Hata açıklaması]. Bunu düzelt, sonra devam et.
```

6. Skill eklemek veya güncellemek istersen:
```
Bu pattern'i .claude/skills/ altına skill olarak kaydet.
```

---

*Son güncelleme: Nisan 2026*
*Versiyon: 1.0.0*
