"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function updateCart(cartOrder) {
  const supabase = createClientComponentClient();
  const { data, error: databaseError } = await supabase
    .from("cart_orders")
    .update([
      {
        quantity: cartOrder.quantity,
        variant_id: cartOrder.variant_id,
        shop_id: cartOrder.shops.id,
        size_id: cartOrder.size_id,
      },
    ])
    .eq("id", cartOrder.id)
    .select();
  if (databaseError) {
    console.error(databaseError);
    return;
  }
}

export async function deleteCartOrder(orderId) {
  const supabase = createClientComponentClient();
  const { error } = await supabase
    .from("cart_orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    console.error(error);
    return;
  }
}

export function handleOrderSubmit(
  order,
  paymentOption,
  setOpenConfirmation,
  paymentReceipt?,
) {
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
          quantity: order.quantity,
          online_payment: paymentOption == "online",
          physical_payment: paymentOption == "irl",
          variant_id: order.variant_id,
          merch_id: order.merchandises.id,
          shop_id: order.shops.id,
          size_id: order.size_id,
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

    setOpenConfirmation(false);
  };
  insert();
}
