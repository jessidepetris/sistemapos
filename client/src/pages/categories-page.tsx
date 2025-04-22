import React from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { CategoryManager } from "@/components/categories/CategoryManager";

export default function CategoriesPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Categorías de Productos" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 h-full gap-6">
            <CategoryManager />
          </div>
        </main>
      </div>
    </div>
  );
}