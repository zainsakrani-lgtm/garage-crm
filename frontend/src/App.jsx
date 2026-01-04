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
    <div style={{ padding: 20 }}>
      <h1>Garage CRM</h1>

      <h2>Customers</h2>
      <ul>
        {customers.map((c) => (
          <li
            key={c.id}
            style={{
              cursor: "pointer",
              fontWeight: selectedCustomer?.id === c.id ? "bold" : "normal"
            }}
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

      {selectedCustomer && (
        <>
          <h2>Vehicles of {selectedCustomer.name}</h2>

          <form onSubmit={addVehicle}>
            <input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} required />
            <input placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
            <input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
            <button type="submit">Add Vehicle</button>
          </form>

          <ul>
            {vehicles.map((v) => (
              <li
                key={v.id}
                style={{
                  cursor: "pointer",
                  fontWeight: selectedVehicle?.id === v.id ? "bold" : "normal"
                }}
                onClick={() => {
                  setSelectedVehicle(v);
                  fetchServices(v.id);
                }}
              >
                {v.brand} {v.model} ({v.plate_number})
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedVehicle && (
        <>
          <h2>Service History</h2>

          <form onSubmit={addService}>
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
            <button type="submit">Add Service</button>
          </form>

          <ul>
            {services.map((s) => (
              <li key={s.id}>
                {s.service_date} – {s.description} – ${s.cost}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
