import { useEffect, useState } from "react";
import { Fragment, useState } from "react";

const API = "https://garage-crm-backend.onrender.com";

function App() {


// EDITING CUSTOMER STATE
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);



// Navigation State
  const [activePage, setActivePage] = useState("workspace");


// Add new customer state 

const [showNewClient, setShowNewClient] = useState(false);
const [newClient, setNewClient] = useState({
  name: "",
  phone: "",
  email: "",
  address: "",
});


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
const handleSearch = async (e) => {
  e.preventDefault();

  if (!searchTerm.trim()) return;

  try {
    const res = await fetch(
      `${API}/search?q=${encodeURIComponent(searchTerm)}`
    );

    const data = await res.json();

    if (!data.customer) {
      setSearchError("No customer or vehicle found");
      return;
    }

    setSearchError("");

    setSelectedCustomer(data.customer);
    setSelectedVehicle(data.vehicle || null);

    if (data.customer?.id) {
      fetchVehicles(data.customer.id);
    }

    if (data.vehicle?.id) {
      fetchServices(data.vehicle.id);
      fetchInvoices(data.vehicle.id);
    }
  } catch (err) {
    console.error("Search failed", err);
    setSearchError("Search failed");
  }
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
  try {
    const res = await fetch(`${API}/services/${vehicleId}`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Invalid services response:", data);
      setServices([]);
      setCurrentJob(null);
      return;
    }

    setServices(data);

    if (data.length > 0) {
      setCurrentJob({
        vehicle: selectedVehicle,
        services: data,
        date: data[0]?.created_at || new Date().toISOString(),
      });
    } else {
      setCurrentJob(null);
    }
  } catch (err) {
    console.error("fetchServices failed:", err);
    setServices([]);
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


  // CREATE CUSTOMER
  async function createCustomer() {
  if (!newCustomer.name.trim()) return;

  const isEdit = Boolean(newCustomer.id);

  const res = await fetch(
    `${API}/customers${isEdit ? `/${newCustomer.id}` : ""}`,
    {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    }
  );

  if (res.status === 409) {
    const msg = await res.json();
    alert(msg.error);
    return;
  }

  const saved = await res.json();

  setCustomers((prev) =>
    isEdit
      ? prev.map((c) => (c.id === saved.id ? saved : c))
      : [saved, ...prev]
  );

  setSelectedCustomer(saved);
  setShowCreateCustomer(false);

  setNewCustomer({ name: "", phone: "", email: "", address: "" });
}


// EDIT CUSTOMER

async function updateCustomer(customer) {
  await fetch(`${API}/customers/${customer.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    }),
  });

  // Refresh table
  fetchCustomers();

  // Close inline editor
  setEditingCustomerId(null);
  setEditingCustomer(null);
}


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
      issue: service.issue || service.description || "",
      service: service.service || "",
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

 /* useEffect(() => {
    fetchCustomers();
  }, []);

 useEffect(() => {
  if (selectedVehicle && services.length > 0) {
    setCurrentJob({
      vehicle: selectedVehicle,
      services,
      date: services[0]?.created_at || new Date().toISOString(),
    });
  } else {
    setCurrentJob(null);
  }
}, [services, selectedVehicle]);

*/

{/* START USE EFFECT TO FETCH CUSTOMERS */}
useEffect(() => {
  if (activePage === "customers") {
    fetchCustomers();
  }
}, [activePage]);


  // GENERATE INVOICE FUNCTION

  async function generateInvoice() {
  if (selectedForInvoice.length === 0) {
    alert("Select at least one service to invoice");
    return;
  }

  await fetch(`${API}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: selectedVehicle.id,
      service_ids: selectedForInvoice,
    }),
  });

  setSelectedForInvoice([]);
  fetchServices(selectedVehicle.id);
  fetchInvoices(selectedVehicle.id);
}


