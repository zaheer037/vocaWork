# Vocawork

Vocawork is a voice-powered job search platform that allows users to find jobs using their voice in multiple Indian languages. It consists of a Next.js frontend and a Flask backend powered by Gemini AI for advanced speech processing.

## Features

- Voice-based job search in multiple Indian languages
- Modern UI built with Next.js, Tailwind CSS, and shadcn/ui components
- Admin panel for managing job listings
- Gemini AI integration for speech-to-text and intent extraction (with fallback if API key is missing)
- Mock job database for demonstration

## Project Structure

- `app/` - Next.js frontend application
- `components/` - Reusable React components
- `vocawork-backend/` - Flask backend with Gemini AI integration
- `styles/` - Global CSS and Tailwind configuration

## Installation

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.8+
- [pnpm](https://pnpm.io/) (or npm/yarn)
- (Optional) [Google Gemini API Key](https://ai.google.dev/)

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/vocawork.git
cd vocawork
```

### 2. Setup the Backend

```sh
cd vocawork-backend
# Copy the example environment file and fill in your API keys
cp .env.example .env
# (Optional) Edit .env to add your Gemini API key
# Install Python dependencies
python -m pip install -r requirements.txt
# Start the backend server
python run_backend.py
```

The backend will start on `http://0.0.0.0:5000` by default.

### 3. Setup the Frontend

```sh
cd ..
pnpm install
pnpm dev
```

The frontend will start on `http://localhost:3000`.

## Usage

- Visit `http://localhost:3000` to use the job search interface.
- Use the microphone button to search for jobs by voice.
- Access the admin panel at `/admin` to manage job listings.

## Environment Variables

See [`vocawork-backend/.env.example`](vocawork-backend/.env.example) for all backend configuration options.

## License

MIT

---

**Note:** This project uses a mock job database and mock audio responses for demonstration. For production use, integrate with real job data sources and a production-grade TTS service.