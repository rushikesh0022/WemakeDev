import Link from "next/link";
import { Activity, ArrowLeft, BrainCircuit, Database, PackageCheck, Search } from "lucide-react";
import { categories, products } from "@/lib/catalog";

export default function AdminPage() {
  const available = products.filter((product) => product.stock > 0);
  const averageRating = available.reduce((sum, product) => sum + product.rating, 0) / Math.max(1, available.length);
  const inventoryUnits = available.reduce((sum, product) => sum + product.stock, 0);

  return <div className="admin-shell"><aside><Link className="admin-brand" href="/"><span>zap</span>ly<i /></Link><nav><a className="active"><Activity /> Overview</a><a><Search /> Search quality</a><a><BrainCircuit /> Query planner</a><a><Database /> Catalog</a></nav><Link href="/"><ArrowLeft /> Storefront</Link></aside><main>
    <header><div><span>LOCAL MVP CONTROL ROOM</span><h1>System state</h1><p>Only observed catalog values are displayed. Behavioral metrics appear after real events exist.</p></div><div className="status-pill"><i /> Catalog loaded</div></header>
    <section className="metric-grid"><article><span>Catalog products</span><h2>{products.length}</h2><p><PackageCheck /> {categories.length} departments</p></article><article><span>Available products</span><h2>{available.length}</h2><p>Calculated from current stock</p></article><article><span>Inventory units</span><h2>{inventoryUnits}</h2><p>Across the local catalog</p></article><article><span>Average rating</span><h2>{averageRating.toFixed(2)}</h2><p>From current product data</p></article></section>
    <section className="admin-grid"><article className="admin-chart"><header><div><span>DEPARTMENT INVENTORY</span><h2>Live catalog distribution</h2></div></header><div className="bar-chart">{categories.slice(0,8).map((category)=>{const count=products.filter((product)=>product.category===category.id&&product.stock>0).length;return <div key={category.id} style={{height:`${Math.max(18,(count/Math.max(1,available.length))*500)}%`}}><span>{category.name}</span><b>{count}</b></div>})}</div></article><article className="pipeline-card"><span>REQUEST PIPELINE</span><h2>Data-driven stages</h2>{["Measure direct-search confidence","Generate free-form requirements","Retrieve catalog candidates","Apply constraints and rank","Build editable basket"].map((item,index)=><div key={item}><b>{String(index+1).padStart(2,"0")}</b><p>{item}<small>{index===1?"Model-generated without intent enums":"Grounded in current data"}</small></p></div>)}</article></section>
    <section className="event-table"><header><div><span>BEHAVIOR EVENTS</span><h2>No fabricated analytics</h2></div></header><p>Impressions, clicks, additions, removals and purchases will appear here after the event store is connected.</p></section>
  </main></div>;
}
