import Box from './components/Box';

export default function Home() {
  return (
    <main className="flex min-h-screen p-8 items-center justify-center bg-gray-950 text-white">
      <div className="container mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex justify-center min-h-20">
            <w3m-button />
          </div>
          <Box>Hello!</Box>
        </div>
      </div>
    </main>
  );
}
