"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { signOut } from "./actions";
import placeholder from "@/assets/placeholder.webp";
import { Bell, ShoppingCart, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "./ui/button";

type Category = {
  id: number;
  name: string;
  picture: string;
};

type Shop = {
  id: number;
  acronym: string;
};

const Header = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    const getCategories = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase.from("categories").select();
      setCategories(data);
    };
    getCategories();
  }, []);

  useEffect(() => {
    const getShops = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("shops")
        .select("id, acronym");
      setShops(data);
    };
    getShops();
  }, []);

  useEffect(() => {
    const getAuth = async () => {
      const supabase = createClientComponentClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error) {
        setUser(user);
      }
    };
    getAuth();
  }, []);

  const handleSignOut = async () => {
    const error = await signOut();
    if (!error) {
      setUser(null);
    }
    router.push("/");
  };

  const logInGoogle = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClientComponentClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== "") {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("query", query);
      router.push(`/search?${queryParams.toString()}`);
    }
  };

  const redirectCategory = (category: Category) => {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("category", category.id.toString());
    router.push(`/search?${queryParams.toString()}`);
  };

  return (
    <header className="sticky top-0 flex h-16 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-28">
      <div>
        <Link href={"/"} className="font-bold text-emerald-800">
          The Kabsu Shop
        </Link>
      </div>
      <nav className="flex gap-4">
        <ul className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1" asChild>
              <Button variant="ghost">
                <p>Categories</p>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories?.map((category) => (
                <DropdownMenuItem
                  onClick={() => redirectCategory(category)}
                  key={category.id}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1" asChild>
              <Button variant="ghost">
                <p>Shops</p>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {shops?.map((shop) => (
                <DropdownMenuItem key={shop.id}>
                  {shop.acronym}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="link">
            <Link href={"/about"}>About</Link>
          </Button>
          <Button variant="link">
            <Link href={"/contact"}>Contact</Link>
          </Button>
        </ul>
        <form className="relative" onSubmit={handleSubmit}>
          <button className="absolute left-2 top-2.5" type="submit">
            <Search size={16} />
          </button>
          <Input
            type="search"
            placeholder="Search for a product..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="flex">
          <Link href={"/notification"}>
            <Button variant="ghost" size="icon">
              <Bell />
            </Button>
          </Link>
          <Link href={"/cart"}>
            <Button variant="ghost" size="icon">
              <ShoppingCart />
            </Button>
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link href={"/user"}>Go to profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={logInGoogle}>
              <User />
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};
export default Header;
