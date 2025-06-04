const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const results = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.table tbody tr'));
      return rows.map(row => {
        const tds = row.querySelectorAll('td');
        const link = row.querySelector('a')?.getAttribute('href');
        const fullLink = link ? `https://www.bongthom.com/${link}` : null;
        return {
          title: tds[0]?.innerText.trim(),
          client: tds[0]?.innerText.split('\n')[1]?.trim(),
          deadline: tds[2]?.innerText.trim(),
          posted: tds[3]?.innerText.trim(),
          link: fullLink,
        };
      });
    });

    await browser.close();
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scraper API live on port ${PORT}`));
