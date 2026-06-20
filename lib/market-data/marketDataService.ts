export type PriceRequest = {
  investmentType: string;
  tickerSymbol: string;
  marketExchange?: string;
};

export type PriceResult = {
  ok: boolean;
  price?: number;
  source: string;
  status: "Updated" | "Update Failed" | "Manual Update Required" | "API Not Configured" | "Market Closed / Price Not Available";
  message: string;
};

export async function fetchMarketPrice(request: PriceRequest): Promise<PriceResult> {
  if (!request.tickerSymbol) {
    return { ok: false, source: "Manual", status: "Manual Update Required", message: "Ticker, scheme code, or asset code is required." };
  }

  if (["Stocks", "ETF", "Gold ETF"].includes(request.investmentType)) {
    return fetchYahooPrice(request.tickerSymbol, request.marketExchange);
  }
  if (request.investmentType === "Mutual Fund") {
    return fetchMutualFundNav(request.tickerSymbol);
  }
  if (request.investmentType === "Crypto") {
    return fetchCryptoPrice(request.tickerSymbol);
  }
  if (["Gold", "Digital Gold"].includes(request.investmentType)) {
    return fetchGoldPrice();
  }

  return { ok: false, source: "Manual", status: "Manual Update Required", message: "This investment type is best updated manually." };
}

async function fetchYahooPrice(ticker: string, exchange?: string): Promise<PriceResult> {
  const symbol = exchange?.toUpperCase() === "NSE" && !ticker.includes(".") ? `${ticker}.NS` : ticker;
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("Yahoo Finance did not return a price.");
    const json = await response.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!price) return { ok: false, source: "Yahoo Finance", status: "Market Closed / Price Not Available", message: "No latest market price was available." };
    return { ok: true, price: Number(price), source: "Yahoo Finance", status: "Updated", message: "Latest listed price fetched." };
  } catch (error) {
    return { ok: false, source: "Yahoo Finance", status: "Update Failed", message: error instanceof Error ? error.message : "Price fetch failed." };
  }
}

async function fetchMutualFundNav(schemeCode: string): Promise<PriceResult> {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("MF API did not return NAV.");
    const json = await response.json();
    const nav = json?.data?.[0]?.nav;
    if (!nav) return { ok: false, source: "MFAPI India", status: "Market Closed / Price Not Available", message: "No NAV was available for this scheme code." };
    return { ok: true, price: Number(nav), source: "MFAPI India", status: "Updated", message: "Latest NAV fetched." };
  } catch (error) {
    return { ok: false, source: "MFAPI India", status: "Update Failed", message: error instanceof Error ? error.message : "NAV fetch failed." };
  }
}

async function fetchCryptoPrice(assetCode: string): Promise<PriceResult> {
  try {
    const id = assetCode.toLowerCase();
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=inr`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("Crypto API did not return a price.");
    const json = await response.json();
    const price = json?.[id]?.inr;
    if (!price) return { ok: false, source: "CoinGecko", status: "Market Closed / Price Not Available", message: "No INR crypto price was available for this asset code." };
    return { ok: true, price: Number(price), source: "CoinGecko", status: "Updated", message: "Latest INR crypto price fetched." };
  } catch (error) {
    return { ok: false, source: "CoinGecko", status: "Update Failed", message: error instanceof Error ? error.message : "Crypto price fetch failed." };
  }
}

async function fetchGoldPrice(): Promise<PriceResult> {
  if (!process.env.GOLD_PRICE_API_KEY && !process.env.MARKET_DATA_API_KEY) {
    return { ok: false, source: "Gold price provider", status: "API Not Configured", message: "Add GOLD_PRICE_API_KEY or MARKET_DATA_API_KEY to enable gold price tracking." };
  }
  return { ok: false, source: "Gold price provider", status: "API Not Configured", message: "Gold provider adapter is ready for an API key-backed endpoint." };
}
