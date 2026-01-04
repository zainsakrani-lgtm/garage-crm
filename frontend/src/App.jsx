import { useEffect, useState } from "react";

const API = "https://garage-crm-backend.onrender.com";

function App() {
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

      {/* CUSTOMERS */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Customers</h2>
        <ul className="space-y-1">
          {customers.map((c) => (
            <li
              key={c.id}
              className={`p-2 rounded cursor-pointer ${
                selectedCustomer?.id === c.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => {
                setSelectedCustomer(c);
                setSelectedVehicle(null);
                fetchVehicles(c.id);
              }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      {/* VEHICLES */}
      {selectedCustomer && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Vehicles of {selectedCustomer.name}
          </h2>

          <form
            onSubmit={addVehicle}
            className="grid grid-cols-2 gap-2 mb-4"
          >
            <input className="border p-2 rounded" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <input className="border p-2 rounded" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} required />
            <input className="border p-2 rounded" placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
            <button className="col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Add Vehicle
            </button>
          </form>

          <ul className="space-y-1">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedVehicle?.id === v.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setSelectedVehicle(v);
                  fetchServices(v.id);
                }}
              >
                {v.brand} {v.model} ({v.plate_number})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SERVICES */}
      {selectedVehicle && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Service History</h2>

          <form
            onSubmit={addService}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <input className="border p-2 rounded col-span-3" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            <input className="border p-2 rounded" type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(e.target.value)} />
            <input className="border p-2 rounded" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700 col-span-3">
              Add Service
            </button>
          </form>

          <ul className="space-y-1">
            {services.map((s) => (
              <li key={s.id} className="p-2 bg-gray-100 rounded">
                📅 {s.service_date} — {s.description} — 💲{s.cost}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

}

export default App;
