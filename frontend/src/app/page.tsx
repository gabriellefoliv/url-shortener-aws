'use client'

import { useState } from 'react';
import Link from 'next/link';
import DarkVeil from '@/components/ui/dark-veil';
import SplitText from '@/components/ui/split-text';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';
import Copy from '@/components/comp-105';

export default function Home() {
  const [longUrl, setLongUrl] = useState<string>('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShortUrl('');
    setLoading(true);

    if (!longUrl) {
      setError('Por favor, insira uma URL.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: longUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setShortUrl(data.shortUrl);
        setMessage('URL encurtada com sucesso!');
      } else {
        setError(data.message || 'Ocorreu um erro ao encurtar a URL.');
      }
    } catch (err) {
      console.error('Erro ao conectar com a API:', err);
      setError('Não foi possível conectar ao serviço de encurtamento. Verifique sua conexão ou a URL da API.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl).then(() => {
        setMessage('URL copiada para a área de transferência!');
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        setError('Falha ao copiar a URL. Por favor, copie manualmente.');
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans opacity-100">
          <DarkVeil/>
          <SplitText 
            className=" text-indigo-300 text-6xl font-bold mb-6 z-10"
            text="Chop Chop"

          />
          {/* <h1 className='text-indigo-300 font-bold text-6xl mb-4 text-center z-10'>Chop Chop</h1> */}
          <div className="bg-zinc-950 p-8 rounded-lg shadow-xl w-full max-w-md z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="url"
                  id="longUrl"
                  className="mt-1 text-white block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Digite aqui uma URL para encurtar..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  required
                />
              </div>
              <Button
                effect="expandIcon" icon={Scissors} iconPlacement="right"
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-950 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Encurtando...' : 'Encurtar URL'}
              </Button>

            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
                {error}
              </div>
            )}

            {shortUrl && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Curta
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    className="flex-grow px-4 py-2 border border-gray-500 rounded-md bg-gray-50 text-gray-900 text-sm overflow-hidden whitespace-nowrap overflow-ellipsis outline-none"
                    value={shortUrl}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="transparent"
                  >
                    <Copy />
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-950 rounded-md text-sm" role="status">
                {message}
              </div>
            )}

          </div>
          <p className='text-center text-gray-500 mt-4 z-10'>
            Conheça outros projetos meus <Link href="https://gabicodes.com" className='underline text-sky-700'>aqui</Link>
          </p>
        </div>
  );
}