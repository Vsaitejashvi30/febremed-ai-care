# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c9f26453-fc97-48aa-bb15-98a835383126

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c9f26453-fc97-48aa-bb15-98a835383126) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Prescription OCR Feature

The FebreMed assessment flow now supports extracting medication details from a prescription image.

### Backend setup

1. Install system-level Tesseract OCR:
	- Windows: download from https://github.com/UB-Mannheim/tesseract/wiki and install (note the installation path if you need to set `TESSERACT_CMD`).
	- macOS: `brew install tesseract`
	- Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
2. Create and activate a virtual environment inside `backend/`:
	```pwsh
	cd backend
	python -m venv venv
	venv\Scripts\activate
	```
3. Install Python dependencies:
	```pwsh
	pip install -r requirements.txt
	```
4. Set the necessary environment variables (see `.env` for placeholders) and start the Flask server:
	```pwsh
	$env:FLASK_ENV="development"
	$env:GEMINI_API_KEY="your_gemini_api_key"
	python app.py
	```

### Frontend setup

Keep the existing Vite development workflow:

```pwsh
npm install
npm run dev
```

Requests to `/api/*` are proxied to the Flask server during development.

### Environment variables

Populate the following entries in `.env`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GEMINI_API_KEY` (exposed to the frontend for future Gemini usage)
- `GEMINI_API_KEY` (used by the Flask backend)
- Optional: `GEMINI_MODEL` (defaults to `models/gemini-flash-latest`, which offers higher free-tier quota than the pro model; override in `.env` if you have access to a higher-tier model)
- `FLASK_ENV` / `FLASK_APP`
- Optional: `TESSERACT_CMD` if Tesseract is not in `PATH`.

### Database migration

Run the Supabase migration to create the `prescription_uploads` table after pulling the latest changes:

```pwsh
supabase migration up
```

### Feature flow

1. Upload a prescription image in the assessment form.
2. The backend extracts text with Tesseract and sends it to Google Gemini for interpretation.
3. The frontend auto-populates medication fields and shows the extracted details.
4. Submitting the assessment stores both the standard assessment data and the derived prescription details (`prescription_uploads` table).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c9f26453-fc97-48aa-bb15-98a835383126) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
