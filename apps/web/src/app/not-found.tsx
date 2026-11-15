import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section pt-36">
      <div className="wrap">
        <div role="alert" className="panel max-w-2xl p-8">
          <p className="eyebrow">Not found</p>
          <h1 className="mt-4 font-display text-4xl font-light">
            There is no page here
          </h1>
          <p className="lead">The link may be old or mistyped.</p>
          <Link href="/" className="btn btn-accent btn-sm mt-6">
            <span className="btn-label">Go to the home page</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
