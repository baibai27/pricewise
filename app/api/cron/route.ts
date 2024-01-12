import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapedAmazonProduct } from "@/lib/scraper";
import {
  getAveragePrice,
  getHighestPrice,
  getLowestPrice,
  getEmailNotifType,
} from "@/lib/utils";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    connectToDB();
    const products = await Product.find({});
    if (!products) {
      throw new Error("No products found");
    }
    // 1. scrape latest product details and update db
    const updateProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapedAmazonProduct(currentProduct.url);
        if (!scrapedProduct) {
          throw new Error("Error in GET : Failed to scrape product");
        }
        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];
        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };
        const updatedProduct = await Product.findOneAndUpdate(
          { url: scrapedProduct.url },
          product
        );

        // 2. check status of each product and send email accordingly
        const emailNotifType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );
        if (emailNotifType && updatedProduct.users.length > 0) {
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
          };
          const emailContent = await generateEmailBody(
            productInfo,
            emailNotifType
          );
          const userEmails = updatedProduct.users.map(
            (user: any) => user.email
          );

          await sendEmail(emailContent, userEmails);
        }
        return updatedProduct;
      })
    );
    return NextResponse.json({ message: "success", data: updateProducts });
  } catch (error) {
    throw new Error("Error in GET : Failed to connect to MongoDB");
  }
}
