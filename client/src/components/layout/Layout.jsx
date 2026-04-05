import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <Link
        to="/profile"
        className="fixed left-4 bottom-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
        aria-label="Go to profile"
      >
        <span className="text-lg font-bold">OP</span>
      </Link>
    </div>
  );
}
