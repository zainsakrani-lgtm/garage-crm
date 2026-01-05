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
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("service_date", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Add service
app.post("/services", async (req, res) => {
  const { vehicle_id, description, cost, service_date } = req.body;

  if (!vehicle_id || !description) {
    return res
      .status(400)
      .json({ error: "vehicle_id and description are required" });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([{ vehicle_id, description, cost, service_date }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
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
