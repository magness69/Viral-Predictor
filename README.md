# Will your post go viral?

Predict whether a post lands in the top third of engagement, from its platform and format. Includes a web interface.

## Data work

Six CSV files were collected and audited before modeling:

| file | rows | what a row is | used |
|---|---|---|---|
| social_media_engagement1 | 100 | post | yes (main data) |
| sentimentdataset | 732 | post | yes, low weight |
| Cleaned_Viral_Social_Media_Trends | 5,000 | post | tested, rejected |
| Viral_Social_Media_Trends | 5,000 | same posts, no date | duplicate, dropped |
| Social_Media_Engagement | 10,016 | account | analysed separately |
| social-media | 63 | user | analysed separately |

Findings:
- The two "viral" files are the same posts. Account and user files can't be merged into a post table (different units).
- Sources have different scales, so "viral" is defined as the top third inside each source.
- The 5,000-post file has AUC about 0.50 with any feature set: its labels act like random noise. Adding it drops the AUC on real posts from 0.73 to 0.59.
- Final model: logistic regression on platform + format, trained on the 100 posts plus the tweets at weight 0.1. Held-out AUC 0.74, accuracy 69% (baseline 66%).
- Limits: small real data, no creator features (followers, length, hashtags). It compares ideas; it is not a verdict.

## Structure

- `notebooks/engagement_model.ipynb`: loading, cleaning, merging, audit, training, export.
- `public/`: the website (HTML, CSS, JS). The model is `public/model.js`.
- `data/raw/`: put the CSV files here (not pushed to GitHub, see `.gitignore`). Sources: Kaggle datasets with the file names above.

## Run the site locally

```
python3 -m http.server 8000 --directory public
```

Open http://localhost:8000

## Retrain

```
pip install -r requirements.txt
cd notebooks && jupyter notebook
```

Run all cells. It rewrites `public/model.js`.

## Deploy

Push to GitHub, then import the repo on Vercel (Framework: Other, no build command, output directory `public`, already set in `vercel.json`). Every push redeploys.

## Security and privacy

- No backend, database, API key, cookies or analytics. Everything runs in the browser.
- Links are only parsed as text, never opened. Videos are read locally and never uploaded.
- Strict Content Security Policy and other headers in `vercel.json`.
- Raw data, notebooks and README are excluded from deployment (`.vercelignore`) and raw data is excluded from Git.
- Text is inserted with `textContent`, never `innerHTML`.
