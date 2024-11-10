"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";

type Merch = {
  id: number;
  name: string;
  description: string;
  receiving_information: string;
  online_payment: boolean;
  physical_payment: boolean;
  merchandise_pictures: {
    id: number;
    picture_url: string;
  }[];
  variants: {
    id: number;
    name: string;
    picture_url: string;
    original_price: number;
    membership_price: number;
    sizes: {
      id: number;
      variant_id: number;
      name: string;
      original_price: number;
      membership_price: number;
    }[];
  }[];
  shops: {
    id: number;
    name: string;
    logo_url: string;
  };
  merchandise_categories: {
    id: number;
    cat_id: number;
  }[];
};

const Product = () => {
  const params = useParams();
  const merchId = params.slug;
  const supabase = createClientComponentClient();
  const [merch, setMerch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [paymentOption, setPaymentOption] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File>(null);
  const [cartConfirmation, setCartConfirmation] = useState(false);

  const fetchMerchandise = async () => {
    let { data, error } = await supabase
      .from("merchandises")
      .select(
        `
            id, 
            name, 
            description,
            receiving_information,
            online_payment,
            physical_payment,
            merchandise_pictures(id, picture_url), 
            variants(id, name, picture_url, original_price, membership_price, sizes(id, variant_id, name, original_price, membership_price)), 
            shops!inner(id, name, logo_url),
            merchandise_categories(id, cat_id)
            `,
      )
      .eq("id", merchId)
      .single();
    setMerch(data);
    setSelectedVariant(data.variants[0].id);
    if (data.variants[0].sizes.length != 0) {
      setSelectedSize(data.variants[0].sizes[0].id);
    }

    if (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMerchandise();
  }, []);

  useEffect(() => {
    if (merch != null) {
      setLoading(false);
      setSelectedVariant(merch.variants[0].id);
      if (merch.physical_payment) {
        setPaymentOption("irl");
      } else {
        setPaymentOption("online");
      }
    }
  }, [merch]);

  const handleQuantityChange = (event) => {
    const newQuantity = Math.max(1, Number(event.target.value));
    setQuantity(newQuantity);
  };

  function getVariant() {
    return merch.variants.find((variant) => variant.id == selectedVariant);
  }

  function getSize() {
    return merch.variants
      .find((variant) => variant.id == selectedVariant)
      .sizes.find((size) => size.id == selectedSize);
  }

  function handleOrderSubmit() {
    const insert = async () => {
      if (paymentOption == "online") {
        if (paymentReceipt == null) {
          return;
        }
      }

      const supabase = createClientComponentClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        return;
      }

      const {
        data: { id: status_id },
        error: statusError,
      } = await supabase.from("order_statuses").insert([{}]).select().single();

      if (statusError) {
        console.error(statusError);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            quantity: quantity,
            online_payment: paymentOption == "online",
            physical_payment: paymentOption == "irl",
            variant_id: selectedVariant,
            merch_id: merch.id,
            shop_id: merch.shops.id,
            size_id: selectedSize,
            status_id: status_id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (paymentOption == "online") {
        const url = `payment_${data.id}_${Date.now()}`;
        const { error: storageError } = await supabase.storage
          .from("payment-picture")
          .upload(url, paymentReceipt);

        if (storageError) {
          console.error(storageError);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("payment-picture").getPublicUrl(url);

        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert([{ picture_url: publicUrl, order_id: data.id }]);

        if (paymentError) {
          console.error(paymentError);
          return;
        }
      }

      setOpenConfirmation(!openConfirmation);
    };
    insert();
  }

  function handleCartUpload() {
    const cartUpload = async () => {
      const supabase = createClientComponentClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        return;
      }

      const { data, error } = await supabase
        .from("cart_orders")
        .insert([
          {
            user_id: user.id,
            quantity: quantity,
            variant_id: selectedVariant,
            merch_id: merch.id,
            shop_id: merch.shops.id,
            size_id: selectedSize,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setCartConfirmation(!cartConfirmation);
    };
    cartUpload();
  }

  useEffect(() => {
    if (merch != null) {
      if (getVariant().sizes.length != 0) {
        setSelectedSize(getVariant().sizes[0].id);
      }
    }
  }, [selectedVariant]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <div className="flex flex-col items-center p-5">
        <div className="space-y-4">
          <div className="flex gap-20">
            <div className="space-y-3">
              <Image
                src={merch.merchandise_pictures[0].picture_url}
                width={50}
                height={50}
                alt=""
                className="h-60 w-60"
              />
              <div className="flex items-center justify-between">
                {merch.merchandise_pictures.map((pic) => {
                  return (
                    <Image
                      width={50}
                      height={50}
                      src={pic.picture_url}
                      alt={""}
                      key={pic.id}
                      priority
                      className="h-12 w-12"
                    />
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">{merch.name}</p>
                <div>
                  {getSize() ? (
                    <p className="text-2xl font-semibold text-emerald-800">
                      ${getSize().original_price}/ ${getSize().membership_price}
                    </p>
                  ) : (
                    <p className="text-2xl font-semibold text-emerald-800">
                      ${getVariant().original_price}/ $
                      {getVariant().membership_price}
                    </p>
                  )}
                </div>
              </div>
              <form
                onSubmit={(e: React.FormEvent) => {
                  e.preventDefault();
                }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <div>
                    <Label htmlFor="picture">Variant</Label>
                    <Select
                      value={`${selectedVariant}`}
                      onValueChange={(val) => {
                        setSelectedVariant(val);
                      }}
                      required
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {merch.variants.map((variant) => (
                          <SelectItem key={variant.id} value={`${variant.id}`}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {getVariant().sizes.length !== 0 && (
                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Select
                        value={`${selectedSize}`}
                        onValueChange={(val) => {
                          setSelectedSize(val);
                        }}
                        required
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {getVariant().sizes.map((size) => (
                            <SelectItem key={size.id} value={`${size.id}`}>
                              {size.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid w-[180px] items-center gap-1.5">
                  <Label htmlFor="picture">Quantity</Label>
                  <Input
                    id="picture"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    required
                  />
                </div>
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      handleCartUpload();
                      toast(`${merch.name} Added to cart successfully!`);
                    }}
                    variant="outline"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedSize != null || !getVariant().sizes.length) {
                        setOpenConfirmation(!openConfirmation);
                      }
                    }}
                  >
                    Buy Now
                  </Button>
                </div>
              </form>
              <Card className="flex items-center gap-1 p-3">
                <Image
                  src={merch.shops.logo_url}
                  width={42}
                  height={42}
                  alt={""}
                  className="rounded-full"
                />
                <Link href={`/shop/${merch.shops.id}`}>
                  <p className="font-semibold">{merch.shops.name}</p>
                </Link>
              </Card>
            </div>
          </div>
          <div className="">
            <p className="">{merch.description}</p>
          </div>
        </div>
      </div>

      <Dialog open={openConfirmation} onOpenChange={setOpenConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <Image
                  src={getVariant().picture_url}
                  alt={""}
                  width={100}
                  height={100}
                />
              </div>
              <div className="">
                <p className="font-semibold">{merch.name}</p>
                <p>
                  <span className="font-semibold">Variant: </span>
                  {getVariant().name}
                </p>
                <p>
                  <span className="font-semibold">Quantity: </span> {quantity}
                </p>
                <p>
                  <span className="font-semibold">Price: </span>$
                  {getSize()
                    ? getSize().original_price * quantity
                    : getVariant().original_price * quantity}
                </p>
              </div>
            </div>
            <p>
              <span className="font-semibold">Pick up at:</span>{" "}
              {merch.receiving_information}
            </p>
            <form action="">
              {merch.physical_payment && (
                <label className="block">
                  <input
                    type="radio"
                    value={"irl"}
                    checked={paymentOption === "irl"}
                    onChange={() => setPaymentOption("irl")}
                  />
                  {"In-Person Payment"}
                </label>
              )}
              {/* {merch.online_payment && (
                <label className="block">
                  <input
                    type="radio"
                    value={"online"}
                    checked={paymentOption === "online"}
                    onChange={() => setPaymentOption("online")}
                  />
                  {"Online Payment"}
                </label>
              )} */}
              {paymentOption == "online" && (
                <div className="grid w-full items-center gap-1.5">
                  {/* <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPaymentReceipt(e.target.files?.[0] || null)
                    }
                    required
                  /> */}
                  {/* {paymentReceipt && (
                    <div>
                      <h4>Image Preview:</h4>
                      <Image
                        src={URL.createObjectURL(paymentReceipt)}
                        alt="Selected"
                        width={50}
                        height={50}
                      />
                    </div>
                  )} */}
                  <Label htmlFor="picture" className="font-semibold">
                    GCash Receipt
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    onChange={(e) =>
                      setPaymentReceipt(e.target.files?.[0] || null)
                    }
                    required
                    accept="image/*"
                  />
                </div>
              )}
            </form>
            <Button onClick={handleOrderSubmit}>Confirm</Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* {openConfirmation && (
        <ConfirmationModal
          isOpen={openConfirmation}
          handleClose={() => setOpenConfirmation(!openConfirmation)}
        >
          <div className="flex gap-5">
            <Image
              src={getVariant().picture_url}
              alt={""}
              width={50}
              height={50}
            />
            <div>{merch.name}</div>
            <div>Variant: {getVariant().name}</div>
            <div>Quantity: {quantity}</div>
            <div>
              Price: P
              {selectedSize
                ? getSize().original_price * quantity
                : getVariant().original_price * quantity}
            </div>
          </div>
          <div>{merch.receiving_information}</div>
          <form action="">
            {merch.physical_payment && (
              <label className="block">
                <input
                  type="radio"
                  value={"irl"}
                  checked={paymentOption === "irl"}
                  onChange={() => setPaymentOption("irl")}
                />
                {"In-Person Payment"}
              </label>
            )}
            {merch.online_payment && (
              <label className="block">
                <input
                  type="radio"
                  value={"online"}
                  checked={paymentOption === "online"}
                  onChange={() => setPaymentOption("online")}
                />
                {"Online Payment"}
              </label>
            )}
            {paymentOption == "online" && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPaymentReceipt(e.target.files?.[0] || null)
                  }
                  required
                />
                {paymentReceipt && (
                  <div>
                    <h4>Image Preview:</h4>
                    <Image
                      src={URL.createObjectURL(paymentReceipt)}
                      alt="Selected"
                      width={50}
                      height={50}
                    />
                  </div>
                )}
              </div>
            )}
          </form>
          <button onClick={handleOrderSubmit}>Confirm</button>
        </ConfirmationModal>
      )} */}
      {/* {cartConfirmation && (
        <ConfirmationModal
          isOpen={cartConfirmation}
          handleClose={() => setCartConfirmation(!cartConfirmation)}
        >
          <div>Added to cart successfully!</div>
        </ConfirmationModal>
      )} */}
    </div>
  );
};

export default Product;
