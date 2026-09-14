export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-jubilee-200 border-t-jubilee-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-jubilee-700 font-medium">Loading...</p>
      </div>
    </div>
  );
}
