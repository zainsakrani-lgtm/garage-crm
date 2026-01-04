import { useEffect, useState } from "react";

const API = "https://garage-crm-backend.onrender.com";

function App() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Garage CRM</h1>

      {/* CUSTOMERS */}
      <h2>Customers</h2>
      <ul>
        {customers.map((c) => (
          <li
            key={c.id}
            style={{ cursor: "pointer", fontWeight: selectedCustomer?.id === c.id ? "bold" : "normal" }}
            onClick={() => {
              setSelectedCustomer(c);
              fetchVehicles(c.id);
            }}
          >
            {c.name}
          </li>
        ))}
      </ul>

      {/* VEHICLES */}
      {selectedCustomer && (
        <>
          <h2>Vehicles of {selectedCustomer.name}</h2>
          <ul>
            {vehicles.map((v) => (
              <li
                key={v.id}
                style={{ cursor: "pointer", fontWeight: selectedVehicle?.id === v.id ? "bold" : "normal" }}
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

      {/* SERVICES */}
      {selectedVehicle && (
        <>
          <h2>Service History</h2>
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
