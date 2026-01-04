import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Get invoices by vehicle
router.get("/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("invoice_date", { ascending: false });

  if (error) return res.status(400).json(error);
  res.json(data);
});

// Create invoice
router.post("/", async (req, res) => {
  const { vehicle_id, total_amount } = req.body;

  const { data, error } = await supabase
    .from("invoices")
    .insert([{ vehicle_id, total_amount }])
    .select();

  if (error) return res.status(400).json(error);
  res.json(data[0]);
});

// Mark invoice paid
router.put("/:id/pay", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", id)
    .select();

  if (error) return res.status(400).json(error);
  res.json(data[0]);
});

export default router;
