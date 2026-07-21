export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-b2w-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-b2w-red font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold text-b2w-navy mb-2">Access Denied</h1>
        <p className="text-b2w-body text-sm mb-8">
          You do not have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <a
          href="/"
          className="inline-block bg-b2w-brand text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-b2w-brand-dark transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
