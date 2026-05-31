# Analisis Kebocoran Data

Aplikasi OSINT (Open Source Intelligence) untuk menganalisis dan mendeteksi kebocoran data.

## Deskripsi

Aplikasi ini berfungsi sebagai admin tools untuk mendeteksi kebocoran data menggunakan beberapa metode OSINT. Aplikasi ini menyediakan berbagai layanan untuk:
- Dorking (pencarian data sensitif di internet)
- GraphQL API service
- Web Scraping dengan Puppeteer
- gRPC service dengan Python
- AI Analysis (analisis data menggunakan kecerdasan buatan)

## AI Analysis

Aplikasi ini dilengkapi dengan fitur AI Analysis untuk:
- Analisis pola kebocoran data
- Deteksi data sensitif yang terekspos
- Klasifikasi tingkat risiko kebocoran
- Rekomendasi tindakan mitigasi
- Generate laporan analisis otomatis

## Tech Stack

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **GraphQL** - API query language
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Puppeteer** - Web scraping
- **gRPC** - Python gRPC service

### Dependencies
- axios - HTTP client
- bcrypt - Password hashing
- cors - CORS middleware
- dotenv - Environment variables
- graphql - GraphQL core
- graphql-http - GraphQL HTTP server
- graphql-request - GraphQL client
- helmet - Security headers
- morgan - HTTP logging
- serpapi - Search engine API
- openai - AI integration (GPT models)

### Dev Dependencies
- playwright - Browser automation

## Cara Penggunaan

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- MongoDB

### Installation

```bash
# Install dependencies Node.js
npm install

# Install dependencies Python (untuk gRPC service)
cd SERVICES/python_grpc
python -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Menjalankan Aplikasi

#### 1. GraphQL Express Service
```bash
npm run dev
# atau
node SERVICES/graphql_express_service/index.js
```

#### 2. Python gRPC Server
```bash
cd SERVICES/python_grpc/server
python app.py
```

#### 3. Python gRPC Client
```bash
cd SERVICES/python_grpc/client
python app.py
```

#### 4. Web Scraping
```bash
node SERVICES/scrapping/puppeteer.js
```

#### 5. Dorking
```bash
node SERVICES/dorking/index.js
```

#### 6. AI Analysis
```bash
# Via GraphQL API
mutation {
  analyzeData(input: {
    data: "data yang akan dianalisis"
    type: "email|phone|address"
  }) {
    result
    riskLevel
    recommendations
  }
}
```

### Environment Variables

Buat file `.env` di root directory:

```env
MONGODB_URI=mongodb://localhost:27017/keamanan_ai
PORT=3000
SERPAPI_KEY=your_serpapi_key
```

## Struktur Folder

```
├── SERVICES/
│   ├── dorking/          # OSINT dorking tools
│   ├── graphql_express_service/  # GraphQL API
│   ├── python_grpc/     # gRPC service
│   └── scrapping/       # Web scraping
├── SHELL/               # Shell scripts
└── .github/workflows/   # CI/CD workflows
```

## Lisensi

ISC