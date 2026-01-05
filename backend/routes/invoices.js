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
    .eq("vehicle_id", vehicleId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});


/* ======================
   CREATE invoice (AUTO from unpaid services)
====================== */
router.post("/", async (req, res) => {
  const { vehicle_id } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ error: "vehicle_id is required" });
  }

  try {
    // 1️⃣ Fetch unpaid services
    const { data: services, error: serviceError } = await supabase
      .from("services")
      .select("id, cost")
      .eq("vehicle_id", vehicle_id)
      .eq("status", "unpaid");

    if (serviceError) throw serviceError;

    if (!services || services.length === 0) {
      return res.status(400).json({
        error: "No unpaid services to invoice",
      });
    }

    // 2️⃣ Calculate total
    const totalAmount = services.reduce(
      (sum, s) => sum + Number(s.cost),
      0
    );

    // 3️⃣ Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([
        {
          vehicle_id,
          total_amount: totalAmount,
          status: "unpaid",
          invoice_date: new Date(),
        },
      ])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 4️⃣ Mark services as PAID
    const serviceIds = services.map((s) => s.id);

    await supabase
      .from("services")
      .update({ status: "paid" })
      .in("id", serviceIds);

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});



/* ======================
   Fetch ONLY unpaid services
====================== */

async function getUnpaidServices(vehicleId) {
  const { data, error } = await supabase
    .from("services")
    .select("id, cost")
    .eq("vehicle_id", vehicleId)
    .eq("status", "unpaid");

  if (error) throw error;

  return data;
}


export default router;
