import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabase } from "./supabaseClient.js";
import invoiceRoutes from "./routes/invoices.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


/* --------------------
   SEARCH FIELD
-------------------- */

app.get("/search", async (req, res) => {
  const term = req.query.q?.toLowerCase();
  if (!term) return res.json({});

  // Search customers
  const { data: customers } = await supabase
    .from("customers")
    .select("*");

  const customer = customers?.find(
    (c) =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
  );

  if (customer) {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", customer.id);

    return res.json({ customer, vehicles });
  }

  // Search by plate
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .ilike("plate_number", `%${term}%`)
    .single();

  if (vehicle) {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", vehicle.customer_id)
      .single();

    return res.json({ customer, vehicles: [vehicle] });
  }

  res.json({});
});



/* --------------------
   BASIC TEST ROUTE
-------------------- */
app.get("/", (req, res) => {
  res.send("Garage CRM Backend is running 🚗");
});

/* --------------------
   CUSTOMERS
-------------------- */

// Get all customers
app.get("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Add customer
app.post("/customers", async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert([{ name, phone, email }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

/* --------------------
   VEHICLES
-------------------- */

// Get vehicles for a customer
app.get("/vehicles/:customerId", async (req, res) => {
  const { customerId } = req.params;

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Add vehicle
app.post("/vehicles", async (req, res) => {
  const { customer_id, brand, model, plate_number, year } = req.body;

  if (!customer_id) {
    return res.status(400).json({ error: "customer_id is required" });
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert([{ customer_id, brand, model, plate_number, year }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

/* --------------------
   SERVICES
-------------------- */

// Get services for a vehicle
app.get("/services/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;

  const { data, error } = await supabase
    .from("services")
    .select("id, issue, service, cost, status, created_at")
    .eq("vehicle_id", vehicleId)
    .order("service_date", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Add service
app.post("/services", async (req, res) => {
  const {
    vehicle_id,
    issue,
    service,
    description,
    cost,
    service_date,
    status
  } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ error: "vehicle_id is required" });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        vehicle_id,
        issue: issue || description || "",
        service: service || "",
        description: description || "",
        cost,
        service_date,
        status: status || "unpaid",
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

app.put("/services/:id", async (req, res) => {
  const { id } = req.params;
  const { issue, service, cost } = req.body;

  const { data, error } = await supabase
    .from("services")
    .update({ issue, service, cost })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});



/* --------------------
   INVOICES ROUTES
-------------------- */
app.use("/invoices", invoiceRoutes);

/* --------------------
   START SERVER
-------------------- */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
