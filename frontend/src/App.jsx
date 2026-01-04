/* Clean the React FE App*/

import { useEffect, useState } from "react";

function App() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const fetchCustomers = () => {
    /*Replace it with Render URL later */
    fetch("http://localhost:5000/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer = (e) => {
    e.preventDefault();
    /*Replace it with Render url later */

    fetch("http://localhost:5000/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone, email }),
    })
      .then((res) => res.json())
      .then(() => {
        setName("");
        setPhone("");
        setEmail("");
        fetchCustomers();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h1>Garage CRM</h1>

      <h2>Add Customer</h2>
      <form onSubmit={addCustomer}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br /><br />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <br /><br />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <button type="submit">Add Customer</button>
      </form>

      <h2>Customers</h2>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name} – {c.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

