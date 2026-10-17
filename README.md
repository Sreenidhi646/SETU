# SETU frontend (Team TEJAS022)

React + Vite. Voice-first intake, Tamil/English toggle, sample result layout.

## Run
    npm install
    npm run dev      # open the printed localhost URL in Chrome
    npm run build    # production build in dist/

## Notes
- Speech recognition uses the browser Web Speech API (best in Chrome). Typing always works.
- src/api.js is the only place to connect the FastAPI eligibility endpoint. Matching is NOT done in the frontend.
- The scholarship preview is a SAMPLE layout. No real scheme names, amounts, deadlines, links or dates are included.
- Tamil text should be reviewed by a native speaker before the demo.

## Languages
- UI: English and Tamil. To add another, copy a block in src/i18n.js and add it to LANGS (and SPEECH) in src/App.jsx.
- Logo: public/logo.png (replace the file to change it).