return (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🚗 Garage CRM</h1>

{/* START TOP NAV BAR */}
<div className="flex justify-center gap-10 border-b pb-3 mb-6">

  <button
    onClick={() => setActivePage("workspace")}
    className={`flex items-center gap-2 font-semibold transition ${
      activePage === "workspace"
        ? "text-blue-600 border-b-2 border-blue-600 pb-2"
        : "text-gray-500 hover:text-blue-500"
    }`}
  >
    🏠 <span>Workspace</span>
  </button>

  <button
    onClick={() => setActivePage("customers")}
    className={`flex items-center gap-2 font-semibold transition ${
      activePage === "customers"
        ? "text-blue-600 border-b-2 border-blue-600 pb-2"
        : "text-gray-500 hover:text-blue-500"
    }`}
  >
    👥 <span>Customers</span>
  </button>

  <button
    onClick={() => setActivePage("finance")}
    className={`flex items-center gap-2 font-semibold transition ${
      activePage === "finance"
        ? "text-blue-600 border-b-2 border-blue-600 pb-2"
        : "text-gray-500 hover:text-blue-500"
    }`}
  >
    💰 <span>Finance</span>
  </button>

</div>
{/* END TOP NAV BAR */}

{/* START OF THE PAGE CUSTOMER */}
{/* ======================
    CUSTOMERS PAGE
====================== */}
{activePage === "customers" && (
  <div className="mt-6">
    <h2 className="text-2xl font-bold mb-4">👥 Customers</h2>

    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Address</th>
            <th className="p-3 text-left">Created</th>
          </tr>
        </thead>

        <tbody>
  {customers.length === 0 ? (
    <tr>
      <td colSpan="5" className="p-4 text-center text-gray-500">
        No customers found
      </td>
    </tr>
  ) : (
    customers.map((c) => (
      <Fragment key={c.id}>
        {/* MAIN CUSTOMER ROW */}
        <tr
          className="border-t hover:bg-blue-50 cursor-pointer"
          onClick={() => {
            setEditingCustomerId(c.id);
            setEditingCustomer({ ...c });
          }}
        >
          <td className="p-3 font-medium">{c.name}</td>
          <td className="p-3">{c.phone || "-"}</td>
          <td className="p-3">{c.email || "-"}</td>
          <td className="p-3">{c.address || "-"}</td>
          <td className="p-3 text-sm text-gray-500">
            {new Date(c.created_at).toLocaleDateString()}
          </td>
        </tr>

        {/* INLINE EDIT ROW */}
        {editingCustomerId === c.id && (
          <tr>
            <td colSpan={5} className="bg-gray-50 p-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  ✏️ Edit Customer
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="border p-2 rounded"
                    placeholder="Name"
                    value={editingCustomer.name}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    className="border p-2 rounded"
                    placeholder="Phone"
                    value={editingCustomer.phone || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        phone: e.target.value,
                      })
                    }
                  />

                  <input
                    className="border p-2 rounded col-span-2"
                    placeholder="Email"
                    value={editingCustomer.email || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        email: e.target.value,
                      })
                    }
                  />

                  <input
                    className="border p-2 rounded col-span-2"
                    placeholder="Address"
                    value={editingCustomer.address || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => updateCustomer(editingCustomer)}
                  >
                    Save Changes
                  </button>

                  <button
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => {
                      setEditingCustomerId(null);
                      setEditingCustomer(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    ))
  )}
</tbody>



      </table>
      {/* ======================
    START OF EDIT CUSTOMER (SLIDE DOWN)
====================== */}


{editingCustomer && (
  <div className="mt-6 border rounded-lg bg-gray-50 p-4 animate-slideDown">
    <h3 className="text-lg font-semibold mb-4">
      ✏️ Edit Customer
    </h3>

    <div className="grid grid-cols-2 gap-3">
      <input
        className="border p-2 rounded"
        placeholder="Name"
        value={editingCustomer.name}
        onChange={(e) =>
          setEditingCustomer({
            ...editingCustomer,
            name: e.target.value,
          })
        }
      />

      <input
        className="border p-2 rounded"
        placeholder="Phone"
        value={editingCustomer.phone || ""}
        onChange={(e) =>
          setEditingCustomer({
            ...editingCustomer,
            phone: e.target.value,
          })
        }
      />

      <input
        className="border p-2 rounded"
        placeholder="Email"
        value={editingCustomer.email || ""}
        onChange={(e) =>
          setEditingCustomer({
            ...editingCustomer,
            email: e.target.value,
          })
        }
      />

      <input
        className="border p-2 rounded"
        placeholder="Address"
        value={editingCustomer.address || ""}
        onChange={(e) =>
          setEditingCustomer({
            ...editingCustomer,
            address: e.target.value,
          })
        }
      />
    </div>

    <div className="mt-4 flex gap-3">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={async () => {
          const res = await fetch(
            `${API}/customers/${editingCustomer.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
  name: editingCustomer.name,
  phone: editingCustomer.phone,
  email: editingCustomer.email,
  address: editingCustomer.address,
}),

            }
          );

          const updated = await res.json();

          setCustomers((prev) =>
            prev.map((c) =>
              c.id === updated.id ? updated : c
            )
          );

          setEditingCustomer(null);
        }}
      >
        Save Changes
      </button>

      <button
        className="bg-gray-300 px-4 py-2 rounded"
        onClick={() => setEditingCustomer(null)}
      >
        Cancel
      </button>
    </div>
  </div>
)}
  

  {/* END OF EDIT CUSTOMER (SLIDE DOWN) */}

    </div>
  </div>
)}





{/* END OF THE PAGE CUSTOMER */}

{/* STARTING OF THE PAGE WORKSPACE */}
{activePage === "workspace" && (
  <>


  {/* START - ADD NEW CLIENT BUTTON */}

<button
  onClick={() => setShowNewClient(!showNewClient)}
  className="w-full max-w-2xl mx-auto block mb-6 bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
>
  ➕ Create New Client
</button>

{/* EDIT CUSTOMER 
<button
  onClick={() => {
    setNewCustomer(selectedCustomer);
    setShowCreateCustomer(true);
  }}
  className="bg-yellow-500 text-white px-4 py-2 rounded mt-2"
>
  ✏️ Edit Client
</button>
*/}

{/* END - ADD NEW CLIENT BUTTON */}

{/* START - ADD NEW CLIENT FORM */}

{showNewClient && (
  <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg shadow mb-8">
    <h2 className="text-lg font-semibold mb-4">New Client</h2>

    <div className="grid grid-cols-2 gap-4">
      <input
        className="border p-2 rounded"
        placeholder="Full name"
        value={newClient.name}
        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
      />

      <input
        className="border p-2 rounded"
        placeholder="Phone"
        value={newClient.phone}
        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
      />

      <input
        className="border p-2 rounded col-span-2"
        placeholder="Email"
        value={newClient.email}
        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
      />

      <input
        className="border p-2 rounded col-span-2"
        placeholder="Address"
        value={newClient.address}
        onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
      />
    </div>

    <div className="flex gap-3 mt-4">
      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={async () => {
          const res = await fetch(`${API}/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newClient),
          });

          const created = await res.json();

          setShowNewClient(false);
          setNewClient({ name: "", phone: "", email: "", address: "" });

          fetchCustomers();
          setSelectedCustomer(created);
        }}
      >
        Save Client
      </button>

      <button
        className="bg-gray-300 px-4 py-2 rounded"
        onClick={() => setShowNewClient(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

{/* END - ADD NEW CLIENT FORM */}

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

  const res = await fetch(`${API}/services/${v.id}`);
  const data = await res.json();

  setServices(data);

  // 🔥 Always create job card
  setCurrentJob({
    vehicle: v,
    services: data,
    date: data[0]?.created_at || new Date().toISOString(),
  });

  fetchInvoices(v.id);
}}

            /*onClick={async () => {
  setSelectedVehicle(v);
  await fetchServices(v.id, v);   // ✅ pass vehicle object
  fetchInvoices(v.id);
}}*/

            
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

{selectedVehicle && currentJob && (
  <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-4">
    <h3 className="font-semibold mb-1 flex justify-between items-center">
  <span>🧾 Current Job Card</span>
  <span className="text-sm text-gray-500">
    JC-{currentJob.services[0]?.id.slice(0, 6).toUpperCase()}
  </span>
</h3>

<p className="text-sm text-gray-600">
  {selectedCustomer.name} ({selectedCustomer.phone || "No phone"}) —{" "}
  {selectedVehicle.brand} {selectedVehicle.model}
</p>

<p className="text-xs text-gray-500 mb-3">
  Created: {new Date(currentJob.services[0]?.created_at).toLocaleDateString()}
</p>


    <ul className="space-y-2">
      {currentJob.services.map((s) => (
  <div key={s.id} className="flex items-center gap-2">
    <input
      type="checkbox"
      disabled={s.status === "invoiced"}
      checked={selectedForInvoice.includes(s.id)}
      onChange={() => {
        if (s.status === "invoiced") return;

        setSelectedForInvoice((prev) =>
          prev.includes(s.id)
            ? prev.filter((id) => id !== s.id)
            : [...prev, s.id]
        );
      }}
    />

    <input
      className="border p-1 w-48 rounded"
      maxLength={30}
      placeholder="Issue"
      value={s.issue || s.description || ""}
      disabled={s.status === "invoiced"}
      onChange={(e) => {
        const updated = currentJob.services.map((item) =>
          item.id === s.id
            ? { ...item, issue: e.target.value }
            : item
        );
        setCurrentJob({ ...currentJob, services: updated });
      }}
      onBlur={() => updateService(s)}
    />

  <input
  className="border p-1 w-48 rounded"
  placeholder="Service"
  value={s.service || ""}
  maxLength={50}                     // ✅ hard limit (UI)
  disabled={s.status === "invoiced"}
  onChange={(e) => {
    const updated = currentJob.services.map((item) =>
      item.id === s.id
        ? { ...item, service: e.target.value.slice(0, 50) } // ✅ safety for paste
        : item
    );
    setCurrentJob({ ...currentJob, services: updated });
  }}
  onBlur={() => updateService(s)}     // optimistic save
/>

{/*Counter unser service field*/}
<div className="flex flex-col">
  <input
    className="border p-1 w-48 rounded"
    placeholder="Service"
    value={s.service || ""}
    maxLength={50}
    disabled={s.status === "invoiced"}
    onChange={(e) => {
      const updated = currentJob.services.map((item) =>
        item.id === s.id
          ? { ...item, service: e.target.value.slice(0, 50) }
          : item
      );
      setCurrentJob({ ...currentJob, services: updated });
    }}
    onBlur={() => updateService(s)}
  />
  <span className="text-xs text-gray-400 text-right">
    {(s.service || "").length}/30
  </span>
</div>


    <input
      type="number"
      className="border p-1 w-24 rounded"
      value={s.cost || ""}
      disabled={s.status === "invoiced"}
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
  </div>
))}

    </ul>

    <button
  onClick={generateInvoice}
  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  🧾 Generate Invoice
</button>

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
        
        {/*<button className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
          Generate Invoice
        </button>*/}
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

  </>
)}

{/* END OF WORKSPACE PAGE */}


{/* STARTING OF CUSTOMERS PAGE */}
{/*
{activePage === "customers" && (
  <div>
    <h2 className="text-2xl font-semibold mb-4">Customers</h2>

    <ul className="space-y-2">
      {customers.map((c) => (
        <li
          key={c.id}
          className="p-3 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">{c.name}</div>
          <div className="text-sm text-gray-600">{c.phone}</div>
        </li>
      ))}
    </ul>
  </div>
)}

*/}
{/* END OF CUSTOMERS PAGE */}


{/* START OF FINANCE PAGE */}
{activePage === "finance" && (
  <div>
    <h2 className="text-2xl font-semibold mb-4">Finance</h2>

    <ul className="space-y-2">
      {invoices.map((inv) => (
        <li
          key={inv.id}
          className="p-3 border rounded flex justify-between"
        >
          <div>
            <div className="font-semibold">Invoice #{inv.id.slice(0,6)}</div>
            <div className="text-sm text-gray-600">
              {inv.status} — ${inv.total_amount}
            </div>
          </div>

          <a
            href={`${API}/invoices/${inv.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            PDF
          </a>
        </li>
      ))}
    </ul>
  </div>
)}

{/* END OF FINANCE PAGE */}

    </div>
  </div>

  
);

}



export default App;



