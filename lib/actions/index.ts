"use server";

import { scrapedAmazonProduct } from "../scraper";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {

    const scrapedProduct = await scrapedAmazonProduct(productUrl) {

    }
  } catch (error: any) {
    throw new Error(`Failed to create or update product: ${error.message}`);
  }
}
