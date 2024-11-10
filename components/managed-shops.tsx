"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createClientComponentClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

// Define the types for officers and shops
interface Shop {
  id: string;
  name: string;
  logo_url: string;
}

interface Officer {
  shops: Shop;
}

const ManagedShops = () => {
  const supabase = createClientComponentClient();
  const [managedShops, setManagedShops] = useState<Officer[]>();
  useEffect(() => {
    const fetchShops = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: managedShops, error } = await supabase
        .from("officers")
        .select("shops(id, name, acronym, logo_url)")
        .eq("user_id", user.id);
      setManagedShops(managedShops);
    };
    fetchShops();
  }, []);

  return (
    <div className="space-y-3">
      {managedShops &&
        managedShops.map((s) => {
          const shop = s.shops;
          return (
            <Card key={shop.id} className="flex items-center gap-1 p-3">
              <Image
                src={shop.logo_url}
                width={72}
                height={72}
                alt={""}
                className="rounded-full"
              />
              <div className="space-y-1">
                <p className="text-lg font-semibold">{shop.name}</p>
                <Button>
                  <Link href={`/manage/shop/${shop.id}`}>Manage</Link>
                </Button>
              </div>
            </Card>
          );
        })}
    </div>
  );
};

export default ManagedShops;
