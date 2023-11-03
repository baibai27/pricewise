"use client";
import { FormEvent, useState } from "react";

const isValidAmazonProductUrl = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    // check if the url is from amazon
    if (
      hostname.includes("amazon.com") ||
      hostname.includes("amazon.") ||
      hostname.includes("amazon")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValidLink = isValidAmazonProductUrl(searchPrompt);
    if (!isValidLink) return alert("Please provide a valid Amazon link");

    try {
      setIsLoading(true);

      // scrape the product page
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      action=""
      className="flex flex-wrap gap-4 mt-12"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        className="searchbar-input"
        placeholder="Enter product link"
      />
      <button
        className="searchbar-btn"
        type="submit"
        disabled={searchPrompt === ""}
      >
        {isLoading ? "Searching" : "Search"}
      </button>
    </form>
  );
};

export default Searchbar;
