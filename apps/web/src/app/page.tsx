import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">AniDay</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Anime catalog & streaming
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <p className="col-span-full text-center py-20 text-muted-foreground">
          Releases will appear here
        </p>
      </div>
    </div>
  );
}
