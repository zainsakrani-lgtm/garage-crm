import express from "express";
import { supabase } from "../supabaseClient.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

/* ======================
   Create PDF Endpoint
====================== */
import PDFDocument from "pdfkit";

router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;

  // 1. Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(`
      *,
      vehicles (
        plate_number,
        brand,
        model,
        customers (
          name,
          phone,
          email
        )
      )
    `)
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  // 1.5 Get services for this vehicle
const { data: services, error: servicesError } = await supabase
  .from("services")
  .select("description, cost, service_date")
  .eq("vehicle_id", invoice.vehicle_id);

if (servicesError) {
  return res.status(500).json({ error: servicesError.message });
}


  // 2. Create PDF
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=invoice-${id}.pdf`);

  doc.pipe(res);

  // 3. LOGO (replace with your logo URL)
  //doc.image("https://YOUR_LOGO_URL_HERE", 50, 40, { width: 120 });
  /*doc.image(path.join(__dirname, "C:\Software\Autocity\garage-crm\backend\assets\autocitylogo.jpg"), 50, 40, {
  width: 120,
});*/


  doc.moveDown(2);

  // 4. HEADER
  doc
    .fontSize(20)
    .text("INVOICE", { align: "right" })
    .moveDown();

  doc
    .fontSize(10)
    .text(`Invoice ID: ${invoice.id}`, { align: "right" })
    .text(`Date: ${invoice.invoice_date}`, { align: "right" });

  doc.moveDown(2);

  // 5. BILL TO
  doc.fontSize(12).text("BILL TO");
  doc
    .fontSize(10)
    .text(invoice.vehicles.customers.name)
    .text(invoice.vehicles.customers.phone || "")
    .text(invoice.vehicles.customers.email || "");

  doc.moveDown();

  // 6. VEHICLE INFO
  doc.text(
    `Vehicle: ${invoice.vehicles.brand} ${invoice.vehicles.model} (${invoice.vehicles.plate_number})`
  );

  doc.moveDown(2);

  // 7. SERVICES / LINE ITEMS
doc.fontSize(12).text("Services");

doc.moveDown(0.5);

services.forEach((s, index) => {
  doc
    .fontSize(10)
    .text(
      `${index + 1}. ${s.description} — $${Number(s.cost || 0)}`,
      { indent: 20 }
    );
});


  // 7.1 Calculate Total from Services

  const totalFromServices = services.reduce(
  (sum, s) => sum + (Number(s.cost) || 0),
  0
);

// 7.2 TOTAL
  doc.moveDown(2);
doc.fontSize(14).text(`TOTAL: $${totalFromServices}`, {
  align: "right",
});


  // 8. PAID STAMP
  if (invoice.status === "paid") {
    doc
      .fontSize(50)
      .fillColor("green")
      .opacity(0.3)
      .text("PAID", 200, 400, { rotate: -30 });
    doc.opacity(1).fillColor("black");
  }

  // 9. FOOTER
  doc.moveDown(4);
  doc.fontSize(9).text("Thank you for your business!");

  doc.end();
});


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
/*router.post("/", async (req, res) => {
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
});*/

router.post("/", async (req, res) => {
  const { vehicle_id } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ error: "vehicle_id is required" });
  }

  // 1. Get UNPAID services
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .eq("vehicle_id", vehicle_id)
    .eq("status", "unpaid");

  if (servicesError) {
    return res.status(500).json({ error: servicesError.message });
  }

  if (!services.length) {
    return res.status(400).json({ error: "No unpaid services found" });
  }

  // 2. Calculate total
  const total = services.reduce(
    (sum, s) => sum + (Number(s.cost) || 0),
    0
  );

  // 3. Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([
      {
        vehicle_id,
        total_amount: total,
        status: "unpaid",
      },
    ])
    .select()
    .single();

  if (invoiceError) {
    return res.status(500).json({ error: invoiceError.message });
  }

  // 4. ✅ STEP 5 — MARK SERVICES AS INVOICED
  await supabase
    .from("services")
    .update({ status: "invoiced" })
    .eq("vehicle_id", vehicle_id)
    .eq("status", "unpaid");

  // 5. Return invoice
  res.status(201).json(invoice);
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
