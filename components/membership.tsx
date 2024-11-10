"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Shop = {
  id: number;
  name: string;
};

const Membership = () => {
  const supabase = createClientComponentClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number>();

  useEffect(() => {
    const getShops = async () => {
      const { data, error } = await supabase.from("shops").select("id, name");

      if (error) {
        console.error(error);
      }
      setShops(data);
    };
    getShops();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const shopId = formData.get("shop");

    const insertData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error: selectError } = await supabase
        .from("membership_requests")
        .select()
        .eq("user_id", user.id)
        .eq("shop_id", selectedShop)
        .single();

      if (data == null) {
        const { error: memError } = await supabase
          .from("membership_requests")
          .insert([{ user_id: user.id, shop_id: selectedShop }]);
      }
    };
    insertData();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="organization">Organization</Label>
        <Select required onValueChange={(val) => setSelectedShop(Number(val))}>
          <SelectTrigger id="organization">
            <SelectValue placeholder="Select a college..." />
          </SelectTrigger>
          <SelectContent>
            {shops &&
              shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id.toString()}>
                  {shop.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Request
      </Button>
    </form>
  );
};

export default Membership;
