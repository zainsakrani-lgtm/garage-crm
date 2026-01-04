

/*To Use Supabase*/ 
require("dotenv").config();
const supabase = require("./supabaseClient");



/*index.js*/ 


const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());

/*app.use(cors({ origin: "http://localhost:5173" }));*/
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Garage CRM Backend is running 🚗");
});

/*Test route for customer*/

app.get("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/*Add “Create Customer” API (POST)*/

/*Send customer data → backend → database > Save it > Return saved customer*/

app.post("/customers", async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert([{ name, phone, email }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});


/*Initial Route*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});