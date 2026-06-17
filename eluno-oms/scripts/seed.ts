import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// 👇 ADD THIS LINE TO LOAD YOUR ENV FILE
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET!,
);

async function seed() {
  console.log("Seeding database...");

  // Frames
  const frames = [
    {
      sku: "ELN-FR-1001",
      name: "Round Acetate — Black",
      category: "eyeglasses",
      gender: "unisex",
      price_inr: 2999,
      stock_qty: 50,
    },
    {
      sku: "ELN-FR-1002",
      name: "Square Metal — Gold",
      category: "eyeglasses",
      gender: "women",
      price_inr: 3499,
      stock_qty: 30,
    },
    {
      sku: "ELN-FR-1003",
      name: "Aviator Sunglasses",
      category: "sunglasses",
      gender: "men",
      price_inr: 4999,
      stock_qty: 25,
    },
  ];
  await supabase.from("frames").upsert(frames);

  // Lens catalog
  const lenses = [
    {
      lens_type: "single_vision",
      index: 1.56,
      coating: "HMC",
      sla_days: 3,
      price_inr: 1499,
    },
    {
      lens_type: "single_vision",
      index: 1.67,
      coating: "SHMC",
      sla_days: 4,
      price_inr: 2499,
    },
    {
      lens_type: "progressive",
      index: 1.67,
      coating: "Blue",
      sla_days: 5,
      price_inr: 4999,
    },
  ];
  const { data: lensData } = await supabase
    .from("lens_catalog")
    .upsert(lenses)
    .select();

  // Lens inventory
  const inventory = [
    {
      lens_catalog_id: lensData[0].id,
      sph_min: -6.0,
      sph_max: 0.0,
      cyl_min: -2.0,
      cyl_max: 0.0,
      qty_in_stock: 20,
      supplier_lead_days: 3,
    },
    {
      lens_catalog_id: lensData[1].id,
      sph_min: -8.0,
      sph_max: 2.0,
      cyl_min: -4.0,
      cyl_max: 0.0,
      qty_in_stock: 15,
      supplier_lead_days: 4,
    },
    {
      lens_catalog_id: lensData[2].id,
      sph_min: -6.0,
      sph_max: 3.0,
      cyl_min: -2.0,
      cyl_max: 2.0,
      qty_in_stock: 10,
      supplier_lead_days: 5,
    },
  ];
  await supabase.from("lens_inventory").upsert(inventory);

  // Ops team
  const team = [
    {
      name: "Priya — Ops Manager",
      role: "ops_manager",
      store_location: null,
      whatsapp_number: "+919876543210",
      email: "priya@eluno.co",
    },
    {
      name: "Rahul — Chennai Store",
      role: "store_staff",
      store_location: "Chennai",
      whatsapp_number: "+919876543211",
      email: "rahul@eluno.co",
    },
    {
      name: "Anita — Bangalore Store",
      role: "store_staff",
      store_location: "Bangalore",
      whatsapp_number: "+919876543212",
      email: "anita@eluno.co",
    },
  ];
  await supabase.from("ops_team_members").upsert(team);

  // Sample orders
  const { data: framesData } = await supabase.from("frames").select("*");
  const orders = [];
  const statuses = [
    "inventory_check",
    "lens_cutting",
    "coating",
    "qc_pending",
    "qc_pass",
    "assembly",
  ];

  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 10);
    const frame = framesData[Math.floor(Math.random() * framesData.length)];
    const lens = lensData[Math.floor(Math.random() * lensData.length)];

    orders.push({
      order_number: `ELN-2026-${String(i + 1).padStart(5, "0")}`,
      source: "dummy",
      store_location: ["Chennai", "Bangalore", "Online"][
        Math.floor(Math.random() * 3)
      ],
      customer_name: `Customer ${i + 1}`,
      customer_phone: `+9198${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
      frame_id: frame.id,
      lens_catalog_id: lens.id,
      sph_right: -(Math.random() * 6).toFixed(2),
      cyl_right: -(Math.random() * 2).toFixed(2),
      axis_right: Math.floor(Math.random() * 180),
      sph_left: -(Math.random() * 6).toFixed(2),
      cyl_left: -(Math.random() * 2).toFixed(2),
      axis_left: Math.floor(Math.random() * 180),
      pd: (60 + Math.random() * 10).toFixed(1),
      fulfilment_mode: "in_house",
      status: statuses[Math.floor(Math.random() * statuses.length)],
      sla_deadline: new Date(
        Date.now() + (lens.sla_days - daysAgo) * 24 * 60 * 60 * 1000,
      ),
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  await supabase.from("orders").upsert(orders);

  console.log("✓ Database seeded successfully");
}

seed().catch(console.error);
