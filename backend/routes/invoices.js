import express from "express";
import { supabase } from "../supabaseClient.js";

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

  // 2. Create PDF
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=invoice-${id}.pdf`);

  doc.pipe(res);

  // 3. LOGO (replace with your logo URL)
  doc.image("https://YOUR_LOGO_URL_HERE", 50, 40, { width: 120 });

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

  // 7. TOTAL
  doc.fontSize(14).text(`TOTAL: $${invoice.total_amount || invoice.total}`, {
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
