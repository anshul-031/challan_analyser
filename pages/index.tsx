import { AppContainer } from '@/components/AppContainer';
import { Toaster } from '@/components/ui/toast-simple';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Challan Analyser</title>
        <meta 
          name="description" 
          content="Analyze e-challans for multiple vehicle registration numbers" 
        />
      </Head>
      <main className="min-h-screen bg-background">
        <AppContainer />
        <Toaster />
      </main>
    </>
  );
}