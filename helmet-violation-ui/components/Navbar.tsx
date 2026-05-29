export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white px-6 py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="font-semibold text-lg">
          Helmet Violation Detection System
        </h1>
        <div className="space-x-6 text-sm">
          <a href="/">Dashboard</a>
          <a href="/violations">Violations</a>
          <a href="/status">System Status</a>
        </div>
      </div>
    </nav>
  );
}
