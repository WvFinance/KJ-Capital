# KJ Capital

A client dashboard: your portfolio, stock research and news briefs. Investing, simplified.

Live site: https://wvfinance.github.io/KJ-Capital/

## What's on the site

- **Your Portfolio:** every stock you own, what you paid, what it's worth now, and how it compares with putting the same money in the S&P 500.
- **Search:** look up any stock with TradingView's live chart, quote, key financials and latest headlines, plus an instant brief from Claude.
- **News:** Claude's Bullish/Neutral/Bearish briefs for the S&P 500, the Nasdaq and every stock in the portfolio, with links to the sources.

## Locked data

The repo is public, so the data files are locked with the site password. Only these are committed:

| File | What it holds |
| --- | --- |
| `data/lock.json` | Settings for unlocking (no password inside) |
| `data/portfolio.enc.json` | The holdings |
| `data/prices.enc.json` | Daily closing prices, updated automatically |
| `data/news.enc.json` | Claude's news briefs |

The password screen unlocks them in the browser. To edit the data locally:

```
KJ_PASSWORD=... node scripts/lock.mjs unlock   # writes data/portfolio.json, prices.json, news.json (gitignored)
# edit the plain files
KJ_PASSWORD=... node scripts/lock.mjs lock
```

To change the password: unlock with the old one, run `setup` and then `lock` with the new one, and update the `KJ_PASSWORD` secret under Settings > Secrets and variables > Actions. The price and news robots need that secret.

## A holding in `data/portfolio.json`

```json
{
  "ticker": "NVDA",
  "symbol": "NASDAQ:NVDA",
  "name": "Nvidia Corp.",
  "sector": "Tech",
  "entryDate": "2026-11-05",
  "entryPrice": 217.09,
  "invested": 1000,
  "shares": 4.6064,
  "spyEntryPrice": 681.50
}
```

`sector` powers the sector pie chart. `spyEntryPrice` is the S&P 500 fund's (SPY) price on the same day, so the site can compare the stock with the market.

For information only, not financial advice.
