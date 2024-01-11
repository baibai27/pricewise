"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import Product from "../models/product.model";
import { scrapedAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    connectToDB();
    const scrapedProduct = await scrapedAmazonProduct(productUrl);
    if (!scrapedProduct) {
      return;
    }

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: product.url });
    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: product.currentPrice },
      ];
      product = {
        ...product,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: product.url },
      product,
      { upsert: true, new: true } // create if it doesn't exist
    );

    revalidatePath(`/product/${newProduct._id}`);
  } catch (error: any) {
    throw new Error(`Failed to create or update product: ${error.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();
    const product = await Product.findOne({ _id: productId });
    if (!productId) return null;
    return product;
  } catch (error: any) {
    throw new Error(`Failed to get product: ${error.message}`);
  }
}

export async function getAllProducts() {
  try {
    connectToDB();
    const products = await Product.find();
    return products;
  } catch (error: any) {
    throw new Error(`Failed to get products: ${error.message}`);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return null;
    }
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      // categories: { $in: currentProduct.categories },
    }).limit(3);
    return similarProducts;
  } catch (error: any) {
    throw new Error(`Failed to get similar products: ${error.message}`);
  }
}

export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    connectToDB();
    const product = await Product.findById(productId);
    if (!product) {
      return null;
    }

    const userExists = product.users.some(
      (user: User) => user.email === userEmail
    );

    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();
      const emailContent = await generateEmailBody(product, "WELCOME");
      await sendEmail(emailContent, [userEmail]);
    }
  } catch (error: any) {
    throw new Error(`Failed to add user email to product: ${error.message}`);
  }
}
