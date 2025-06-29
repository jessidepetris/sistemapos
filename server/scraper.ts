import { load } from 'cheerio';

export interface ScrapedProduct {
  supplierCode: string;
  packCost: number;
}

export async function scrapePrices(
  url: string,
  productSelector: string,
  codeSelector: string,
  priceSelector: string
): Promise<ScrapedProduct[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const html = await res.text();
  const $ = load(html);
  const products: ScrapedProduct[] = [];
  $(productSelector).each((_, el) => {
    const code = $(el).find(codeSelector).text().trim();
    let priceText = $(el).find(priceSelector).text().trim();
    priceText = priceText.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const price = parseFloat(priceText);
    if (code && !isNaN(price)) {
      products.push({ supplierCode: code, packCost: price });
    }
  });
  return products;
}
