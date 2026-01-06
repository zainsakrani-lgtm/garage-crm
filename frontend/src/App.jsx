import { useEffect, useState } from "react";

const API = "https://garage-crm-backend.onrender.com";

function App() {

// Selected for invoice
  const [selectedForInvoice, setSelectedForInvoice] = useState([]);


  // Job Service State
  const [showJobCard, setShowJobCard] = useState(false);
  const [jobServices, setJobServices] = useState([
  { description: "", cost: "" },
]);


  // SEARCH OPTION
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState("");


  // CREATE SEARCH HANDLER
  const handleSearch = (e) => {
  e.preventDefault();

  if (!searchTerm.trim()) return;

  const term = searchTerm.toLowerCase();

  // Find customer by name or phone
  const customerMatch = customers.find(
    (c) =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
  );

  if (customerMatch) {
    setSelectedCustomer(customerMatch);
    setSelectedVehicle(null);
    fetchVehicles(customerMatch.id);
    setSearchError("");
    return;
  }

  // Find by vehicle plate
  const vehicleMatch = vehicles.find((v) =>
    v.plate_number?.toLowerCase().includes(term)
  );

  if (vehicleMatch) {
    setSelectedVehicle(vehicleMatch);
    fetchServices(vehicleMatch.id);
    fetchInvoices(vehicleMatch.id);
    setSearchError("");
    return;
  }

  setSearchError("No customer or vehicle found");
};


  // STATE for INVOICES
  /* invoices → list of invoices from backend
  invoiceTotal → input value from form*/
  const [invoices, setInvoices] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState("");

  // CURRENT JOB
  const [currentJob, setCurrentJob] = useState(null);

  // DATA STATE
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // VEHICLE FORM STATE
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [year, setYear] = useState("");

  // SERVICE FORM STATE
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState("");

  // FETCH FUNCTIONS
  const fetchCustomers = async () => {
    const res = await fetch(`${API}/customers`);
    const data = await res.json();
    setCustomers(data);
  };

  const fetchVehicles = async (customerId) => {
    const res = await fetch(`${API}/vehicles/${customerId}`);
    const data = await res.json();
    setVehicles(data);
    setServices([]);
  };

const fetchServices = async (vehicleId) => {
  const res = await fetch(`${API}/services/${vehicleId}`);
  const data = await res.json();

  setServices(data);

  // 🧾 Restore Job Card from unpaid services
  const unpaid = data.filter((s) => s.status === "unpaid");

  if (unpaid.length > 0) {
    setCurrentJob({
      vehicle: selectedVehicle,
      services: unpaid,
      date: new Date().toISOString(),
    });
  } else {
    setCurrentJob(null);
  }
};


  // FETCH INVOICES FROM BACKEND
  /* MODIFIED ON 050126
  const fetchInvoices = async (vehicleId) => {
  const res = await fetch(`${API}/invoices/${vehicleId}`);
  const data = await res.json();
  setInvoices(data);}; */

  const fetchInvoices = async (vehicleId) => {
  try {
    const res = await fetch(`${API}/invoices/${vehicleId}`);

    if (!res.ok) {
      setInvoices([]); // ✅ fallback
      return;
    }

    const data = await res.json();

    // ✅ Ensure array
    setInvoices(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Invoice fetch failed", err);
    setInvoices([]);
  }
};


  // ADD VEHICLE
  const addVehicle = async (e) => {
    e.preventDefault();

    await fetch(`${API}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomer.id,
        brand,
        model,
        plate_number: plate,
        year
      })
    });

    setBrand("");
    setModel("");
    setPlate("");
    setYear("");
    fetchVehicles(selectedCustomer.id);
  };

// ADD JOB CARD
async function saveJobCard() {
  const savedServices = [];

  for (const s of jobServices) {
    if (!s.description || !s.cost) continue;

    const res = await fetch(`${API}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: selectedVehicle.id,
        description: s.description,
        cost: s.cost,
        status: "unpaid",
      }),
    });

    const saved = await res.json();
    savedServices.push(saved);
  }

  /*setCurrentJob({
    vehicle: selectedVehicle,
    services: savedServices,
    date: new Date().toISOString(),
  });*/

  setShowJobCard(false);
  setJobServices([{ description: "", cost: "" }]);
  fetchServices(selectedVehicle.id);
}

// SAVE EDITS TO DB
async function updateService(service) {
  await fetch(`${API}/services/${service.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: service.description,
      cost: service.cost,
    }),
  });
}


  // ADD SERVICE
  const addService = async (e) => {
    e.preventDefault();

    await fetch(`${API}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: selectedVehicle.id,
        description,
        cost,
        service_date: serviceDate
      })
    });

    setDescription("");
    setCost("");
    setServiceDate("");
    fetchServices(selectedVehicle.id);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

