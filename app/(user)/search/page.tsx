"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Shop = {
  id: number;
  acronym: string;
};

type Category = {
  id: number;
  name: string;
};

type Merch = {
  id: number;
  name: string;
  created_at: string;
  merchandise_pictures: {
    picture_url: string;
  }[];
  variants: {
    original_price: number;
    membership_price: number;
  }[];
  shops: {
    id: number;
    acronym: string;
  };
  merchandise_categories: {
    id: number;
    cat_id: number;
  }[];
};

const SearchPage = () => {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const categoryParam = searchParams.get("category");
  const shopParam = searchParams.get("shop");
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedShops, setSelectedShops] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [results, setResults] = useState<Merch[]>([]);
  const router = useRouter(); // Initialize useRouter
  const [sort, setSort] = useState("date");

  // Fetch categories
  useEffect(() => {
    const getCategories = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id, name");
      setCategories(data);
    };
    getCategories();
  }, []);

  // Fetch shops
  useEffect(() => {
    const getShops = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, acronym");
      setShops(data);
    };
    getShops();
  }, []);

  // Fetch products matching the query, categories, and shops
  const fetchMerchandises = async (
    query: string | null,
    categories: number[],
    shops: number[],
  ) => {
    let supabaseQuery = supabase.from("merchandises").select(`
            id, 
            name, 
            created_at,
            merchandise_pictures(picture_url), 
            variants(original_price, membership_price), 
            shops!inner(id, name, acronym),
            merchandise_categories(id, cat_id)
        `);

    // Apply name search if a query is provided
    if (query) {
      supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
    }

    const { data, error } = await supabaseQuery;
    let filteredResults;
    if (data == null) {
      filteredResults = [];
    } else {
      filteredResults = data;
    }

    if (categories.length > 0) {
      // Filter the data to only include items that have at least one matching category
      filteredResults = data.filter((item) => {
        return item.merchandise_categories?.some((category) =>
          categories.includes(category.cat_id),
        );
      });
    }

    if (shops.length > 0) {
      // Filter the data to only include items that belong to selected shops
      filteredResults = filteredResults.filter((item) => {
        return shops.includes(item.shops?.id);
      });
    }

    if (sort === "date") {
      filteredResults.sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sort === "ascending") {
      filteredResults.sort((a, b) => {
        const priceA = a.variants[0]?.original_price || 0; // Fallback to 0 if no variants
        const priceB = b.variants[0]?.original_price || 0; // Fallback to 0 if no variants
        return priceA - priceB; // Ascending order
      });
    } else if (sort === "descending") {
      filteredResults.sort((a, b) => {
        const priceA = a.variants[0]?.original_price || 0; // Fallback to 0 if no variants
        const priceB = b.variants[0]?.original_price || 0; // Fallback to 0 if no variants
        return priceB - priceA; // Ascending order
      });
    }
    if (error) {
      console.error(error);
    } else {
      setResults(filteredResults || []);
    }
  };

  // Fetch data when query, selectedCategories, or selectedShops change
  useEffect(() => {
    if (categoryParam) {
      const categoryIds = categoryParam.split(",").map(Number);
      setSelectedCategories(categoryIds); // Set selected categories from URL param
    }

    if (shopParam) {
      const shopIds = shopParam.split(",").map(Number);
      setSelectedShops(shopIds); // Set selected shops from URL param
    }

    fetchMerchandises(query, selectedCategories, selectedShops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryParam, shopParam, sort]); // Listen for changes in query, categoryParam, and shopParam

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    const updatedSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(updatedSelected);

    // Update the URL with the new search parameters
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("category", updatedSelected.join(",")); // Set the 'category' param to the selected IDs
    router.push(`/search?${queryParams.toString()}`); // Update the URL without reloading
  };

  // Handle shop change
  const handleShopChange = (shopId: number) => {
    const updatedSelected = selectedShops.includes(shopId)
      ? selectedShops.filter((id) => id !== shopId)
      : [...selectedShops, shopId];

    setSelectedShops(updatedSelected);

    // Update the URL with the new search parameters
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("shop", updatedSelected.join(",")); // Set the 'shop' param to the selected IDs
    router.push(`/search?${queryParams.toString()}`); // Update the URL without reloading
  };

  return (
    <div className="flex px-28 text-sm">
      <aside className="border-r border-zinc-200 pr-32 pt-4">
        <div className="flex flex-col gap-3">
          <h4 className="text-base font-semibold">Filters</h4>
          <div>
            <p className="pb-2 font-semibold">Categories</p>
            <div className="flex flex-col gap-2 text-sm">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    onClick={() => handleCategoryChange(category.id)}
                    checked={selectedCategories.includes(category.id)}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="pb-2 font-semibold">Shops</p>
            <div className="flex flex-col gap-2 text-sm">
              {shops?.map((shop) => (
                <div key={shop.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`shop-${shop.id}`}
                    onClick={() => handleShopChange(shop.id)}
                    checked={selectedShops.includes(shop.id)}
                  />
                  <label
                    htmlFor={`shop-${shop.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {shop.acronym}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 space-y-2 px-6 py-2">
        <div className="flex items-center gap-4">
          <Select onValueChange={(val) => setSort(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest</SelectItem>
              <SelectItem value="ascending">Price: ascending</SelectItem>
              <SelectItem value="descending">Price: descending</SelectItem>
            </SelectContent>
          </Select>
          {query && (
            <h5 className="text-zinc-500">
              Search Results for:{" "}
              <span className="font-semibold text-zinc-600">{query}</span>
            </h5>
          )}
        </div>
        <div className="">
          {results.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {results.map((merch) => (
                <Link href={`/${merch.id}`} key={merch.id}>
                  <Card className="h-full w-52">
                    <CardContent className="p-5">
                      {merch.merchandise_pictures &&
                      merch.merchandise_pictures.length > 0 ? (
                        <Image
                          alt={merch.name}
                          width={192}
                          height={192}
                          src={merch.merchandise_pictures[0].picture_url}
                          className="h-48 w-48"
                        />
                      ) : (
                        <p>No image available</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div>
                        <p className="font-bold">{merch.name}</p>
                        <p>{merch.shops.acronym}</p>
                        <p className="text-base font-semibold text-emerald-800">
                          ${merch.variants[0].original_price}{" "}
                        </p>
                        <p>
                          Member:{" "}
                          <span className="font-semibold text-emerald-800">
                            ${merch.variants[0].membership_price}
                          </span>
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
