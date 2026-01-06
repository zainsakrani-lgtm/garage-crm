import express from "express";
import { supabase } from "../supabaseClient.js";
import PDFDocument from "pdfkit";

const router = express.Router();

/* ======================
   CREATE PDF FOR INVOICE
====================== */
router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Fetch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_date,
      total_amount,
      status,
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

  // 2️⃣ Fetch services linked to THIS invoice (Option A)
  const {
    data: invoiceServices,
    error: invoiceServicesError,
  } = await supabase
    .from("invoice_services")
    .select(`
      services (
        description,
        cost
      )
    `)
    .eq("invoice_id", id);

  if (invoiceServicesError) {
    return res.status(500).json({ error: invoiceServicesError.message });
  }

  // 3️⃣ Create PDF
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=invoice-${id}.pdf`);

  doc.pipe(res);

  // 4️⃣ HEADER
  doc
    .fontSize(20)
    .text("INVOICE", { align: "right" })
    .moveDown();

  doc
    .fontSize(10)
    .text(`Invoice ID: ${invoice.id}`, { align: "right" })
    .text(`Date: ${invoice.invoice_date}`, { align: "right" });

  doc.moveDown(2);

  // 5️⃣ BILL TO
  doc.fontSize(12).text("BILL TO");
  doc
    .fontSize(10)
    .text(invoice.vehicles.customers.name)
    .text(invoice.vehicles.customers.phone || "")
    .text(invoice.vehicles.customers.email || "");

  doc.moveDown();

  // 6️⃣ VEHICLE INFO
  doc.text(
    `Vehicle: ${invoice.vehicles.brand} ${invoice.vehicles.model} (${invoice.vehicles.plate_number})`
  );

  doc.moveDown(2);

  // 7️⃣ SERVICES (ONLY linked to this invoice)
  doc.fontSize(12).text("Services");
  doc.moveDown(0.5);

  invoiceServices.forEach((row, index) => {
    const service = row.services;
    doc
      .fontSize(10)
      .text(
        `${index + 1}. ${service.description} — $${service.cost}`,
        { indent: 20 }
      );
  });

  doc.moveDown(2);

  // 8️⃣ TOTAL (DO NOT recalculate)
  doc.fontSize(14).text(
    `TOTAL: $${invoice.total_amount}`,
    { align: "right" }
  );

  // 9️⃣ PAID STAMP
  if (invoice.status === "paid") {
    doc
      .fontSize(50)
      .fillColor("green")
      .opacity(0.3)
      .text("PAID", 200, 400, { rotate: -30 });
    doc.opacity(1).fillColor("black");
  }

  // 🔚 FOOTER
  doc.moveDown(4);
  doc.fontSize(9).text("Thank you for your business!");

  doc.end();
});

/* ======================
   GET invoices for vehicle
====================== */
router.get("/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("invoice_date", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

/* ======================
   CREATE INVOICE (Option A)
====================== */
router.post("/", async (req, res) => {
  const { vehicle_id, service_ids } = req.body;

  if (!vehicle_id || !Array.isArray(service_ids) || service_ids.length === 0) {
    return res.status(400).json({
      error: "vehicle_id and service_ids[] are required",
    });
  }

  // 1️⃣ Fetch selected services
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, cost")
    .in("id", service_ids);

  if (servicesError) {
    return res.status(500).json({ error: servicesError.message });
  }

  // 2️⃣ Calculate total ONCE
  const total_amount = services.reduce(
    (sum, s) => sum + Number(s.cost || 0),
    0
  );

  // 3️⃣ Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([
      {
        vehicle_id,
        total_amount,
        status: "unpaid",
        invoice_date: new Date(),
      },
    ])
    .select()
    .single();

  if (invoiceError) {
    return res.status(500).json({ error: invoiceError.message });
  }

  // 4️⃣ Link services to invoice
  const links = service_ids.map((service_id) => ({
    invoice_id: invoice.id,
    service_id,
  }));

  const { error: linkError } = await supabase
    .from("invoice_services")
    .insert(links);

  if (linkError) {
    return res.status(500).json({ error: linkError.message });
  }

  // 5️⃣ Mark services as invoiced
  await supabase
    .from("services")
    .update({ status: "invoiced" })
    .in("id", service_ids);

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
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
