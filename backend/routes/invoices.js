import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/* ======================
   GET invoices for vehicle
====================== */
// GET invoices for a vehicle
router.get("/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // ✅ ALWAYS return an array
  res.json(data || []);
});


/* ======================
   CREATE invoice
====================== */
router.post("/", async (req, res) => {
  const { vehicle_id, total } = req.body;

  if (!vehicle_id || !total) {
    return res.status(400).json({ error: "vehicle_id and total are required" });
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert([{ vehicle_id, total, paid: false }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data[0]);
});

/* ======================
   MARK new invoice as UNPAID
====================== */
router.post("/", async (req, res) => {
  const { vehicle_id, total } = req.body;

  const { data, error } = await supabase
    .from("invoices")
    .insert([
      {
        vehicle_id,
        total,
        status: "unpaid"
      }
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data[0]);
});


/* ======================
   MARK invoice as PAID
====================== */
router.put("/:id/pay", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", id)
    .select();

  if (error) {
    console.error("❌ Supabase error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

export default router;
