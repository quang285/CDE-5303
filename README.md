# Singapore Legal Triage App

This application is a legal triage tool for Singapore jurisdiction, powered by Gemini AI.

## Deployment to GitHub & Netlify

This project is configured for easy deployment to GitHub and Netlify.

### 1. Push to GitHub
1. Create a new repository on GitHub.
2. Initialize your local directory as a git repository (if not already).
3. Add the GitHub repository as a remote.
4. Push your code to the `main` branch.

### 2. Deploy to Netlify
1. Log in to [Netlify](https://www.netlify.com/).
2. Click **"Add new site"** > **"Import from an existing project"**.
3. Select your GitHub repository.
4. Netlify should automatically detect the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Click **"Deploy site"**.

### 3. Configure Environment Variables
1. In the Netlify dashboard, go to **Site configuration** > **Environment variables**.
2. Add a new variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Google Gemini API Key.
3. Trigger a new deploy for the changes to take effect.

## Local Development
1. Install dependencies: `npm install`
2. Create a `.env` file with your `GEMINI_API_KEY`.
3. Start the dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000).
