export default function Status() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">System Status</h2>
      <div className="bg-white rounded shadow p-6 space-y-2">
        <p>Helmet Model: ✅ Loaded</p>
        <p>Plate Model: ✅ Loaded</p>
        <p>OCR Engine: ✅ Active</p>
        <p>Database: ✅ Connected</p>
      </div>
    </>
  );
}
