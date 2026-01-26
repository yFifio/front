import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  productId: string;
  quantity: number;
}

interface CreateOrderRequest {
  items: OrderItem[];
  customerEmail: string;
  customerName: string;
  customerId?: string | null;
  deliveryAddress?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json()) as CreateOrderRequest;
    const { items, customerEmail, customerName, customerId, deliveryAddress } = body;

    console.log("Creating order with items:", JSON.stringify(items));

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Items are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerEmail || typeof customerEmail !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Valid customer name is required (min 2 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = customerEmail.trim().toLowerCase().slice(0, 255);
    const sanitizedName = customerName.trim().slice(0, 100);

    // Validate and sanitize items
    const productIds = items.map(item => item.productId);
    const validatedItems: { productId: string; quantity: number }[] = [];

    for (const item of items) {
      // Validate productId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.productId)) {
        return new Response(
          JSON.stringify({ error: `Invalid product ID: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate quantity is a positive integer within limits
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return new Response(
          JSON.stringify({ error: `Invalid quantity for product ${item.productId}. Must be between 1 and 99.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      validatedItems.push({ productId: item.productId, quantity });
    }

    // Fetch products from database to get actual prices
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, is_active, category, discount_percent")
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return new Response(
        JSON.stringify({ error: "Failed to validate products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!products || products.length !== productIds.length) {
      return new Response(
        JSON.stringify({ error: "One or more products not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all products are active
    const inactiveProducts = products.filter(p => !p.is_active);
    if (inactiveProducts.length > 0) {
      return new Response(
        JSON.stringify({ error: "One or more products are no longer available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order has physical products and validate delivery address
    const hasPhysicalProducts = products.some(p => p.category === "physical");
    if (hasPhysicalProducts && deliveryAddress) {
      const { address, city, state, zip, phone } = deliveryAddress;
      if (!address || !city || !state || !zip || !phone) {
        return new Response(
          JSON.stringify({ error: "Complete delivery address required for physical products" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build product map for easy lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculate total price server-side using database prices
    let totalPrice = 0;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      price_at_purchase: number;
      quantity: number;
    }> = [];

    for (const item of validatedItems) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      // Calculate price with discount if applicable
      let finalPrice = product.price;
      if (product.discount_percent && product.discount_percent > 0) {
        finalPrice = product.price * (1 - product.discount_percent / 100);
      }

      const itemTotal = finalPrice * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        price_at_purchase: finalPrice,
        quantity: item.quantity,
      });
    }

    console.log("Calculated total price:", totalPrice);

    // Create the order
    const orderData: Record<string, unknown> = {
      customer_id: customerId || null,
      customer_email: sanitizedEmail,
      customer_name: sanitizedName,
      total_price: totalPrice,
      status: "pending",
    };

    // Add delivery address if provided
    if (deliveryAddress) {
      orderData.delivery_address = deliveryAddress.address?.trim().slice(0, 255) || null;
      orderData.delivery_city = deliveryAddress.city?.trim().slice(0, 100) || null;
      orderData.delivery_state = deliveryAddress.state?.trim().slice(0, 50) || null;
      orderData.delivery_zip = deliveryAddress.zip?.trim().slice(0, 20) || null;
      orderData.delivery_phone = deliveryAddress.phone?.trim().slice(0, 20) || null;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order items with verified prices
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Rollback order if items failed
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created successfully:", order.id);

    // Return order details for payment creation
    return new Response(
      JSON.stringify({
        orderId: order.id,
        totalPrice: totalPrice,
        items: orderItems.map(item => ({
          title: item.product_name,
          quantity: item.quantity,
          unit_price: item.price_at_purchase,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-order:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
