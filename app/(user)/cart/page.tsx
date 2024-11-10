"use client";

import Image from "next/image";
import useClientGetData from "./useClientGetData";
import { useEffect, useRef, useState } from "react";
import { deleteCartOrder, handleOrderSubmit, updateCart } from "./functions";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MdDelete } from "react-icons/md";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Cart = () => {
  const [cartOrders, setCartOrders] = useClientGetData(
    "cart_orders",
    `
        id,
        user_id,
        quantity,
        variant_id,
        variants(sizes(id, name, original_price, membership_price)),
        merchandises(id, name, online_payment, physical_payment, receiving_information, variants(id, name, picture_url, original_price, membership_price)),
        shops!inner(id, acronym),
        size_id`,
    { con: { key: "user_id" } },
  );
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState<{
    [key: string]: string;
  }>({});
  const [paymentReceipts, setPaymentReceipts] = useState<{
    [key: string]: File;
  }>({});

  const handleVariantChange = (orderId, variantId) => {
    setCartOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id == orderId
          ? {
              ...order,
              variant_id: variantId,
            }
          : order,
      ),
    );
  };

  const handleSizeChange = (id, value: number) => {
    setCartOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id == id ? { ...order, size_id: value } : order,
      ),
    );
  };

  const handleQuantityChange = (id, value: number) => {
    setCartOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id == id ? { ...order, quantity: value } : order,
      ),
    );
  };

  const deleteOrder = (id: any) => {
    setCartOrders((prevOrders) => prevOrders.filter((order) => order.id != id));
  };

  function getVariant(order, id) {
    return order.merchandises.variants.find((variant) => variant.id == id);
  }

  function getSize(order, variant_id, size_id) {
    return order.variants.sizes.find((size) => size.id == size_id);
  }

  function deleteO(id) {
    deleteCartOrder(id);
    deleteOrder(id);
  }

  // Handle checkbox changes
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const orderId = event.target.value;
    setSelectedOrders((prev) => {
      if (event.target.checked) {
        return [...prev, orderId];
      } else {
        return prev.filter((id) => id != orderId);
      }
    });
  };

  // Get all form values
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formRef.current) return;

    // Get selected orders
    const formData = new FormData(formRef.current);
    const selectedOrderIds = formData.getAll("orders");
    const selectedOrdersDetails = cartOrders.filter((order) =>
      selectedOrderIds.includes(order.id.toString()),
    );

    setSelectedOrders(selectedOrdersDetails);
    setOpenConfirmation(!openConfirmation);
  };

  const handlePaymentOptionChange = (orderId: string, option: string) => {
    setPaymentOptions((prev) => ({
      ...prev,
      [orderId]: option,
    }));
  };

  const handlePaymentReceiptChange = (orderId: string, file: File) => {
    setPaymentReceipts((prev) => ({
      ...prev,
      [orderId]: file,
    }));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-2xl font-bold text-emerald-800">
        My Shopping Cart
      </div>
      <form
        id="myForm"
        ref={formRef}
        className="flex w-1/2 flex-col gap-2"
        onSubmit={handleSubmit}
      >
        {cartOrders ? (
          cartOrders.map((order) => (
            <label className="rounded-lg" key={order.id}>
              <Card className="flex items-center justify-center p-3">
                <div className="p-5">
                  <input
                    type="checkbox"
                    name="orders"
                    value={order.id}
                    onChange={handleCheckboxChange}
                    checked={selectedOrders.includes(order.id.toString())}
                  />
                </div>

                <div className="flex flex-1 gap-2">
                  <Image
                    src={getVariant(order, order.variant_id).picture_url}
                    alt={""}
                    width={50}
                    height={50}
                    className="h-28 w-28"
                  />
                  <div className="flex flex-1 items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {order.merchandises.name}
                      </p>
                      <div className="text-sm">{order.shops.acronym}</div>
                      <div className="text-lg font-semibold text-emerald-800">
                        $
                        {order.size_id != null
                          ? getSize(order, order.variant_id, order.size_id)
                              ?.original_price * order.quantity
                          : getVariant(order, order.variant_id).original_price *
                            order.quantity}
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <div>
                        <Label htmlFor="variant">Variant</Label>
                        <Select
                          value={order.variant_id}
                          onValueChange={(val) => {
                            handleVariantChange(order.id, parseInt(val));
                            updateCart(order);
                          }}
                          required
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {order.merchandises.variants.map((variant) => (
                              <SelectItem value={variant.id} key={variant.id}>
                                {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {order.size_id != null && (
                        <div>
                          <Label htmlFor="sizes">Size</Label>
                          <Select
                            value={order.size_id}
                            onValueChange={(val) => {
                              handleSizeChange(order.id, parseInt(val));
                              updateCart(order);
                            }}
                            required
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {order.variants.sizes?.map((size) => (
                                <SelectItem key={size.id} value={size.id}>
                                  {size.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid w-[100px] items-center gap-1.5">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={order.quantity}
                          onChange={(e) => {
                            handleQuantityChange(
                              order.id,
                              parseInt(e.target.value),
                            );
                            updateCart(order);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      onClick={() => {
                        deleteO(order.id);
                      }}
                      variant="destructive"
                      size="icon"
                    >
                      <MdDelete color="white" />
                    </Button>
                  </div>
                </div>
              </Card>
            </label>
          ))
        ) : (
          <div>No Cart orders yet. Get to ordering pus!</div>
        )}

        {/* Add submit button if you want to process all selected orders */}

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              disabled={selectedOrders.length == 0}
              onClick={() => {
                setOpenConfirmation(!openConfirmation);
              }}
            >
              Process Selected Orders
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm purchase</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-5">
              {selectedOrders &&
                selectedOrders.map((o) => {
                  const order = cartOrders.find((or) => or.id == o);
                  return (
                    <div key={order.id} className="flex gap-5">
                      <div>
                        <Image
                          src={getVariant(order, order.variant_id).picture_url}
                          alt={""}
                          width={100}
                          height={100}
                        />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {order.merchandises.name}
                        </div>
                        <div>
                          <span className="font-semibold">Variant: </span>
                          {getVariant(order, order.variant_id).name}
                        </div>
                        <div>
                          <span className="font-semibold">Quantity:</span>
                          {order.quantity}
                        </div>
                        <div>
                          <span className="font-semibold">Price: </span>P
                          {order.size_id != null
                            ? getSize(order, order.variant_id, order.size_id)
                                ?.original_price * order.quantity
                            : getVariant(order, order.variant_id)
                                .original_price * order.quantity}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">
                          Receiving information:{" "}
                        </span>
                        {order.merchandises.receiving_information}
                      </div>
                      <form className="space-y-2">
                        {order.merchandises.physical_payment && (
                          <label className="block">
                            <input
                              type="radio"
                              name={`payment-${order.id}`}
                              value="irl"
                              checked={paymentOptions[order.id] == "irl"}
                              onChange={() =>
                                handlePaymentOptionChange(order.id, "irl")
                              }
                            />
                            <span className="ml-2">In-Person Payment</span>
                          </label>
                        )}
                        {order.merchandises.online_payment && (
                          <label className="block">
                            <input
                              type="radio"
                              name={`payment-${order.id}`}
                              value="online"
                              checked={paymentOptions[order.id] == "online"}
                              onChange={() =>
                                handlePaymentOptionChange(order.id, "online")
                              }
                            />
                            <span className="ml-2">Online Payment</span>
                          </label>
                        )}
                        {paymentOptions[order.id] == "online" && (
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePaymentReceiptChange(order.id, file);
                                }
                              }}
                              required
                            />
                            {paymentReceipts[order.id] && (
                              <div className="mt-2">
                                <h4>Image Preview:</h4>
                                <Image
                                  src={URL.createObjectURL(
                                    paymentReceipts[order.id],
                                  )}
                                  alt="Selected"
                                  width={50}
                                  height={50}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <Button
                          onClick={() =>
                            selectedOrders.map((order) => {
                              handleOrderSubmit(
                                order,
                                paymentOptions[order.id],
                                setOpenConfirmation,
                                paymentReceipts[order.id]
                                  ? paymentReceipts[order.id]
                                  : null,
                              );
                              deleteO(order.id);
                            })
                          }
                        >
                          Submit
                        </Button>
                      </form>
                    </div>
                  );
                })}
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
};

export default Cart;
