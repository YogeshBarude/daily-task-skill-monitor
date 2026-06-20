import { NextRequest, NextResponse } from "next/server";
import { fetchMarketPrice } from "@/lib/market-data/marketDataService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fetchMarketPrice({
      investmentType: String(body.investmentType || ""),
      tickerSymbol: String(body.tickerSymbol || ""),
      marketExchange: String(body.marketExchange || "")
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, source: "Server", status: "Update Failed", message: "Could not process price update request." }, { status: 400 });
  }
}
