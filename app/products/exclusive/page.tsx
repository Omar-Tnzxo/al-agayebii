"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ProductGrid } from "../product-components/ProductGrid";

export default function ExclusiveProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?exclusive=true")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700 font-tajawal">المنتجات الحصرية فقط</h1>
        <Link href="/products" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all font-tajawal">
          <Star className="w-4 h-4" />
          كل المنتجات
        </Link>
      </div>
      <ProductGrid products={products} loading={loading} viewMode="grid" currency="EGP" />
    </div>
  );
} 