return (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🚗 Garage CRM</h1>

      
      
      {/* SEARCH BAR */}
<form
  onSubmit={handleSearch}
  className="flex justify-center mb-8"
>
  <input
    type="text"
    placeholder="Search by name, phone, or vehicle plate..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full max-w-2xl border p-3 rounded text-lg"
  />
</form>

{searchError && (
  <p className="text-center text-red-600 mb-4">
    {searchError}
  </p>
)}


{/* VEHICLES */}
{selectedCustomer && (
  <div className="mb-6">
    <h2 className="text-xl font-semibold mb-2">
      Vehicles of {selectedCustomer.name}
    </h2>

    <form onSubmit={addVehicle} className="grid grid-cols-2 gap-2 mb-4">
      <input
        className="border p-2 rounded"
        placeholder="Brand"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="Model"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="Plate"
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <button className="col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Add Vehicle
      </button>
    </form>

    <ul className="space-y-1">
      {vehicles.map((v) => (
        <li
          key={v.id}
          className={`rounded ${
            selectedVehicle?.id === v.id
              ? "bg-green-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <button
            type="button"
            className="w-full text-left p-2"
            onClick={async () => {
              setSelectedVehicle(v);
              await Promise.all([
                fetchServices(v.id),
                fetchInvoices(v.id),
              ]);
            }}
          >
            {v.brand} {v.model} ({v.plate_number})
          </button>
        </li>
      ))}
    </ul>

    {/* OPEN JOB CARD (only when vehicle selected) */}
    {selectedVehicle && (
      <button
        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        onClick={() => setShowJobCard(true)}
      >
        ➕ Open Job Card
      </button>
    )}
  </div>
)}


      {/* SERVICES + INVOICES */}
{selectedVehicle && (
  <div className="space-y-6">

    {/* ======================
        SERVICE HISTORY
    ====================== */}
    {showJobCard && (
  <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl p-6 z-50">
    <h2 className="text-xl font-bold mb-4">Job Card</h2>

    <p><strong>Client:</strong> {selectedCustomer.name}</p>
    <p><strong>Vehicle:</strong> {selectedVehicle.brand} {selectedVehicle.model}</p>
    <p><strong>Plate:</strong> {selectedVehicle.plate_number}</p>

    <hr className="my-4" />

    {jobServices.map((s, index) => (
      <div key={index} className="flex gap-2 mb-2">
        <input
          className="border p-2 flex-1"
          placeholder="Service description"
          value={s.description}
          onChange={(e) => {
            const copy = [...jobServices];
            copy[index].description = e.target.value;
            setJobServices(copy);
          }}
        />
        <input
          type="number"
          className="border p-2 w-24"
          placeholder="$"
          value={s.cost}
          onChange={(e) => {
            const copy = [...jobServices];
            copy[index].cost = e.target.value;
            setJobServices(copy);
          }}
        />
      </div>
    ))}

    <button
      className="text-blue-600 mt-2"
      onClick={() =>
        setJobServices([...jobServices, { description: "", cost: "" }])
      }
    >
      ➕ Add service line
    </button>

    <div className="mt-6 flex gap-2">
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={saveJobCard}
      >
        Save Job Card
      </button>

      <button
        className="bg-gray-300 px-4 py-2 rounded"
        onClick={() => setShowJobCard(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

{/* Job card summary - yellow box */}

{currentJob && (
  <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-4">
    <h3 className="font-semibold mb-2">🧾 Current Job Card</h3>

    <p className="text-sm text-gray-600 mb-2">
      {selectedCustomer.name} — {selectedVehicle.brand} {selectedVehicle.model}
    </p>

    <ul className="space-y-2">
      {currentJob.services.map((s) => (
        <li key={s.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedForInvoice.includes(s.id)}
            onChange={() => {
              setSelectedForInvoice((prev) =>
                prev.includes(s.id)
                  ? prev.filter((id) => id !== s.id)
                  : [...prev, s.id]
              );
            }}
          />

          <input
  className="border p-1 flex-1 rounded"
  value={s.description}
  onChange={(e) => {
    const updated = currentJob.services.map((item) =>
      item.id === s.id
        ? { ...item, description: e.target.value }
        : item
    );
    setCurrentJob({ ...currentJob, services: updated });
  }}
  onBlur={() => updateService(s)}
/>


          <input
  type="number"
  className="border p-1 w-24 rounded"
  value={s.cost}
  onChange={(e) => {
    const updated = currentJob.services.map((item) =>
      item.id === s.id
        ? { ...item, cost: e.target.value }
        : item
    );
    setCurrentJob({ ...currentJob, services: updated });
  }}
  onBlur={() => updateService(s)}
/>

        </li>
      ))}
    </ul>
  </div>
)}


    {/* ======================
        INVOICES
    ====================== */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Invoices</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();

          await fetch(`${API}/invoices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicle_id: selectedVehicle.id,
              total: invoiceTotal,
            }),
          });

          setInvoiceTotal("");
          fetchInvoices(selectedVehicle.id);
        }}
        className="flex gap-2 mb-4"
      >
        
        <button className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
          Generate Invoice
        </button>
      </form>

      <ul className="space-y-1">
  {Array.isArray(invoices) && invoices.map((inv) => (
    <li
      key={inv.id}
      className={`p-2 rounded flex justify-between items-center ${
        inv.status === "paid" ? "bg-green-100" : "bg-red-100"
      }`}
    >
      <span>
        🧾 Invoice — 💲{inv.total_amount ?? 0}
      </span>

      <div className="flex items-center gap-3">
        {/* PDF ICON — SAFE, READ-ONLY */}
        <a
          href={`${API}/invoices/${inv.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open invoice PDF"
          className="text-blue-600 hover:text-blue-800"
        >
          📄
        </a>

        {inv.status === "paid" ? (
          <span className="font-semibold text-green-700">
            PAID ✅
          </span>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await fetch(`${API}/invoices/${inv.id}/pay`, {
                method: "PUT",
              });

              fetchInvoices(selectedVehicle.id);
            }}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Mark as Paid
          </button>
        )}
      </div>
    </li>
  ))}
</ul>



    </div>

  </div>
)}

    </div>
  </div>
);

}

export default App;



